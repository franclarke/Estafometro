import { describe, expect, it } from "vitest";

import { runDomainChecker } from "@/server/enrichment/checkers/domain";
import { runPhoneChecker } from "@/server/enrichment/checkers/phone";

describe("enrichment checkers", () => {
  it("flags phishing-style domains", async () => {
    const result = await runDomainChecker({
      entities: [
        { type: "url", value: "https://misantander-seguro-login.xyz", confidence: 0.9 },
        { type: "bank", value: "Santander", confidence: 0.9 },
      ],
    });

    expect(result.status).toBe("warning");
    expect(result.derivedSignals.some((signal) => signal.code === "phishing_domain_characteristics")).toBe(true);
  });

  it("flags suspicious institutional phone mismatches", async () => {
    const result = await runPhoneChecker({
      caseType: "bank_support",
      entities: [{ type: "phone", value: "+1 347 555 1212", confidence: 0.9 }],
    });

    expect(result.status).toBe("warning");
    expect(result.derivedSignals.some((signal) => signal.code === "phone_prefix_mismatch")).toBe(true);
  });
});
