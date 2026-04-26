import { createServerSupabaseClient } from "@/server/db/client";
import type { Json } from "@/server/db/generated.types";

export interface CandidatePatternSummary {
  id: string;
  fingerprint: string;
  occurrenceCount: number;
  status: "open" | "promoted" | "dismissed";
  signatureComponents: Record<string, unknown>;
  firstSeenAt: string;
  lastSeenAt: string;
  linkedCaseCount: number;
}

export async function upsertCandidatePattern(input: {
  fingerprint: string;
  signatureComponents: Record<string, unknown>;
  caseId: string;
}) {
  const supabase = createServerSupabaseClient();

  const { data: existing, error: existingError } = await supabase
    .from("candidate_patterns")
    .select("id, occurrence_count")
    .eq("fingerprint", input.fingerprint)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  let candidatePatternId = existing?.id as string | undefined;
  if (candidatePatternId) {
    const { error } = await supabase
      .from("candidate_patterns")
      .update({
        occurrence_count: Number(existing?.occurrence_count ?? 0) + 1,
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", candidatePatternId);

    if (error) {
      throw error;
    }
  } else {
    const { data, error } = await supabase
      .from("candidate_patterns")
      .insert({
        fingerprint: input.fingerprint,
        signature_components: input.signatureComponents as Json,
        occurrence_count: 1,
        first_seen_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        status: "open",
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    candidatePatternId = data.id as string;
  }

  const { error: linkError } = await supabase.from("case_candidate_pattern_links").upsert(
    {
      case_id: input.caseId,
      candidate_pattern_id: candidatePatternId,
    },
    { onConflict: "case_id,candidate_pattern_id" },
  );

  if (linkError) {
    throw linkError;
  }

  return candidatePatternId;
}

export async function listCandidatePatternSummaries(): Promise<CandidatePatternSummary[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("candidate_patterns")
    .select("id, fingerprint, signature_components, occurrence_count, first_seen_at, last_seen_at, status")
    .order("status", { ascending: true })
    .order("occurrence_count", { ascending: false })
    .order("last_seen_at", { ascending: false });

  if (error) {
    throw error;
  }

  const ids = (data ?? []).map((item) => item.id);
  const linkCounts = new Map<string, number>();

  if (ids.length) {
    const { data: links, error: linksError } = await supabase
      .from("case_candidate_pattern_links")
      .select("candidate_pattern_id")
      .in("candidate_pattern_id", ids);

    if (linksError) {
      throw linksError;
    }

    for (const link of links ?? []) {
      const candidateId = link.candidate_pattern_id as string;
      linkCounts.set(candidateId, (linkCounts.get(candidateId) ?? 0) + 1);
    }
  }

  return (data ?? [])
    .map((item) => ({
      id: item.id,
      fingerprint: item.fingerprint,
      occurrenceCount: item.occurrence_count,
      status: item.status as CandidatePatternSummary["status"],
      signatureComponents: (item.signature_components as Record<string, unknown> | null) ?? {},
      firstSeenAt: item.first_seen_at,
      lastSeenAt: item.last_seen_at,
      linkedCaseCount: linkCounts.get(item.id) ?? 0,
    }))
    .sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === "open" ? -1 : b.status === "open" ? 1 : a.status.localeCompare(b.status);
      }
      if (a.occurrenceCount !== b.occurrenceCount) {
        return b.occurrenceCount - a.occurrenceCount;
      }
      return b.lastSeenAt.localeCompare(a.lastSeenAt);
    });
}

export async function dismissCandidatePattern(candidatePatternId: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("candidate_patterns")
    .update({ status: "dismissed" })
    .eq("id", candidatePatternId)
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id as string;
}
