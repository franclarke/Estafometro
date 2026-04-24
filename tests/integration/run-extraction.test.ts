import { describe, expect, it } from "vitest";

import { inferBehavioralVectors } from "@/server/extraction/behavioral-heuristics";
import { runGeminiExtraction } from "@/server/extraction/run-extraction";
import { computeFinalScore } from "@/server/risk/final-score";
import { deriveRiskLevel } from "@/server/risk/risk-band";
import { computeSubscores } from "@/server/risk/subscores";
import { deriveBehavioralSignals } from "@/server/signals/behavioral-signals";
import { mergeSignals } from "@/server/signals/merge-signals";
import { detectRuleSignals } from "@/server/signals/detectors/rule-signals";

describe("runGeminiExtraction fallback", () => {
  it("returns a structured fallback when no API key is configured", async () => {
    delete process.env.GEMINI_API_KEY;

    const result = await runGeminiExtraction({
      mergedCaseText: "Me escribieron diciendo que eran del banco y me pidieron un código para desbloquear la cuenta urgente.",
      preprocessedEvidence: [],
    });

    expect(result.usedFallback).toBe(true);
    expect(result.extraction.caseType).toBe("bank_support");
    expect(result.extraction.signals.some((signal) => signal.code === "asks_for_otp")).toBe(true);
    expect(result.extraction.behavioralVectors.credentialPhishingDisguise).toBe("high");
    expect(result.extraction.behavioralVectors.justificationCoherence).toBe("nonsensical");
  });

  it("elevates package-release phishing with link plus payment out of low risk", () => {
    const text =
      "Me escribio uno diciendo que es del correo porque tiene un paquete mio retenido y que para liberarlo tengo que pagar un monto chico entrando a un link. Justo estaba esperando una compra, entonces no se si puede ser real.";

    const ruleSignals = detectRuleSignals(text);
    const vectors = inferBehavioralVectors({
      text,
      signalCodes: ruleSignals.map((signal) => signal.code),
      requestedAction: "unknown",
    });
    const mergedSignals = mergeSignals({
      ruleSignals,
      behavioralSignals: deriveBehavioralSignals(vectors),
    });
    const finalScore = computeFinalScore(computeSubscores(mergedSignals));

    expect(ruleSignals.some((signal) => signal.code === "delivery_impersonation")).toBe(true);
    expect(ruleSignals.some((signal) => signal.code === "transfer_request")).toBe(true);
    expect(ruleSignals.some((signal) => signal.code === "suspicious_link")).toBe(true);
    expect(vectors.asymmetricRiskDemand).not.toBe("none");
    expect(vectors.standardProcessBypass).not.toBe("none");
    expect(finalScore).toBeGreaterThanOrEqual(25);
    expect(["medium", "high", "very_high"]).toContain(deriveRiskLevel(finalScore));
  });
});
