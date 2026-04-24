import { describe, expect, it } from "vitest";

import { loadPatternsFromDisk } from "@/server/patterns/load-from-disk";

describe("loadPatternsFromDisk", () => {
  it("loads the official pattern library", async () => {
    const patterns = await loadPatternsFromDisk();
    expect(patterns.length).toBeGreaterThanOrEqual(13);
    const codes = patterns.map((pattern) => pattern.code);
    expect(codes).toContain("bank_support_otp_request");
    expect(codes).toContain("online_purchase_marketplace_advance_payment");
    expect(codes).toContain("mixed_delivery_package_release_link");
    expect(codes).toContain("online_purchase_buyer_fake_receipt_release");
  });
});
