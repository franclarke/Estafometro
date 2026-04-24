import type { BehavioralSeverity, BehavioralVectors, ExtractedSignal } from "@/types/analysis";

const severityRank: BehavioralSeverity[] = ["none", "low", "medium", "high"];

function atLeast(value: BehavioralSeverity, floor: BehavioralSeverity) {
  return severityRank.indexOf(value) >= severityRank.indexOf(floor);
}

function pushBySeverity(
  signals: ExtractedSignal[],
  code: string,
  severity: BehavioralSeverity,
  minimum: BehavioralSeverity,
  confidence: number,
) {
  if (atLeast(severity, minimum)) {
    signals.push({ code, confidence });
  }
}

export function deriveBehavioralSignals(vectors: BehavioralVectors): ExtractedSignal[] {
  const signals: ExtractedSignal[] = [];

  pushBySeverity(signals, "behavior_asymmetric_risk_medium", vectors.asymmetricRiskDemand, "medium", 0.88);
  pushBySeverity(signals, "behavior_asymmetric_risk_high", vectors.asymmetricRiskDemand, "high", 0.94);
  pushBySeverity(signals, "behavior_artificial_time_pressure_medium", vectors.artificialTimePressure, "medium", 0.86);
  pushBySeverity(signals, "behavior_artificial_time_pressure_high", vectors.artificialTimePressure, "high", 0.92);
  pushBySeverity(signals, "behavior_trust_manipulation_medium", vectors.trustManipulationExcuse, "medium", 0.84);
  pushBySeverity(signals, "behavior_trust_manipulation_high", vectors.trustManipulationExcuse, "high", 0.9);
  pushBySeverity(signals, "behavior_standard_process_bypass_medium", vectors.standardProcessBypass, "medium", 0.88);
  pushBySeverity(signals, "behavior_standard_process_bypass_high", vectors.standardProcessBypass, "high", 0.94);
  pushBySeverity(
    signals,
    "behavior_credential_phishing_disguise_medium",
    vectors.credentialPhishingDisguise,
    "medium",
    0.92,
  );
  pushBySeverity(
    signals,
    "behavior_credential_phishing_disguise_high",
    vectors.credentialPhishingDisguise,
    "high",
    0.97,
  );

  if (vectors.justificationCoherence === "weak") {
    signals.push({ code: "behavior_justification_weak", confidence: 0.82 });
  }

  if (vectors.justificationCoherence === "nonsensical") {
    signals.push({ code: "behavior_justification_nonsensical", confidence: 0.94 });
  }

  if (atLeast(vectors.asymmetricRiskDemand, "medium") && atLeast(vectors.artificialTimePressure, "medium")) {
    signals.push({ code: "behavior_combo_asymmetric_risk_time_pressure", confidence: 0.95 });
  }

  if (atLeast(vectors.asymmetricRiskDemand, "medium") && atLeast(vectors.standardProcessBypass, "medium")) {
    signals.push({ code: "behavior_combo_asymmetric_risk_process_bypass", confidence: 0.95 });
  }

  if (atLeast(vectors.trustManipulationExcuse, "medium") && atLeast(vectors.standardProcessBypass, "medium")) {
    signals.push({ code: "behavior_combo_trust_excuse_process_bypass", confidence: 0.9 });
  }

  if (
    atLeast(vectors.credentialPhishingDisguise, "medium") &&
    vectors.justificationCoherence !== "coherent"
  ) {
    signals.push({ code: "behavior_combo_disguised_credential_theft", confidence: 0.97 });
  }

  if (
    vectors.justificationCoherence === "nonsensical" &&
    (atLeast(vectors.asymmetricRiskDemand, "medium") || atLeast(vectors.standardProcessBypass, "medium"))
  ) {
    signals.push({ code: "behavior_combo_nonsensical_transaction_justification", confidence: 0.93 });
  }

  return signals;
}
