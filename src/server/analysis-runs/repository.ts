import { createServerSupabaseClient } from "@/server/db/client";
import type { Json } from "@/server/db/generated.types";

export async function createAnalysisRun(input: {
  caseId: string;
  pipelineVersion: string;
  promptVersion: string;
  llmModel: string;
  status: "success" | "partial" | "error";
  rawLlmResponse?: Record<string, unknown> | null;
  subscores?: Record<string, unknown>;
  hardRulesApplied?: string[];
  durationMs?: number;
  errorMessage?: string | null;
}) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("analysis_runs")
    .insert({
      case_id: input.caseId,
      pipeline_version: input.pipelineVersion,
      prompt_version: input.promptVersion,
      llm_model: input.llmModel,
      status: input.status,
      raw_llm_response: (input.rawLlmResponse as Json) ?? null,
      subscores: (input.subscores as Json) ?? ({} as Json),
      hard_rules_applied: input.hardRulesApplied ?? [],
      duration_ms: input.durationMs ?? null,
      error_message: input.errorMessage ?? null,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id as string;
}

export async function getLatestAnalysisRun(caseId: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("analysis_runs")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
