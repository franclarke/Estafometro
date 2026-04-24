import { dedupeSignals } from "@/server/signals/dedupe";
import type { ExtractedEntity, ExtractionResult } from "@/types/analysis";
import type { EntityType } from "@/types/domain";

const VALID_ENTITY_TYPES: ReadonlySet<string> = new Set<EntityType>([
  "platform",
  "business_name",
  "instagram_handle",
  "url",
  "domain",
  "alias",
  "cbu",
  "phone",
  "authority",
  "bank",
  "product",
  "payment_method",
  "marketplace",
]);

function normalizeEntityValue(type: ExtractedEntity["type"], value: string) {
  const trimmed = value.trim();

  if (type === "url" || type === "domain" || type === "instagram_handle" || type === "alias") {
    return trimmed.toLowerCase();
  }

  if (type === "phone") {
    return trimmed.replace(/\D/g, "");
  }

  return trimmed;
}

export function normalizeEntities(entities: ExtractedEntity[]) {
  const validEntities = entities.filter((entity) => VALID_ENTITY_TYPES.has(entity.type));
  const deduped = new Map<string, ExtractedEntity & { normalizedValue: string; source: "llm" | "parser" }>();

  for (const entity of validEntities) {
    const normalizedValue = normalizeEntityValue(entity.type, entity.value);
    const key = `${entity.type}:${normalizedValue}`;
    const existing = deduped.get(key);
    if (!existing || existing.confidence < entity.confidence) {
      deduped.set(key, {
        ...entity,
        normalizedValue,
        source: "llm",
      });
    }
  }

  return Array.from(deduped.values());
}

export function sanitizeExtraction(input: ExtractionResult): ExtractionResult {
  return {
    ...input,
    entities: normalizeEntities(input.entities),
    signals: dedupeSignals(
      input.signals.map((signal) => ({
        code: signal.code,
        description: signal.code,
        userLabel: signal.code,
        severity: "low",
        groupName: "interaction",
        weight: 0,
        confidence: signal.confidence,
        sources: ["llm"],
      })),
    ).map((signal) => ({ code: signal.code, confidence: signal.confidence })),
  };
}
