import type { EnrichmentFinding, ExtractedSignal } from "@/types/analysis";

export function mapFindingsToSignals(findings: EnrichmentFinding[]) {
  const signals: ExtractedSignal[] = [];

  for (const finding of findings) {
    signals.push(...finding.derivedSignals);
  }

  return signals;
}
