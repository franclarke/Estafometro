import { describe, expect, it } from "vitest";

import { normalizeExtractionForRisk } from "@/server/extraction/normalize-for-risk";
import type { ExtractionResult } from "@/types/analysis";

const baseExtraction: ExtractionResult = {
  caseType: "mixed",
  summary: "Caso ambiguo.",
  requestedAction: "unknown",
  narrativeTheme: "unknown",
  actor: "unknown",
  threat: "none",
  paymentReason: "unknown",
  urgency: "low",
  entities: [],
  signals: [],
  uncertainties: [],
  probablePattern: null,
  suggestedFollowupQuestion: null,
  behavioralVectors: {
    asymmetricRiskDemand: "none",
    artificialTimePressure: "none",
    trustManipulationExcuse: "none",
    standardProcessBypass: "none",
    credentialPhishingDisguise: "none",
    justificationCoherence: "coherent",
    reasoning: "",
  },
};

describe("normalizeExtractionForRisk", () => {
  it("promotes OTP rule signals into extraction and requested action", () => {
    const result = normalizeExtractionForRisk({
      extraction: baseExtraction,
      ruleSignals: [
        { code: "asks_for_otp", confidence: 0.92 },
        { code: "bank_impersonation", confidence: 0.9 },
      ],
      mergedCaseText: "codigo banco",
    });

    expect(result.extraction.requestedAction).toBe("share_otp");
    expect(result.extraction.caseType).toBe("bank_support");
    expect(result.extraction.signals.map((signal) => signal.code)).toContain("asks_for_otp");
    expect(result.adjustments).toContain("requested_action_share_otp_from_rules");
  });

  it("corrects marketplace mechanics from deterministic rules", () => {
    const result = normalizeExtractionForRisk({
      extraction: baseExtraction,
      ruleSignals: [
        { code: "deposit_request", confidence: 0.9 },
        { code: "marketplace_p2p_context", confidence: 0.9 },
      ],
      mergedCaseText: "marketplace sena",
    });

    expect(result.extraction.caseType).toBe("online_purchase");
    expect(result.extraction.requestedAction).toBe("pay_deposit");
    expect(result.extraction.narrativeTheme).toBe("marketplace_bypass");
  });
});
