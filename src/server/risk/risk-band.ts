import type { RiskLevel } from "@/types/domain";

export function deriveRiskLevel(score: number): RiskLevel {
  if (score >= 75) {
    return "very_high";
  }

  if (score >= 50) {
    return "high";
  }

  if (score >= 25) {
    return "medium";
  }

  return "low";
}
