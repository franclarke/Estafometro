import { getServerEnv } from "@/lib/config/env";
import { defaultRecommendations } from "@/lib/copy/es-ar";
import { logger } from "@/lib/logger";
import { trackEvent } from "@/server/analytics/track-event";
import { analyticsEvents } from "@/server/analytics/events";
import { createAnalysisRun } from "@/server/analysis-runs/repository";
import { buildCaseFingerprint } from "@/server/candidate-patterns/fingerprint";
import { upsertCandidatePattern } from "@/server/candidate-patterns/upsert";
import { getCaseByPublicId, updateCaseRecord } from "@/server/cases/repository";
import { buildActionPlan } from "@/server/explanations/build-action-plan";
import { buildFollowupQuestions } from "@/server/explanations/build-followup-questions";
import { buildRecommendations } from "@/server/explanations/build-recommendations";
import { buildLimitsNotice } from "@/server/explanations/limits-notice";
import { buildUserSummary } from "@/server/explanations/build-user-summary";
import { getCaseResult } from "@/server/cases/result";
import { listEvidenceByCaseId } from "@/server/evidence/repository";
import { runExternalChecks } from "@/server/enrichment/run-checks";
import { replaceCaseEntities } from "@/server/entities/repository";
import { normalizeEntities } from "@/server/extraction/normalize-entities";
import { normalizeExtractionForRisk } from "@/server/extraction/normalize-for-risk";
import { runGeminiExtraction } from "@/server/extraction/run-extraction";
import { replaceExternalChecks, replacePatternMatches } from "@/server/patterns/repository";
import { matchOfficialPatterns } from "@/server/patterns/match-official";
import { preprocessCase } from "@/server/preprocessing";
import { applyPrivacyModeAfterAnalysis } from "@/server/privacy/retention-policy";
import { applyHardRules } from "@/server/risk/apply-hard-rules";
import { buildConfidenceReason, calibrateRiskDecision } from "@/server/risk/calibration";
import { computeConfidence } from "@/server/risk/confidence";
import { deriveRiskFactors } from "@/server/risk/factors";
import { computeFinalScore } from "@/server/risk/final-score";
import { deriveRiskLevel } from "@/server/risk/risk-band";
import { computeSubscores } from "@/server/risk/subscores";
import { deriveBehavioralSignals } from "@/server/signals/behavioral-signals";
import { mergeSignals } from "@/server/signals/merge-signals";
import { replaceCaseSignals } from "@/server/signals/repository";
import { detectRuleSignals } from "@/server/signals/detectors/rule-signals";
import type { AnalysisResultPayload, PatternMatchSummary, Subscores } from "@/types/analysis";
import type { RiskLevel } from "@/types/domain";

const riskRank: RiskLevel[] = ["low", "medium", "high", "very_high"];

function floorRiskLevel(current: RiskLevel, floor: RiskLevel) {
  return riskRank.indexOf(floor) > riskRank.indexOf(current) ? floor : current;
}

function minimumScoreForLevel(level: RiskLevel) {
  switch (level) {
    case "medium":
      return 25;
    case "high":
      return 50;
    case "very_high":
      return 75;
    default:
      return 0;
  }
}

function buildPatternRulesFloor(input: {
  signalCodes: string[];
  matchedPatterns: Awaited<ReturnType<typeof matchOfficialPatterns>>;
}) {
  const codes = new Set(input.signalCodes);
  let level: RiskLevel = "low";
  const applied: string[] = [];

  for (const match of input.matchedPatterns) {
    level = floorRiskLevel(level, match.definition.minimumRiskLevel);
    if (match.definition.minimumRiskLevel !== "low") {
      applied.push(`${match.definition.code}_minimum_${match.definition.minimumRiskLevel}`);
    }

    for (const hardRule of match.definition.hardRules) {
      if (hardRule.when.every((code) => codes.has(code))) {
        level = floorRiskLevel(level, hardRule.floor);
        applied.push(`${match.definition.code}_${hardRule.when.join("_")}_${hardRule.floor}`);
      }
    }
  }

  return { level, applied };
}

function buildAnalyzedEvidenceSummary(
  evidence: Awaited<ReturnType<typeof listEvidenceByCaseId>>,
) {
  return {
    screenshots: evidence.filter((item) => item.evidenceType === "screenshot").length,
    urls: evidence
      .filter((item) => item.evidenceType === "url")
      .map((item) => item.rawText)
      .filter((value): value is string => Boolean(value)),
    phones: evidence
      .filter((item) => item.evidenceType === "phone")
      .map((item) => item.rawText)
      .filter((value): value is string => Boolean(value)),
  };
}

export async function runCaseAnalysis(
  publicId: string,
  options: { force?: boolean } = {},
): Promise<AnalysisResultPayload> {
  const startedAt = Date.now();
  const env = getServerEnv();

  const caseRecord = await getCaseByPublicId(publicId);
  if (!options.force && (caseRecord.status === "analyzed" || caseRecord.status === "partial")) {
    return getCaseResult(publicId);
  }

  await updateCaseRecord(caseRecord.id, { status: "processing" });
  await trackEvent({ eventType: analyticsEvents.analysisStarted, caseId: caseRecord.id });

  try {
    const evidence = await listEvidenceByCaseId(caseRecord.id);
    const analyzedEvidence = buildAnalyzedEvidenceSummary(evidence);
    const preprocessing = await preprocessCase({ caseRecord, evidence });
    const extractionRun = await runGeminiExtraction({
      mergedCaseText: preprocessing.mergedCaseText,
      preprocessedEvidence: preprocessing.preprocessedEvidence,
    });
    let extraction = extractionRun.extraction;

    const normalizedEntities = normalizeEntities([...preprocessing.parsedEntities, ...extraction.entities]);
    await replaceCaseEntities(caseRecord.id, normalizedEntities);

    const ruleSignals = detectRuleSignals(preprocessing.mergedCaseText, normalizedEntities);
    const normalizedExtraction = normalizeExtractionForRisk({
      extraction,
      ruleSignals,
      mergedCaseText: preprocessing.mergedCaseText,
    });
    extraction = normalizedExtraction.extraction;

    const enrichment = await runExternalChecks({
      caseType: extraction.caseType,
      entities: normalizedEntities,
      signalCodes: ruleSignals.map((signal) => signal.code),
    });
    const behavioralSignals = deriveBehavioralSignals(extraction.behavioralVectors);

    const mergedSignals = mergeSignals({
      llmSignals: extraction.signals,
      behavioralSignals,
      ruleSignals,
      enrichmentSignals: enrichment.derivedSignals,
    });

    await replaceCaseSignals(caseRecord.id, mergedSignals);

    const patternMatches = await matchOfficialPatterns({
      signalCodes: mergedSignals.map((signal) => signal.code),
      caseType: extraction.caseType,
      narrativeTheme: extraction.narrativeTheme,
    });

    await replacePatternMatches(
      caseRecord.id,
      patternMatches.map((match) => ({
        patternId: match.id,
        patternVersionId: match.versionId,
        matchScore: match.matchScore,
        matchedSignals: match.definition.coreSignals.filter((code) =>
          mergedSignals.some((signal) => signal.code === code),
        ),
      })),
    );

    await replaceExternalChecks(
      caseRecord.id,
      enrichment.findings.map((finding) => ({
        checkType: finding.checkType,
        status: finding.status,
        resultSummary: finding.summary,
        resultJson: finding.result,
        signalImpact: { derivedSignals: finding.derivedSignals },
      })),
    );

    const subscores = computeSubscores(mergedSignals);
    const baseScore = computeFinalScore(subscores);
    let riskLevel = deriveRiskLevel(baseScore);

    const baseHardRules = applyHardRules(mergedSignals.map((signal) => signal.code), riskLevel);
    riskLevel = baseHardRules.level;

    const patternFloor = buildPatternRulesFloor({
      signalCodes: mergedSignals.map((signal) => signal.code),
      matchedPatterns: patternMatches,
    });
    riskLevel = floorRiskLevel(riskLevel, patternFloor.level);
    const hardRulesApplied = [...baseHardRules.applied, ...patternFloor.applied];
    const riskFactors = deriveRiskFactors(mergedSignals);
    const calibratedRisk = calibrateRiskDecision({
      baseScore,
      baseLevel: riskLevel,
      signalCodes: mergedSignals.map((signal) => signal.code),
      factors: riskFactors,
      hardRulesApplied,
    });
    riskLevel = calibratedRisk.level;
    const finalScore = Math.max(calibratedRisk.score, minimumScoreForLevel(riskLevel));

    const confidence = computeConfidence({
      signalCount: mergedSignals.length,
      hasExternal: enrichment.findings.some((finding) => finding.status !== "skipped"),
      hasPatternMatch: patternMatches.length > 0,
      hasNarrative: Boolean(preprocessing.mergedCaseText),
    });
    const confidenceReason = buildConfidenceReason({
      confidence,
      signalCount: mergedSignals.length,
      hasExternal: enrichment.findings.some((finding) => finding.status !== "skipped"),
      hasPatternMatch: patternMatches.length > 0,
      hasNarrative: Boolean(preprocessing.mergedCaseText),
    });

    const matchedPatternDefinitions = patternMatches.map((match) => match.definition);
    const recommendations =
      buildRecommendations({
        riskLevel,
        matchedPatterns: matchedPatternDefinitions,
      }) || defaultRecommendations[riskLevel];

    const uncertainties =
      extraction.uncertainties.length > 0
        ? extraction.uncertainties
        : mergedSignals.length < 2
          ? ["El caso tiene poca evidencia y conviene verificar por un canal independiente."]
          : [];

    const summary = buildUserSummary({
      extraction,
      mergedCaseText: preprocessing.mergedCaseText,
    });
    const actionPlan = buildActionPlan({
      riskLevel,
      caseType: extraction.caseType,
      signals: mergedSignals,
    });
    const followupQuestions = buildFollowupQuestions({
      caseType: extraction.caseType,
      signals: mergedSignals,
      uncertainties,
      suggestedFollowupQuestion: extraction.suggestedFollowupQuestion,
    });

    if (!patternMatches.length || (patternMatches[0]?.matchScore ?? 0) < 0.85) {
      const fingerprint = buildCaseFingerprint(extraction);
      await upsertCandidatePattern({
        caseId: caseRecord.id,
        fingerprint: fingerprint.fingerprint,
        signatureComponents: fingerprint.signature,
      });
    }

    const analysisStatus = extractionRun.usedFallback || enrichment.findings.some((finding) => finding.status === "failed")
      ? "partial"
      : "success";

    await createAnalysisRun({
      caseId: caseRecord.id,
      pipelineVersion: "pipeline.v1",
      promptVersion: extractionRun.promptVersion,
      llmModel: env.GEMINI_MODEL,
      status: analysisStatus,
      rawLlmResponse: extractionRun.rawResponse,
      subscores: {
        ...subscores,
        behavioral_vectors: extraction.behavioralVectors,
        analyzed_evidence: analyzedEvidence,
        uncertainties,
        recommendations,
        action_plan: actionPlan,
        risk_trace: {
          ...calibratedRisk.trace,
          extraction_adjustments: normalizedExtraction.adjustments,
          base_score: baseScore,
          final_score: finalScore,
          final_level: riskLevel,
        },
        confidence_reason: confidenceReason,
        suggested_followup_question: extraction.suggestedFollowupQuestion,
      } satisfies Subscores & Record<string, unknown>,
      hardRulesApplied,
      durationMs: Date.now() - startedAt,
    });

    const updatedCase = await updateCaseRecord(caseRecord.id, {
      status: analysisStatus === "success" ? "analyzed" : "partial",
      merged_case_text: preprocessing.mergedCaseText,
      case_type: extraction.caseType,
      summary,
      final_risk_score: finalScore,
      final_risk_level: riskLevel,
      confidence,
      analyzed_at: new Date().toISOString(),
    });

    await applyPrivacyModeAfterAnalysis({
      caseId: caseRecord.id,
      privacyMode: updatedCase.privacyMode,
    });

    await trackEvent({
      eventType: analyticsEvents.analysisCompleted,
      caseId: caseRecord.id,
      properties: {
        status: updatedCase.status,
        riskLevel,
        usedFallback: extractionRun.usedFallback,
      },
    });

    return {
      publicId: updatedCase.publicId,
      status: updatedCase.status,
      caseType: extraction.caseType,
      summary,
      risk: {
        level: riskLevel,
        score: finalScore,
        confidence,
        explanationSummary: calibratedRisk.explanationSummary,
        topFactors: calibratedRisk.topFactors,
        confidenceReason,
      },
      signals: mergedSignals,
      externalFindings: enrichment.findings.map((finding) => ({
        type: finding.checkType,
        status: finding.status,
        summary: finding.summary,
      })),
      patternMatches: patternMatches.map<PatternMatchSummary>((match) => ({
        patternCode: match.definition.code,
        patternName: match.definition.name,
        matchScore: Number(match.matchScore.toFixed(2)),
      })),
      uncertainties,
      recommendations,
      actionPlan,
      followupQuestions,
      limitsNotice: buildLimitsNotice(),
      suggestedFollowupQuestion: extraction.suggestedFollowupQuestion,
      behavioralVectors: extraction.behavioralVectors,
      analyzedEvidence,
      analyzedAt: updatedCase.analyzedAt,
    };
  } catch (error) {
    logger.error({ error, publicId }, "Case analysis failed");
    await updateCaseRecord(caseRecord.id, { status: "error" });
    await createAnalysisRun({
      caseId: caseRecord.id,
      pipelineVersion: "pipeline.v1",
      promptVersion: "unknown",
      llmModel: env.GEMINI_MODEL,
      status: "error",
      durationMs: Date.now() - startedAt,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    await trackEvent({
      eventType: analyticsEvents.analysisFailed,
      caseId: caseRecord.id,
      properties: {
        message: error instanceof Error ? error.message : "Unknown error",
      },
    });
    throw error;
  }
}
