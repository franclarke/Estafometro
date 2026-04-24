import { createServerSupabaseClient } from "@/server/db/client";
import type { Json } from "@/server/db/generated.types";

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
