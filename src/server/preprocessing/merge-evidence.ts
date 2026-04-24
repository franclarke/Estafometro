import { normalizeText } from "@/server/preprocessing/normalize-text";
import type { CaseRecord, EvidenceRecord } from "@/types/domain";

export function mergeEvidenceText(input: { caseRecord: CaseRecord; evidence: EvidenceRecord[] }) {
  const chunks = [
    input.caseRecord.narrativeText,
    ...input.evidence.flatMap((item) => [item.rawText, item.ocrText]),
  ]
    .filter(Boolean)
    .map((chunk) => normalizeText(chunk as string));

  return normalizeText(chunks.join("\n\n"));
}
