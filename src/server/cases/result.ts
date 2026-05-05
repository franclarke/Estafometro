import { getLatestAnalysisRun } from "@/server/analysis-runs/repository";
import { getCaseByPublicId } from "@/server/cases/repository";
import { buildActionPlan } from "@/server/explanations/build-action-plan";
import { buildFollowupQuestions } from "@/server/explanations/build-followup-questions";
import { buildRecommendations } from "@/server/explanations/build-recommendations";
import { buildLimitsNotice } from "@/server/explanations/limits-notice";
import { listExternalChecks, listPatternMatches } from "@/server/patterns/repository";
import { buildConfidenceReason } from "@/server/risk/calibration";
import { deriveRiskFactors } from "@/server/risk/factors";
import { getSignalDefinition } from "@/server/signals/catalog";
import { listCaseSignals } from "@/server/signals/repository";
import type { AnalysisResultPayload, BehavioralVectors, RiskFactor, RiskTrace } from "@/types/analysis";
import type { PatternDefinition } from "@/types/patterns";

function dedupeExternalFindings(
  findings: AnalysisResultPayload["externalFindings"],
): AnalysisResultPayload["externalFindings"] {
  const seen = new Set<string>();

  return findings.filter((finding) => {
    const key = `${finding.type}:${finding.status}:${finding.summary}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export async function getCaseResult(publicId: string): Promise<AnalysisResultPayload> {
  if (publicId.startsWith("demo-") || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      publicId,
      status: "partial",
      caseType: "mixed",
      summary: "El caso muestra señales de apuro y conviene frenar antes de transferir o compartir datos.",
      risk: {
        level: "medium",
        score: 46,
        confidence: 0.58,
        explanationSummary: "El nivel surge principalmente por apuro o presion temporal.",
        topFactors: [
          {
            code: "time_pressure",
            label: "Apuro o presion temporal",
            description: "El caso usa urgencia, escasez o plazo corto para reducir la verificacion.",
            impact: "risk",
            severity: "medium",
            signalCodes: ["behavior_artificial_time_pressure_medium"],
          },
        ],
        confidenceReason: "Confianza moderada: hay pocas senales detectadas.",
      },
      signals: [
        {
          code: "behavior_artificial_time_pressure_medium",
          description: "La contraparte mete urgencia o escasez para limitar la verificación.",
          userLabel: "Apuro artificial",
          severity: "medium",
          groupName: "behavioral",
          weight: 12,
          confidence: 0.8,
          sources: ["demo"],
        },
      ],
      externalFindings: [],
      patternMatches: [],
      uncertainties: ["No se verificó la identidad real de la persona o entidad que contactó."],
      recommendations: [
        "No transfieras ni compartas datos todavía.",
        "Verificá por un canal oficial o con una persona de confianza.",
      ],
      actionPlan: buildActionPlan({
        riskLevel: "medium",
        caseType: "mixed",
        signals: [
          {
            code: "behavior_artificial_time_pressure_medium",
            severity: "medium",
          },
        ],
      }),
      followupQuestions: buildFollowupQuestions({
        caseType: "mixed",
        signals: [{ code: "behavior_artificial_time_pressure_medium" }],
        uncertainties: ["No se verifico la identidad real de la persona o entidad que contacto."],
        suggestedFollowupQuestion: "Te pidieron pagar o verificar por fuera del canal original?",
      }),
      limitsNotice: buildLimitsNotice(),
      suggestedFollowupQuestion: "¿Te pidieron pagar o verificar por fuera del canal original?",
      analyzedAt: null,
    };
  }

  const caseRecord = await getCaseByPublicId(publicId);
  const [signals, externalChecks, patternMatches, latestRun] = await Promise.all([
    listCaseSignals(caseRecord.id),
    listExternalChecks(caseRecord.id),
    listPatternMatches(caseRecord.id),
    getLatestAnalysisRun(caseRecord.id),
  ]);

  const subscores = (latestRun?.subscores ?? {}) as Record<string, unknown>;
  const uncertainties = Array.isArray(subscores.uncertainties) ? (subscores.uncertainties as string[]) : [];
  const recommendedActions = Array.isArray(subscores.recommendations)
    ? (subscores.recommendations as string[])
    : [];
  const suggestedFollowupQuestion =
    typeof subscores.suggested_followup_question === "string"
      ? (subscores.suggested_followup_question as string)
      : null;
  const behavioralVectors =
    typeof subscores.behavioral_vectors === "object" && subscores.behavioral_vectors
      ? (subscores.behavioral_vectors as BehavioralVectors)
      : undefined;
  const analyzedEvidence =
    typeof subscores.analyzed_evidence === "object" && subscores.analyzed_evidence
      ? (subscores.analyzed_evidence as AnalysisResultPayload["analyzedEvidence"])
      : undefined;
  const storedActionPlan =
    typeof subscores.action_plan === "object" && subscores.action_plan
      ? (subscores.action_plan as AnalysisResultPayload["actionPlan"])
      : undefined;
  const storedRiskTrace =
    typeof subscores.risk_trace === "object" && subscores.risk_trace
      ? (subscores.risk_trace as RiskTrace & { extraction_adjustments?: string[] })
      : undefined;
  const storedConfidenceReason =
    typeof subscores.confidence_reason === "string" ? (subscores.confidence_reason as string) : null;
  const normalizedSignals = signals.map((signal) => ({
    code: signal.signalCode,
    description: getSignalDefinition(signal.signalCode)?.description ?? signal.signalCode,
    userLabel: getSignalDefinition(signal.signalCode)?.userLabel ?? signal.signalCode,
    severity: getSignalDefinition(signal.signalCode)?.severity ?? "medium",
    groupName: getSignalDefinition(signal.signalCode)?.groupName ?? "interaction",
    weight: signal.weight,
    confidence: signal.confidence,
    sources: signal.sources,
  }));
  const riskLevel = caseRecord.finalRiskLevel ?? "medium";
  const actionPlan =
    storedActionPlan ??
    buildActionPlan({
      riskLevel,
      caseType: caseRecord.caseType,
      signals: normalizedSignals,
    });
  const followupQuestions = buildFollowupQuestions({
    caseType: caseRecord.caseType,
    signals: normalizedSignals,
    uncertainties,
    suggestedFollowupQuestion,
  });
  const factors = storedRiskTrace?.factors?.length ? storedRiskTrace.factors : deriveRiskFactors(normalizedSignals);
  const topFactors = factors.filter((factor): factor is RiskFactor => factor.impact === "risk").slice(0, 5);
  const explanationSummary =
    storedRiskTrace?.explanationSummary ??
    (topFactors.length
      ? `El nivel surge principalmente por ${topFactors.slice(0, 3).map((factor) => factor.label.toLowerCase()).join(", ")}.`
      : "No vemos senales criticas claras con la evidencia disponible.");
  const confidenceReason =
    storedConfidenceReason ??
    buildConfidenceReason({
      confidence: caseRecord.confidence ?? 0,
      signalCount: normalizedSignals.length,
      hasExternal: externalChecks.some((finding) => finding.status !== "skipped"),
      hasPatternMatch: patternMatches.length > 0,
      hasNarrative: Boolean(caseRecord.mergedCaseText ?? caseRecord.narrativeText),
    });

  return {
    publicId: caseRecord.publicId,
    status: caseRecord.status,
    caseType: caseRecord.caseType,
    summary: caseRecord.summary ?? "Todavía no hay un resumen disponible para este caso.",
    risk: {
      level: riskLevel,
      score: caseRecord.finalRiskScore ?? 0,
      confidence: caseRecord.confidence ?? 0,
      explanationSummary,
      topFactors,
      confidenceReason,
    },
    signals: normalizedSignals,
    externalFindings: dedupeExternalFindings(
      externalChecks.map((item) => ({
        type: item.type as AnalysisResultPayload["externalFindings"][number]["type"],
        status: item.status as AnalysisResultPayload["externalFindings"][number]["status"],
        summary: item.summary,
      })),
    ),
    patternMatches,
    uncertainties,
    recommendations: recommendedActions.length
      ? recommendedActions
      : buildRecommendations({
          riskLevel,
          matchedPatterns: patternMatches.map(
            (item) =>
              ({
                code: item.patternCode,
                name: item.patternName,
                category: item.patternCode,
                summary: item.patternName,
                coreSignals: item.matchedSignals,
                highWeightSignals: [],
                hardRules: [],
                counterSignals: [],
                variantExamples: [],
                recommendedActions: [],
                minimumRiskLevel: riskLevel,
              }) satisfies PatternDefinition,
          ),
        }),
    actionPlan,
    followupQuestions,
    limitsNotice: buildLimitsNotice(),
    suggestedFollowupQuestion,
    ...(behavioralVectors ? { behavioralVectors } : {}),
    ...(analyzedEvidence ? { analyzedEvidence } : {}),
    analyzedAt: caseRecord.analyzedAt,
  };
}
