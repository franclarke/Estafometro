import type { NormalizedSignal } from "@/types/analysis";

export function getTopSignals(signals: NormalizedSignal[], limit = 5) {
  return [...signals].sort((left, right) => right.weight - left.weight).slice(0, limit);
}
