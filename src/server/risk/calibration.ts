import { clamp } from "@/lib/utils";
import { hasRiskFactor } from "@/server/risk/factors";
import type { RiskFactor, RiskTrace } from "@/types/analysis";
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

function buildExplanationSummary(level: RiskLevel, topFactors: RiskFactor[]) {
  const labels = topFactors
    .filter((factor) => factor.impact === "risk")
    .slice(0, 3)
    .map((factor) => factor.label.toLowerCase());

  if (!labels.length) {
    return level === "low"
      ? "No vemos senales criticas claras con la evidencia disponible."
      : "El nivel surge de senales parciales que conviene verificar.";
  }

  return `El nivel surge principalmente por ${labels.join(", ")}.`;
}

export function buildConfidenceReason(input: {
  confidence: number;
  signalCount: number;
  hasExternal: boolean;
  hasPatternMatch: boolean;
  hasNarrative: boolean;
}) {
  const reasons: string[] = [];

  if (!input.hasNarrative) {
    reasons.push("hay poca narrativa disponible");
  }
  if (input.signalCount <= 1) {
    reasons.push("hay pocas senales detectadas");
  }
  if (input.hasPatternMatch) {
    reasons.push("coincide con patrones conocidos");
  }
  if (input.hasExternal) {
    reasons.push("hay checks externos disponibles");
  }

  if (!reasons.length) {
    return input.confidence >= 0.7
      ? "La confianza es razonable por la cantidad de senales detectadas."
      : "La confianza es moderada: conviene sumar mas contexto si vas a decidir.";
  }

  return `Confianza ${input.confidence >= 0.7 ? "alta" : "moderada"}: ${reasons.join(", ")}.`;
}

export function calibrateRiskDecision(input: {
  baseScore: number;
  baseLevel: RiskLevel;
  signalCodes: string[];
  factors: RiskFactor[];
  hardRulesApplied: string[];
}) {
  const signalCodes = new Set(input.signalCodes);
  const calibrationRulesApplied: string[] = [];
  const mitigationsApplied: string[] = [];
  let level = input.baseLevel;
  let scoreAdjustment = 0;

  const hasMoney = hasRiskFactor(input.factors, "money_request");
  const hasCredentials = hasRiskFactor(input.factors, "credential_request");
  const hasImpersonation = hasRiskFactor(input.factors, "identity_impersonation");
  const hasAuthorityThreat = hasRiskFactor(input.factors, "authority_threat");
  const hasBypass = hasRiskFactor(input.factors, "process_bypass");
  const hasTimePressure = hasRiskFactor(input.factors, "time_pressure");
  const hasLink = hasRiskFactor(input.factors, "suspicious_link");
  const hasAsymmetricRisk = hasRiskFactor(input.factors, "asymmetric_risk");
  const hasSafePayment = hasRiskFactor(input.factors, "safe_payment_flow");
  const hasPositiveVerification = hasRiskFactor(input.factors, "positive_verification");

  if (hasMoney && hasTimePressure && (signalCodes.has("identity_change") || signalCodes.has("new_number_claim"))) {
    level = floorRiskLevel(level, "high");
    calibrationRulesApplied.push("money_time_pressure_identity_change_floor_high");
  }

  if (signalCodes.has("deposit_request") && signalCodes.has("scarcity_pressure")) {
    level = floorRiskLevel(level, "medium");
    scoreAdjustment += 6;
    calibrationRulesApplied.push("deposit_scarcity_floor_medium");
  }

  if (
    (signalCodes.has("payment_settlement_bypass") || signalCodes.has("unconfirmed_payment_pressure")) &&
    (signalCodes.has("transfer_request") || hasBypass || signalCodes.has("bank_delay_excuse"))
  ) {
    level = floorRiskLevel(level, "high");
    calibrationRulesApplied.push("fake_receipt_delivery_pressure_floor_high");
  }

  if (hasCredentials) {
    level = floorRiskLevel(level, hasImpersonation ? "very_high" : "high");
    calibrationRulesApplied.push(hasImpersonation ? "credential_impersonation_floor_very_high" : "credential_floor_high");
  }

  if (hasAuthorityThreat && hasMoney) {
    level = floorRiskLevel(level, "very_high");
    calibrationRulesApplied.push("authority_threat_money_floor_very_high");
  }

  if (hasMoney && hasBypass) {
    level = floorRiskLevel(level, "high");
    calibrationRulesApplied.push("money_process_bypass_floor_high");
  }

  if (hasBypass && signalCodes.has("marketplace_p2p_context") && !hasMoney) {
    level = floorRiskLevel(level, "medium");
    calibrationRulesApplied.push("marketplace_process_bypass_without_payment_floor_medium");
  }

  if (hasLink && hasImpersonation) {
    level = floorRiskLevel(level, "high");
    calibrationRulesApplied.push("link_impersonation_floor_high");
  }

  if (
    (signalCodes.has("family_impersonation") || signalCodes.has("new_number_claim")) &&
    (signalCodes.has("secrecy_request") || hasTimePressure) &&
    (hasMoney || signalCodes.has("identity_change"))
  ) {
    level = floorRiskLevel(level, "high");
    calibrationRulesApplied.push("family_identity_pressure_floor_high");
  }

  if (hasLink || hasMoney || hasCredentials) {
    level = floorRiskLevel(level, "medium");
    calibrationRulesApplied.push("ambiguous_link_money_or_credential_floor_medium");
  }

  if (hasAsymmetricRisk && (hasBypass || hasTimePressure)) {
    level = floorRiskLevel(level, "high");
    calibrationRulesApplied.push("asymmetric_risk_with_bypass_or_pressure_floor_high");
  }

  const hasCriticalRedFlag = hasCredentials || hasAuthorityThreat || (hasMoney && (hasBypass || hasTimePressure || hasImpersonation));
  if (hasSafePayment && !hasCriticalRedFlag) {
    scoreAdjustment -= 8;
    mitigationsApplied.push("safe_payment_flow_reduces_score_without_critical_flags");
  }
  if (hasPositiveVerification && !hasCriticalRedFlag) {
    scoreAdjustment -= 6;
    mitigationsApplied.push("positive_verification_reduces_score_without_critical_flags");
  }

  let score = clamp(input.baseScore + scoreAdjustment, 0, 100);
  score = Math.max(score, minimumScoreForLevel(level));
  level = floorRiskLevel(level, score >= 75 ? "very_high" : score >= 50 ? "high" : score >= 25 ? "medium" : "low");

  const topFactors = input.factors
    .filter((factor) => factor.impact === "risk")
    .slice(0, 5);
  const explanationSummary = buildExplanationSummary(level, topFactors);

  const trace: RiskTrace = {
    signalCodes: input.signalCodes,
    factors: input.factors,
    hardRulesApplied: input.hardRulesApplied,
    calibrationRulesApplied,
    mitigationsApplied,
    explanationSummary,
  };

  return {
    score,
    level,
    trace,
    explanationSummary,
    topFactors,
  };
}
