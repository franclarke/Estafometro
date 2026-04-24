import { getLatestAnalysisRun } from "@/server/analysis-runs/repository";
import { getCaseByPublicId } from "@/server/cases/repository";
import { buildRecommendations } from "@/server/explanations/build-recommendations";
import { buildLimitsNotice } from "@/server/explanations/limits-notice";
import { listExternalChecks, listPatternMatches } from "@/server/patterns/repository";
import { getSignalDefinition } from "@/server/signals/catalog";
import { listCaseSignals } from "@/server/signals/repository";
import type { AnalysisResultPayload, BehavioralVectors } from "@/types/analysis";
import type { PatternDefinition } from "@/types/patterns";

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

  return {
    publicId: caseRecord.publicId,
    status: caseRecord.status,
    caseType: caseRecord.caseType,
    summary: caseRecord.summary ?? "Todavía no hay un resumen disponible para este caso.",
    risk: {
      level: caseRecord.finalRiskLevel ?? "medium",
      score: caseRecord.finalRiskScore ?? 0,
      confidence: caseRecord.confidence ?? 0,
    },
    signals: signals.map((signal) => ({
      code: signal.signalCode,
      description: getSignalDefinition(signal.signalCode)?.description ?? signal.signalCode,
      userLabel: getSignalDefinition(signal.signalCode)?.userLabel ?? signal.signalCode,
      severity: getSignalDefinition(signal.signalCode)?.severity ?? "medium",
      groupName: getSignalDefinition(signal.signalCode)?.groupName ?? "interaction",
      weight: signal.weight,
      confidence: signal.confidence,
      sources: signal.sources,
    })),
    externalFindings: externalChecks.map((item) => ({
      type: item.type as AnalysisResultPayload["externalFindings"][number]["type"],
      status: item.status as AnalysisResultPayload["externalFindings"][number]["status"],
      summary: item.summary,
    })),
    patternMatches,
    uncertainties,
    recommendations: recommendedActions.length
      ? recommendedActions
      : buildRecommendations({
          riskLevel: caseRecord.finalRiskLevel ?? "medium",
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
                minimumRiskLevel: caseRecord.finalRiskLevel ?? "medium",
              }) satisfies PatternDefinition,
          ),
        }),
    limitsNotice: buildLimitsNotice(),
    suggestedFollowupQuestion,
    ...(behavioralVectors ? { behavioralVectors } : {}),
    ...(analyzedEvidence ? { analyzedEvidence } : {}),
    analyzedAt: caseRecord.analyzedAt,
  };
}
