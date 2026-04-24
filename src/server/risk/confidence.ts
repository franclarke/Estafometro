import { clamp } from "@/lib/utils";

export function computeConfidence(input: {
  signalCount: number;
  hasExternal: boolean;
  hasPatternMatch: boolean;
  hasNarrative: boolean;
}) {
  return clamp(
    0.25 +
      (input.signalCount > 0 ? Math.min(input.signalCount * 0.06, 0.32) : 0) +
      (input.hasExternal ? 0.12 : 0) +
      (input.hasPatternMatch ? 0.16 : 0) +
      (input.hasNarrative ? 0.1 : 0),
    0,
    0.98,
  );
}
