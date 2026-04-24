import { normalizeWhitespace } from "@/lib/utils";

export function normalizeText(input: string) {
  return normalizeWhitespace(
    input
      .replace(/\u00a0/g, " ")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/\r\n/g, "\n"),
  );
}
