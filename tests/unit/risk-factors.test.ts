import { describe, expect, it } from "vitest";

import { calibrateRiskDecision } from "@/server/risk/calibration";
import { deriveRiskFactors } from "@/server/risk/factors";
import { createNormalizedSignal } from "@/server/signals/catalog";
import type { NormalizedSignal } from "@/types/analysis";

function signals(codes: string[]) {
  return codes
    .map((code) => createNormalizedSignal({ code, confidence: 0.9, sources: ["regex"] }))
    .filter((signal): signal is NormalizedSignal => Boolean(signal));
}

describe("deriveRiskFactors", () => {
  it("maps signals to normalized risk factors", () => {
    const factors = deriveRiskFactors(signals(["asks_for_otp", "bank_impersonation", "suspicious_link"]));

    expect(factors.map((factor) => factor.code)).toEqual(
      expect.arrayContaining(["credential_request", "identity_impersonation", "suspicious_link"]),
    );
  });

  it("keeps safe payment flow as a trust factor", () => {
    const factors = deriveRiskFactors(signals(["payment_on_delivery_available"]));

    expect(factors).toEqual([
      expect.objectContaining({
        code: "safe_payment_flow",
        impact: "trust",
      }),
    ]);
  });
});

describe("calibrateRiskDecision", () => {
  it("floors credential request plus impersonation to very high", () => {
    const factors = deriveRiskFactors(signals(["asks_for_otp", "bank_impersonation"]));
    const result = calibrateRiskDecision({
      baseScore: 32,
      baseLevel: "medium",
      signalCodes: ["asks_for_otp", "bank_impersonation"],
      factors,
      hardRulesApplied: [],
    });

    expect(result.level).toBe("very_high");
    expect(result.score).toBeGreaterThanOrEqual(75);
  });

  it("does not let safe payment flow override critical red flags", () => {
    const signalCodes = ["payment_on_delivery_available", "asks_for_otp", "bank_impersonation"];
    const factors = deriveRiskFactors(signals(signalCodes));
    const result = calibrateRiskDecision({
      baseScore: 35,
      baseLevel: "medium",
      signalCodes,
      factors,
      hardRulesApplied: [],
    });

    expect(result.level).toBe("very_high");
    expect(result.trace.mitigationsApplied).not.toContain("safe_payment_flow_reduces_score_without_critical_flags");
  });

  it("reduces low-risk safe payment flow without making it unsafe", () => {
    const signalCodes = ["payment_on_delivery_available", "marketplace_p2p_context"];
    const factors = deriveRiskFactors(signals(signalCodes));
    const result = calibrateRiskDecision({
      baseScore: 10,
      baseLevel: "low",
      signalCodes,
      factors,
      hardRulesApplied: [],
    });

    expect(result.level).toBe("low");
    expect(result.trace.mitigationsApplied).toContain("safe_payment_flow_reduces_score_without_critical_flags");
  });

  it("keeps marketplace channel bypass without payment at medium", () => {
    const signalCodes = ["platform_bypass", "channel_shift", "marketplace_p2p_context"];
    const factors = deriveRiskFactors(signals(signalCodes));
    const result = calibrateRiskDecision({
      baseScore: 18,
      baseLevel: "low",
      signalCodes,
      factors,
      hardRulesApplied: [],
    });

    expect(result.level).toBe("medium");
    expect(result.score).toBeGreaterThanOrEqual(25);
    expect(result.trace.calibrationRulesApplied).toContain(
      "marketplace_process_bypass_without_payment_floor_medium",
    );
  });
});
