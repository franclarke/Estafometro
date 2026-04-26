import { describe, expect, it } from "vitest";

import { buildFollowupEvidenceNote } from "@/server/followups/answers-to-note";
import { detectRuleSignals } from "@/server/signals/detectors/rule-signals";

describe("buildFollowupEvidenceNote", () => {
  it("turns positive follow-up answers into rule-detectable text", () => {
    const note = buildFollowupEvidenceNote([
      { questionId: "asked_for_code", answer: "yes" },
      { questionId: "requested_money", answer: "yes" },
      { questionId: "paid_off_platform", answer: "yes" },
    ]);

    const signals = detectRuleSignals(note).map((signal) => signal.code);

    expect(note).toContain("codigo");
    expect(signals).toContain("asks_for_otp");
    expect(signals).toContain("transfer_request");
    expect(signals).toContain("off_platform_payment");
  });

  it("preserves custom short-text context without inventing a yes/no signal", () => {
    const note = buildFollowupEvidenceNote([{ questionId: "missing_context", answer: "Me pasaron un alias." }]);

    expect(note).toContain("missing_context");
    expect(note).toContain("alias");
  });
});
