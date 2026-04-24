import { createServerSupabaseClient } from "@/server/db/client";
import { mapEvidenceRow } from "@/server/db/mappers";
import type { DbEvidenceRow } from "@/server/db/types";
import type { EvidenceType } from "@/types/domain";
import type { Json } from "@/server/db/generated.types";

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export async function createTextEvidence(input: {
  caseId: string;
  evidenceType: Extract<EvidenceType, "pasted_chat" | "url" | "username" | "alias" | "phone" | "note">;
  rawText: string;
  parsedMetadata?: Record<string, unknown>;
}) {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("case_evidence")
    .insert({
      case_id: input.caseId,
      evidence_type: input.evidenceType,
      raw_text: input.rawText,
      parsed_metadata: (input.parsedMetadata as Json) ?? null,
      expires_at: addDays(30),
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapEvidenceRow(data as DbEvidenceRow);
}

export async function createScreenshotEvidence(input: {
  caseId: string;
  storagePath: string;
  parsedMetadata?: Record<string, unknown>;
}) {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("case_evidence")
    .insert({
      case_id: input.caseId,
      evidence_type: "screenshot",
      storage_path: input.storagePath,
      parsed_metadata: (input.parsedMetadata as Json) ?? null,
      expires_at: addDays(3),
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapEvidenceRow(data as DbEvidenceRow);
}

export async function listEvidenceByCaseId(caseId: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("case_evidence")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as DbEvidenceRow[]).map(mapEvidenceRow);
}

export async function countEvidenceByCaseId(caseId: string): Promise<number> {
  const supabase = createServerSupabaseClient();
  const { count, error } = await supabase
    .from("case_evidence")
    .select("id", { count: "exact", head: true })
    .eq("case_id", caseId);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function updateEvidenceRecord(
  evidenceId: string,
  updates: Partial<{ ocr_text: string | null; raw_text: string | null; parsed_metadata: Json | null }>,
) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("case_evidence")
    .update(updates)
    .eq("id", evidenceId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapEvidenceRow(data as DbEvidenceRow);
}
