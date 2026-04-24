import type { PatternDefinition } from "@/types/patterns";

export function computePatternMatchScore(input: {
  pattern: PatternDefinition;
  signalCodes: string[];
  caseType: string | null;
  narrativeTheme: string | null;
}) {
  const signals = new Set(input.signalCodes);
  const coreCoverage =
    input.pattern.coreSignals.filter((code) => signals.has(code)).length / input.pattern.coreSignals.length;
  const highWeightCoverage = input.pattern.highWeightSignals.length
    ? input.pattern.highWeightSignals.filter((code) => signals.has(code)).length / input.pattern.highWeightSignals.length
    : 0;
  const categoryScore =
    input.caseType && input.pattern.category.toLowerCase().includes(input.caseType.split("_")[0] ?? "")
      ? 0.1
      : 0;
  const themeScore =
    input.narrativeTheme && input.pattern.code.includes(input.narrativeTheme.replace(/_/g, "-")) ? 0.08 : 0;
  const counterPenalty = input.pattern.counterSignals.some((code) => signals.has(code)) ? 0.12 : 0;

  return Math.max(0, coreCoverage * 0.6 + highWeightCoverage * 0.22 + categoryScore + themeScore - counterPenalty);
}
