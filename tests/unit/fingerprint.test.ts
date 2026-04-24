import { describe, expect, it } from "vitest";

import { buildCaseFingerprint } from "@/server/candidate-patterns/fingerprint";
import type { ExtractionResult } from "@/types/analysis";

describe("buildCaseFingerprint", () => {
  const baseInput: ExtractionResult = {
    actor: "authority",
    threat: "arrest_or_search",
    requestedAction: "transfer_money",
    paymentReason: "avoid_consequences",
    narrativeTheme: "authority_pressure",
    urgency: "high",
    caseType: "authority_extortion",
    summary: "Resumen",
    entities: [],
    signals: [],
    uncertainties: [],
    probablePattern: null,
    suggestedFollowupQuestion: null,
    behavioralVectors: {
      asymmetricRiskDemand: "none",
      artificialTimePressure: "high",
      trustManipulationExcuse: "medium",
      standardProcessBypass: "none",
      credentialPhishingDisguise: "none",
      justificationCoherence: "nonsensical",
      reasoning: "Amenaza y apuro incompatibles con una gestión real.",
    },
  };

  it("is stable for the same structural signature", () => {
    const first = buildCaseFingerprint(baseInput);
    const second = buildCaseFingerprint(baseInput);
    expect(first.fingerprint).toBe(second.fingerprint);
  });

  it("changes when the structure changes", () => {
    const first = buildCaseFingerprint(baseInput);
    const second = buildCaseFingerprint({ ...baseInput, urgency: "medium" });
    expect(first.fingerprint).not.toBe(second.fingerprint);
  });

  it("changes when the behavioral signature changes", () => {
    const first = buildCaseFingerprint(baseInput);
    const second = buildCaseFingerprint({
      ...baseInput,
      behavioralVectors: {
        ...baseInput.behavioralVectors,
        trustManipulationExcuse: "high",
      },
    });
    expect(first.fingerprint).not.toBe(second.fingerprint);
  });
});
