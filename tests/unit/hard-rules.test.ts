import { describe, expect, it } from "vitest";

import { applyHardRules } from "@/server/signals/hard-rules";

describe("applyHardRules", () => {
  it("floors otp requests to high", () => {
    const result = applyHardRules(["asks_for_otp"], "medium");
    expect(result.level).toBe("high");
  });

  it("floors authority plus bribery to very high", () => {
    const result = applyHardRules(["authority_impersonation", "bribery_request"], "high");
    expect(result.level).toBe("very_high");
  });

  it("floors asymmetric risk plus pressure to high", () => {
    const result = applyHardRules(["behavior_combo_asymmetric_risk_time_pressure"], "medium");
    expect(result.level).toBe("high");
  });

  it("floors disguised credential theft to very high", () => {
    const result = applyHardRules(["behavior_combo_disguised_credential_theft"], "medium");
    expect(result.level).toBe("very_high");
  });

  it("floors delivery impersonation plus link payment to high", () => {
    const result = applyHardRules(["delivery_impersonation", "transfer_request", "suspicious_link"], "low");
    expect(result.level).toBe("high");
  });
});
