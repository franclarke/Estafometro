import type { NormalizedSignal } from "@/types/analysis";

export function dedupeSignals(signals: NormalizedSignal[]) {
  const byCode = new Map<string, NormalizedSignal>();

  for (const signal of signals) {
    const existing = byCode.get(signal.code);
    if (!existing) {
      byCode.set(signal.code, signal);
      continue;
    }

    byCode.set(signal.code, {
      ...existing,
      confidence: Math.max(existing.confidence, signal.confidence),
      sources: Array.from(new Set([...existing.sources, ...signal.sources])),
    });
  }

  return Array.from(byCode.values()).sort((left, right) => right.weight - left.weight);
}
