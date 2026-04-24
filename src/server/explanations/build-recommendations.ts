import { defaultRecommendations } from "@/lib/copy/es-ar";
import type { PatternDefinition } from "@/types/patterns";
import type { RiskLevel } from "@/types/domain";

export function buildRecommendations(input: {
  riskLevel: RiskLevel;
  matchedPatterns: PatternDefinition[];
}) {
  const patternActions = input.matchedPatterns.flatMap((pattern) => pattern.recommendedActions);
  const merged = [...patternActions, ...defaultRecommendations[input.riskLevel]];

  return Array.from(new Set(merged)).slice(0, 4);
}
