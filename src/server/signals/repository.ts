import { createServerSupabaseClient } from "@/server/db/client";
import { mapSignalRow } from "@/server/db/mappers";
import { getSignalDefinition } from "@/server/signals/catalog";
import type { DbSignalRow } from "@/server/db/types";
import type { NormalizedSignal } from "@/types/analysis";

async function ensureSignalCatalogRows(signals: NormalizedSignal[]) {
  if (!signals.length) {
    return;
  }

  const definitions = Array.from(
    new Map(
      signals
        .map((signal) => getSignalDefinition(signal.code))
        .filter((definition): definition is NonNullable<ReturnType<typeof getSignalDefinition>> => Boolean(definition))
        .map((definition) => [definition.code, definition]),
    ).values(),
  );

  if (!definitions.length) {
    return;
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("signal_catalog").upsert(
    definitions.map((definition) => ({
      code: definition.code,
      group_name: definition.groupName,
      description: definition.description,
      user_label: definition.userLabel,
      default_weight: definition.defaultWeight,
      severity: definition.severity,
      is_active: definition.isActive,
    })),
    { onConflict: "code" },
  );

  if (error) {
    throw error;
  }
}

export async function replaceCaseSignals(caseId: string, signals: NormalizedSignal[]) {
  const supabase = createServerSupabaseClient();

  await supabase.from("case_signals").delete().eq("case_id", caseId);

  if (!signals.length) {
    return [];
  }

  await ensureSignalCatalogRows(signals);

  const { data, error } = await supabase
    .from("case_signals")
    .insert(
      signals.map((signal) => ({
        case_id: caseId,
        signal_code: signal.code,
        confidence: signal.confidence,
        weight: signal.weight,
        sources: signal.sources,
      })),
    )
    .select("*");

  if (error) {
    throw error;
  }

  return ((data ?? []) as DbSignalRow[]).map(mapSignalRow);
}

export async function listCaseSignals(caseId: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("case_signals")
    .select("*")
    .eq("case_id", caseId)
    .order("weight", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as DbSignalRow[]).map(mapSignalRow);
}
