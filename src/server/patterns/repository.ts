import { createServerSupabaseClient } from "@/server/db/client";
import { logger } from "@/lib/logger";
import type { CheckStatus, CheckType } from "@/types/domain";
import type { Json } from "@/server/db/generated.types";

export async function replacePatternMatches(
  caseId: string,
  matches: Array<{
    patternId: string;
    patternVersionId: string;
    matchScore: number;
    matchedSignals: string[];
  }>,
) {
  const supabase = createServerSupabaseClient();

  await supabase.from("pattern_matches").delete().eq("case_id", caseId);

  if (!matches.length) {
    return;
  }

  const { error } = await supabase.from("pattern_matches").insert(
    matches.map((match) => ({
      case_id: caseId,
      pattern_id: match.patternId,
      pattern_version_id: match.patternVersionId,
      match_score: match.matchScore,
      matched_signals: match.matchedSignals,
    })),
  );

  if (error) {
    throw error;
  }
}

export async function listPatternMatches(caseId: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("pattern_matches")
    .select("id, match_score, matched_signals, patterns!inner(code, name)")
    .eq("case_id", caseId)
    .order("match_score", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    patternCode: (row.patterns as unknown as { code: string; name: string }).code,
    patternName: (row.patterns as unknown as { code: string; name: string }).name,
    matchScore: row.match_score,
    matchedSignals: row.matched_signals,
  }));
}

export async function replaceExternalChecks(
  caseId: string,
  checks: Array<{
    checkType: CheckType;
    status: CheckStatus;
    resultSummary: string;
    resultJson: Record<string, unknown>;
    signalImpact: Record<string, unknown>;
  }>,
) {
  const supabase = createServerSupabaseClient();

  await supabase.from("external_checks").delete().eq("case_id", caseId);

  if (!checks.length) {
    return;
  }

  for (const check of checks) {
    const { error } = await supabase.from("external_checks").insert({
      case_id: caseId,
      check_type: check.checkType,
      status: check.status,
      result_summary: check.resultSummary,
      result_json: check.resultJson as unknown as Json,
      signal_impact: check.signalImpact as unknown as Json,
    });

    if (!error) {
      continue;
    }

    if (error.code === "22P02" && error.message.includes("check_type")) {
      logger.warn(
        { caseId, checkType: check.checkType, error },
        "Skipping unsupported external check type while database enum is outdated",
      );
      continue;
    }

    throw error;
  }
}

export async function listExternalChecks(caseId: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("external_checks")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    type: row.check_type,
    status: row.status,
    summary: row.result_summary,
  }));
}
