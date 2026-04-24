import { createNormalizedSignal } from "@/server/signals/catalog";
import { dedupeSignals } from "@/server/signals/dedupe";
import type { ExtractedSignal, NormalizedSignal } from "@/types/analysis";

export function mergeSignals(input: {
  llmSignals?: ExtractedSignal[];
  behavioralSignals?: ExtractedSignal[];
  ruleSignals?: ExtractedSignal[];
  enrichmentSignals?: ExtractedSignal[];
  patternSignals?: ExtractedSignal[];
}) {
  const merged: NormalizedSignal[] = [];

  const sources: Array<[string, ExtractedSignal[] | undefined]> = [
    ["llm", input.llmSignals],
    ["behavioral", input.behavioralSignals],
    ["regex", input.ruleSignals],
    ["enrichment", input.enrichmentSignals],
    ["pattern", input.patternSignals],
  ];

  for (const [source, signals] of sources) {
    for (const signal of signals ?? []) {
      const normalized = createNormalizedSignal({
        code: signal.code,
        confidence: signal.confidence,
        sources: [source],
      });

      if (normalized) {
        merged.push(normalized);
      }
    }
  }

  return dedupeSignals(merged);
}
