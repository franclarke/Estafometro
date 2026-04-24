import { describe, expect, it } from "vitest";

import { loadPatternsFromDisk } from "@/server/patterns/load-from-disk";
import { computePatternMatchScore } from "@/server/patterns/match-score";

describe("official pattern coverage", () => {
  it("matches the package-release phishing pattern with its core mechanics", async () => {
    const patterns = await loadPatternsFromDisk();
    const pattern = patterns.find((item) => item.code === "mixed_delivery_package_release_link");

    expect(pattern).toBeDefined();
    expect(
      computePatternMatchScore({
        pattern: pattern!,
        signalCodes: [
          "delivery_impersonation",
          "transfer_request",
          "suspicious_link",
          "behavior_standard_process_bypass_medium",
        ],
        caseType: "mixed",
        narrativeTheme: "unknown",
      }),
    ).toBeGreaterThanOrEqual(0.6);
  });

  it("matches the marketplace validation phishing pattern with credential-theft signals", async () => {
    const patterns = await loadPatternsFromDisk();
    const pattern = patterns.find((item) => item.code === "online_purchase_marketplace_validation_phishing");

    expect(pattern).toBeDefined();
    expect(
      computePatternMatchScore({
        pattern: pattern!,
        signalCodes: [
          "marketplace_p2p_context",
          "behavior_credential_phishing_disguise_high",
          "behavior_combo_disguised_credential_theft",
          "asks_for_otp",
        ],
        caseType: "online_purchase",
        narrativeTheme: "unknown",
      }),
    ).toBeGreaterThanOrEqual(0.6);
  });
});
