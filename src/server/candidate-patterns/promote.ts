import { createServerSupabaseClient } from "@/server/db/client";
import { loadPatternsFromDisk } from "@/server/patterns/load-from-disk";

export async function promoteCandidatePattern(input: {
  candidatePatternId: string;
  newPatternCode: string;
}) {
  const supabase = createServerSupabaseClient();
  const patterns = await loadPatternsFromDisk();
  const pattern = patterns.find((item) => item.code === input.newPatternCode);

  if (!pattern) {
    throw new Error("No existe un pattern con ese código en el repo.");
  }

  const { data: existingPattern, error: patternError } = await supabase
    .from("patterns")
    .select("id")
    .eq("code", input.newPatternCode)
    .single();

  if (patternError) {
    throw patternError;
  }

  const { error } = await supabase
    .from("candidate_patterns")
    .update({
      promoted_pattern_id: existingPattern.id,
      status: "promoted",
    })
    .eq("id", input.candidatePatternId);

  if (error) {
    throw error;
  }

  return existingPattern.id as string;
}
