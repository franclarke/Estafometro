import { downloadEvidenceBuffer } from "@/server/storage/supabase-storage";
import { mergeEvidenceText } from "@/server/preprocessing/merge-evidence";
import { normalizeText } from "@/server/preprocessing/normalize-text";
import { parseBasicEntities } from "@/server/preprocessing/parse-basic-entities";
import type { PreprocessedEvidence, PreprocessingOutput } from "@/types/analysis";
import type { CaseRecord, EvidenceRecord } from "@/types/domain";

export async function preprocessCase(input: {
  caseRecord: CaseRecord;
  evidence: EvidenceRecord[];
}): Promise<PreprocessingOutput> {
  const preprocessedEvidence: PreprocessedEvidence[] = [];

  for (const item of input.evidence) {
    let binaryContent: Buffer | null = null;
    if (item.evidenceType === "screenshot" && item.storagePath) {
      try {
        binaryContent = await downloadEvidenceBuffer(item.storagePath);
      } catch {
        binaryContent = null;
      }
    }

    preprocessedEvidence.push({
      evidenceType: item.evidenceType,
      sourceId: item.id,
      rawText: item.rawText,
      normalizedText: normalizeText([item.rawText, item.ocrText].filter(Boolean).join("\n")),
      storagePath: item.storagePath,
      parsedMetadata: item.parsedMetadata,
      contentType:
        typeof item.parsedMetadata?.contentType === "string"
          ? item.parsedMetadata.contentType
          : null,
      binaryContent,
    });
  }

  const mergedCaseText = mergeEvidenceText(input);
  const parsedEntities = parseBasicEntities(mergedCaseText);

  return {
    mergedCaseText,
    parsedEntities,
    preprocessedEvidence,
  };
}
