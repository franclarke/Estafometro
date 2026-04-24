import { createHash } from "node:crypto";

import { createServerSupabaseClient } from "@/server/db/client";
import { loadPatternsFromDisk } from "@/server/patterns/load-from-disk";

function toSnapshot(pattern: Awaited<ReturnType<typeof loadPatternsFromDisk>>[number]) {
  return {
    code: pattern.code,
    name: pattern.name,
    category: pattern.category,
    summary: pattern.summary,
    core_signals: pattern.coreSignals,
    high_weight_signals: pattern.highWeightSignals,
    hard_rules: pattern.hardRules,
    counter_signals: pattern.counterSignals,
    variant_examples: pattern.variantExamples,
    recommended_actions: pattern.recommendedActions,
    minimum_risk_level: pattern.minimumRiskLevel,
  };
}

export async function syncPatternsToDatabase() {
  const supabase = createServerSupabaseClient();
  const patterns = await loadPatternsFromDisk();
  const summary = { added: 0, updated: 0, unchanged: 0, errors: [] as string[] };

  for (const pattern of patterns) {
    const snapshot = toSnapshot(pattern);
    const sourceHash = createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");

    const { data: existingPattern, error: patternLookupError } = await supabase
      .from("patterns")
      .select("id, current_version_id")
      .eq("code", pattern.code)
      .maybeSingle();

    if (patternLookupError) {
      summary.errors.push(`${pattern.code}: ${patternLookupError.message}`);
      continue;
    }

    if (!existingPattern) {
      const { data: createdPattern, error: createPatternError } = await supabase
        .from("patterns")
        .insert({
          code: pattern.code,
          name: pattern.name,
          category: pattern.category,
          is_active: true,
        })
        .select("id")
        .single();

      if (createPatternError) {
        summary.errors.push(`${pattern.code}: ${createPatternError.message}`);
        continue;
      }

      const { data: version, error: versionError } = await supabase
        .from("pattern_versions")
        .insert({
          pattern_id: createdPattern.id,
          version: 1,
          definition_snapshot: snapshot,
          source_hash: sourceHash,
        })
        .select("id")
        .single();

      if (versionError) {
        summary.errors.push(`${pattern.code}: ${versionError.message}`);
        continue;
      }

      await supabase.from("patterns").update({ current_version_id: version.id }).eq("id", createdPattern.id);
      summary.added += 1;
      continue;
    }

    if (!existingPattern.current_version_id) {
      summary.errors.push(`${pattern.code}: pattern exists but has no current_version_id`);
      continue;
    }

    const { data: currentVersion, error: currentVersionError } = await supabase
      .from("pattern_versions")
      .select("id, version, source_hash")
      .eq("id", existingPattern.current_version_id)
      .single();

    if (currentVersionError) {
      summary.errors.push(`${pattern.code}: ${currentVersionError.message}`);
      continue;
    }

    if (currentVersion.source_hash === sourceHash) {
      summary.unchanged += 1;
      continue;
    }

    const nextVersion = Number(currentVersion.version ?? 0) + 1;
    const { data: insertedVersion, error: insertVersionError } = await supabase
      .from("pattern_versions")
      .insert({
        pattern_id: existingPattern.id,
        version: nextVersion,
        definition_snapshot: snapshot,
        source_hash: sourceHash,
      })
      .select("id")
      .single();

    if (insertVersionError) {
      summary.errors.push(`${pattern.code}: ${insertVersionError.message}`);
      continue;
    }

    await supabase
      .from("patterns")
      .update({
        name: pattern.name,
        category: pattern.category,
        current_version_id: insertedVersion.id,
        is_active: true,
      })
      .eq("id", existingPattern.id);

    summary.updated += 1;
  }

  return summary;
}
