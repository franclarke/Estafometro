import type { ExtractionResult } from "@/types/analysis";

export function buildUserSummary(input: {
  extraction: ExtractionResult;
  mergedCaseText: string;
}) {
  if (input.extraction.summary?.trim()) {
    return input.extraction.summary.trim();
  }

  const snippet = input.mergedCaseText.slice(0, 240).trim();
  if (!snippet) {
    return "No hubo suficiente texto para resumir el caso con detalle.";
  }

  return snippet;
}
