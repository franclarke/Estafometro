import { createServerSupabaseClient } from "@/server/db/client";

export async function applyPrivacyModeAfterAnalysis(input: {
  caseId: string;
  privacyMode: "minimal_retention" | "no_store_raw";
}) {
  if (input.privacyMode !== "no_store_raw") {
    return;
  }

  const supabase = createServerSupabaseClient();

  await Promise.all([
    supabase.from("cases").update({ narrative_text: null, merged_case_text: null }).eq("id", input.caseId),
    supabase.from("case_evidence").update({ raw_text: null, ocr_text: null }).eq("case_id", input.caseId),
    supabase.from("analysis_runs").update({ raw_llm_response: null }).eq("case_id", input.caseId),
  ]);
}
