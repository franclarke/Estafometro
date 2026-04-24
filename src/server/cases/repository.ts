import { createPublicId } from "@/lib/id";
import { NotFoundAppError } from "@/lib/errors";
import { mapCaseRow } from "@/server/db/mappers";
import type { DbCaseRow } from "@/server/db/types";
import { createServerSupabaseClient } from "@/server/db/client";
import type { CaseRecord, CaseStatus, PrivacyMode, RiskLevel } from "@/types/domain";

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export async function createCaseRecord(input: {
  narrativeText: string | null;
  privacyMode: PrivacyMode;
  ipHash?: string | null;
  userAgentHash?: string | null;
}) {
  const supabase = createServerSupabaseClient();
  const expiresAt = addDays(30);

  const { data, error } = await supabase
    .from("cases")
    .insert({
      public_id: createPublicId(),
      status: "received",
      privacy_mode: input.privacyMode,
      narrative_text: input.narrativeText,
      ip_hash: input.ipHash ?? null,
      user_agent_hash: input.userAgentHash ?? null,
      expires_at: expiresAt,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapCaseRow(data as DbCaseRow);
}

export async function getCaseByPublicId(publicId: string): Promise<CaseRecord> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("cases").select("*").eq("public_id", publicId).single();

  if (error || !data) {
    throw new NotFoundAppError("No encontramos ese caso.");
  }

  return mapCaseRow(data as DbCaseRow);
}

export async function getCaseById(caseId: string): Promise<CaseRecord> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("cases").select("*").eq("id", caseId).single();

  if (error || !data) {
    throw new NotFoundAppError("No encontramos ese caso.");
  }

  return mapCaseRow(data as DbCaseRow);
}

export async function updateCaseRecord(
  caseId: string,
  updates: Partial<{
    status: CaseStatus;
    narrative_text: string | null;
    merged_case_text: string | null;
    case_type: string | null;
    summary: string | null;
    final_risk_score: number | null;
    final_risk_level: RiskLevel | null;
    confidence: number | null;
    analyzed_at: string | null;
    expires_at: string | null;
  }>,
) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("cases")
    .update(updates)
    .eq("id", caseId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapCaseRow(data as DbCaseRow);
}

export async function listRecentCases(limit = 20) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return ((data ?? []) as DbCaseRow[]).map(mapCaseRow);
}
