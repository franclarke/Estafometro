import { describe, expect, it } from "vitest";

import { deriveRiskLevel } from "@/server/risk/risk-band";

describe("deriveRiskLevel", () => {
  it("maps low scores to low", () => {
    expect(deriveRiskLevel(12)).toBe("low");
  });

  it("maps medium scores to medium", () => {
    expect(deriveRiskLevel(30)).toBe("medium");
  });

  it("maps high scores to high", () => {
    expect(deriveRiskLevel(55)).toBe("high");
  });

  it("maps very high scores to very_high", () => {
    expect(deriveRiskLevel(90)).toBe("very_high");
  });
});
