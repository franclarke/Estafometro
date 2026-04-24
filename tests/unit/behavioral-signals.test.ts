import { describe, expect, it } from "vitest";

import { deriveBehavioralSignals } from "@/server/signals/behavioral-signals";

describe("deriveBehavioralSignals", () => {
  it("emits combo signals for asymmetric risk plus bypass", () => {
    const signals = deriveBehavioralSignals({
      asymmetricRiskDemand: "high",
      artificialTimePressure: "medium",
      trustManipulationExcuse: "high",
      standardProcessBypass: "high",
      credentialPhishingDisguise: "none",
      justificationCoherence: "nonsensical",
      reasoning: "La contraparte te carga el riesgo y evita el proceso normal.",
    });

    expect(signals.some((signal) => signal.code === "behavior_asymmetric_risk_high")).toBe(true);
    expect(signals.some((signal) => signal.code === "behavior_combo_asymmetric_risk_process_bypass")).toBe(true);
    expect(signals.some((signal) => signal.code === "behavior_combo_nonsensical_transaction_justification")).toBe(
      true,
    );
  });

  it("emits credential combo when phishing is disguised", () => {
    const signals = deriveBehavioralSignals({
      asymmetricRiskDemand: "none",
      artificialTimePressure: "low",
      trustManipulationExcuse: "medium",
      standardProcessBypass: "medium",
      credentialPhishingDisguise: "high",
      justificationCoherence: "nonsensical",
      reasoning: "Pide un OTP como supuesto paso administrativo.",
    });

    expect(signals.some((signal) => signal.code === "behavior_credential_phishing_disguise_high")).toBe(true);
    expect(signals.some((signal) => signal.code === "behavior_combo_disguised_credential_theft")).toBe(true);
  });
});
