import { promises as fs } from "node:fs";
import path from "node:path";

import YAML from "yaml";

import { patternSchema } from "@/server/patterns/schema";
import type { PatternFileRecord } from "@/types/patterns";

async function walk(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const resolved = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return walk(resolved);
      }

      return resolved.endsWith(".yaml") || resolved.endsWith(".yml") ? [resolved] : [];
    }),
  );

  return files.flat();
}

export async function loadPatternsFromDisk(rootDir = path.join(process.cwd(), "patterns")) {
  const files = await walk(rootDir);
  const patterns: PatternFileRecord[] = [];

  for (const file of files) {
    if (path.basename(file).startsWith("_")) {
      continue;
    }

    const content = await fs.readFile(file, "utf-8");
    const parsed = patternSchema.parse(YAML.parse(content));
    patterns.push({
      code: parsed.code,
      name: parsed.name,
      category: parsed.category,
      summary: parsed.summary,
      coreSignals: parsed.core_signals,
      highWeightSignals: parsed.high_weight_signals,
      hardRules: parsed.hard_rules,
      counterSignals: parsed.counter_signals,
      variantExamples: parsed.variant_examples,
      recommendedActions: parsed.recommended_actions,
      minimumRiskLevel: parsed.minimum_risk_level,
      sourcePath: file,
    });
  }

  return patterns.sort((left, right) => left.code.localeCompare(right.code));
}
