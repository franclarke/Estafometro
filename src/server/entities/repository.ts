import { createServerSupabaseClient } from "@/server/db/client";
import { mapEntityRow } from "@/server/db/mappers";
import type { DbEntityRow } from "@/server/db/types";
import type { ExtractedEntity } from "@/types/analysis";

export async function replaceCaseEntities(
  caseId: string,
  entities: Array<ExtractedEntity & { normalizedValue: string; source: string }>,
) {
  const supabase = createServerSupabaseClient();

  await supabase.from("case_entities").delete().eq("case_id", caseId);

  if (!entities.length) {
    return [];
  }

  const { data, error } = await supabase
    .from("case_entities")
    .insert(
      entities.map((entity) => ({
        case_id: caseId,
        entity_type: entity.type,
        value: entity.value,
        normalized_value: entity.normalizedValue,
        confidence: entity.confidence,
        source: entity.source,
      })),
    )
    .select("*");

  if (error) {
    throw error;
  }

  return ((data ?? []) as DbEntityRow[]).map(mapEntityRow);
}

export async function listCaseEntities(caseId: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("case_entities")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as DbEntityRow[]).map(mapEntityRow);
}
