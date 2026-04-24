import type { ExtractedEntity } from "@/types/analysis";

const urlRegex = /https?:\/\/[^\s]+/gi;
const phoneRegex = /(?:\+54\s?)?(?:9\s?)?(?:\d[\s-]?){8,15}/g;
const aliasRegex = /\b[a-z0-9]+(?:[._-][a-z0-9]+){1,}\b/gi;
const instagramRegex = /@[a-z0-9._]{2,30}/gi;

function extractUniqueMatches(regex: RegExp, text: string) {
  return Array.from(new Set(text.match(regex) ?? []));
}

export function parseBasicEntities(text: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];

  for (const url of extractUniqueMatches(urlRegex, text)) {
    entities.push({ type: "url", value: url, confidence: 0.9 });

    try {
      const parsed = new URL(url);
      entities.push({ type: "domain", value: parsed.hostname, confidence: 0.88 });
    } catch {
      // Ignore malformed URLs already captured as raw text.
    }
  }

  for (const handle of extractUniqueMatches(instagramRegex, text)) {
    entities.push({ type: "instagram_handle", value: handle, confidence: 0.88 });
  }

  for (const phone of extractUniqueMatches(phoneRegex, text)) {
    if (phone.replace(/\D/g, "").length >= 8) {
      entities.push({ type: "phone", value: phone, confidence: 0.82 });
    }
  }

  for (const alias of extractUniqueMatches(aliasRegex, text)) {
    if (alias.includes(".") || alias.includes("_")) {
      entities.push({ type: "alias", value: alias, confidence: 0.7 });
    }
  }

  return entities;
}
