import { createServerSupabaseClient } from "@/server/db/client";
import { computePatternMatchScore } from "@/server/patterns/match-score";
import { loadPatternsFromDisk } from "@/server/patterns/load-from-disk";
import { syncPatternsToDatabase } from "@/server/patterns/sync-to-db";
import type { PatternDefinition } from "@/types/patterns";

let patternSyncPromise: Promise<void> | null = null;

interface DatabasePatternRow {
  id: string;
  code: string;
  name: string;
  category: string;
  current_version_id: string;
  pattern_versions: Array<{
    id: string;
    definition_snapshot: {
      summary: string;
      core_signals: string[];
      high_weight_signals: string[];
      hard_rules: Array<{ when: string[]; floor: "low" | "medium" | "high" | "very_high" }>;
      counter_signals: string[];
      variant_examples: string[];
      recommended_actions: string[];
      minimum_risk_level: "low" | "medium" | "high" | "very_high";
    };
  }> | null;
}

function toDefinition(row: DatabasePatternRow): PatternDefinition {
  const snapshot = row.pattern_versions?.[0]?.definition_snapshot;
  return {
    code: row.code,
    name: row.name,
    category: row.category,
    summary: snapshot?.summary ?? "",
    coreSignals: snapshot?.core_signals ?? [],
    highWeightSignals: snapshot?.high_weight_signals ?? [],
    hardRules: snapshot?.hard_rules ?? [],
    counterSignals: snapshot?.counter_signals ?? [],
    variantExamples: snapshot?.variant_examples ?? [],
    recommendedActions: snapshot?.recommended_actions ?? [],
    minimumRiskLevel: snapshot?.minimum_risk_level ?? "medium",
  };
}

export async function ensurePatternsAvailable() {
  if (!patternSyncPromise) {
    patternSyncPromise = syncPatternsToDatabase().then(() => undefined);
  }

  await patternSyncPromise;
}

export async function loadRuntimePatterns(): Promise<
  Array<{ id: string; versionId: string; definition: PatternDefinition }>
> {
  try {
    await ensurePatternsAvailable();
  } catch {
    const fallback = await loadPatternsFromDisk();
    return fallback.map((pattern) => ({
      id: pattern.code,
      versionId: pattern.code,
      definition: pattern,
    }));
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("patterns")
    .select("id, code, name, category, current_version_id, pattern_versions!current_version_id(id, definition_snapshot)")
    .eq("is_active", true);

  if (error) {
    const fallback = await loadPatternsFromDisk();
    return fallback.map((pattern) => ({
      id: pattern.code,
      versionId: pattern.code,
      definition: pattern,
    }));
  }

  return ((data ?? []) as unknown as DatabasePatternRow[]).map((row) => ({
    id: row.id,
    versionId: row.current_version_id,
    definition: toDefinition(row),
  }));
}

export async function matchOfficialPatterns(input: {
  signalCodes: string[];
  caseType: string | null;
  narrativeTheme: string | null;
}) {
  const patterns = await loadRuntimePatterns();

  return patterns
    .map((pattern) => ({
      id: pattern.id,
      versionId: pattern.versionId,
      definition: pattern.definition,
      matchScore: computePatternMatchScore({
        pattern: pattern.definition,
        signalCodes: input.signalCodes,
        caseType: input.caseType,
        narrativeTheme: input.narrativeTheme,
      }),
    }))
    .filter((match) => match.matchScore >= 0.6)
    .sort((left, right) => right.matchScore - left.matchScore);
}
