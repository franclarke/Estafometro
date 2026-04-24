/**
 * Deterministic rigor test for the classic marketplace advance-payment scam.
 *
 * This now exercises the behavior-first engine:
 * text -> rule evidence -> inferred behavioral vectors -> behavioral signals ->
 * scoring / hard rules / pattern matching.
 */

import path from "node:path";

import { inferBehavioralVectors } from "@/server/extraction/behavioral-heuristics";
import { loadPatternsFromDisk } from "@/server/patterns/load-from-disk";
import { computePatternMatchScore } from "@/server/patterns/match-score";
import { applyHardRules } from "@/server/risk/apply-hard-rules";
import { computeFinalScore } from "@/server/risk/final-score";
import { deriveRiskLevel } from "@/server/risk/risk-band";
import { computeSubscores } from "@/server/risk/subscores";
import { deriveBehavioralSignals } from "@/server/signals/behavioral-signals";
import { detectRuleSignals } from "@/server/signals/detectors/rule-signals";
import { mergeSignals } from "@/server/signals/merge-signals";
import type { RiskLevel } from "@/types/domain";

const USER_TEXT =
  "Quiero comprar una playstation por marketplace, y al momento de llegar al " +
  "lugar de encuentro que es un edificio, el vendedor me dice que primero le " +
  "transfiera el dinero por su seguridad, y luego el baja con la playstation";

const riskRank: RiskLevel[] = ["low", "medium", "high", "very_high"];

function floorRisk(current: RiskLevel, floor: RiskLevel): RiskLevel {
  return riskRank.indexOf(floor) > riskRank.indexOf(current) ? floor : current;
}

function minScoreFor(level: RiskLevel): number {
  switch (level) {
    case "medium":
      return 25;
    case "high":
      return 50;
    case "very_high":
      return 75;
    default:
      return 0;
  }
}

function formatSignals(signals: Array<{ code: string; weight: number; groupName: string }>) {
  return signals
    .map((signal) => `  - ${signal.code.padEnd(46)} weight=${signal.weight} group=${signal.groupName}`)
    .join("\n");
}

async function main() {
   
  console.log("==============================================================");
   
  console.log(" Estafometro · Marketplace advance-payment behavioral test");
   
  console.log("==============================================================\n");
   
  console.log("INPUT:\n" + USER_TEXT + "\n");

  const ruleSignals = detectRuleSignals(USER_TEXT);
  const behavioralVectors = inferBehavioralVectors({
    text: USER_TEXT,
    signalCodes: ruleSignals.map((signal) => signal.code),
    requestedAction: "transfer_money",
  });
  const behavioralSignals = deriveBehavioralSignals(behavioralVectors);
  const merged = mergeSignals({ ruleSignals, behavioralSignals });

   
  console.log("[behavioral vectors]");
   
  console.log(behavioralVectors);
   
  console.log("\n[behavioral + support signals]");
   
  console.log(formatSignals(merged));

  const subscores = computeSubscores(merged);
  const baseScore = computeFinalScore(subscores);
  const baseLevel = deriveRiskLevel(baseScore);
  const signalCodes = merged.map((signal) => signal.code);
  const hardRules = applyHardRules(signalCodes, baseLevel);

   
  console.log("\n[subscores]", subscores);
   
  console.log(`[base] score=${baseScore} level=${baseLevel}`);
   
  console.log(`[hard rules] applied=${JSON.stringify(hardRules.applied)} -> level=${hardRules.level}`);

  const patternsRoot = path.join(process.cwd(), "patterns");
  const patterns = await loadPatternsFromDisk(patternsRoot);
  const signalSet = new Set(signalCodes);
  const matches = patterns
    .map((pattern) => ({
      pattern,
      matchScore: computePatternMatchScore({
        pattern: {
          code: pattern.code,
          name: pattern.name,
          category: pattern.category,
          summary: pattern.summary,
          coreSignals: pattern.coreSignals,
          highWeightSignals: pattern.highWeightSignals,
          hardRules: pattern.hardRules,
          counterSignals: pattern.counterSignals,
          variantExamples: pattern.variantExamples,
          recommendedActions: pattern.recommendedActions,
          minimumRiskLevel: pattern.minimumRiskLevel,
        },
        signalCodes,
        caseType: "online_purchase",
        narrativeTheme: "marketplace_bypass",
      }),
    }))
    .filter((match) => match.matchScore >= 0.6)
    .sort((left, right) => right.matchScore - left.matchScore);

  let level = hardRules.level;
  const patternApplied: string[] = [];
  for (const match of matches) {
    level = floorRisk(level, match.pattern.minimumRiskLevel);
    if (match.pattern.minimumRiskLevel !== "low") {
      patternApplied.push(`${match.pattern.code}_min_${match.pattern.minimumRiskLevel}`);
    }
    for (const hardRule of match.pattern.hardRules) {
      if (hardRule.when.every((code) => signalSet.has(code))) {
        level = floorRisk(level, hardRule.floor);
        patternApplied.push(`${match.pattern.code}:${hardRule.when.join("+")}->${hardRule.floor}`);
      }
    }
  }

  const finalScore = Math.max(baseScore, minScoreFor(level));
   
  console.log(`\n[pattern floor] applied=${JSON.stringify(patternApplied)}`);
   
  console.log(`[final] level=${level} score=${finalScore}`);

  if (!(level === "high" || level === "very_high")) {
    throw new Error(`Expected high or very_high risk, got ${level}`);
  }

  if (finalScore <= 60) {
    throw new Error(`Expected score > 60, got ${finalScore}`);
  }

  if (!signalSet.has("behavior_combo_asymmetric_risk_process_bypass")) {
    throw new Error("Expected behavior_combo_asymmetric_risk_process_bypass to be present");
  }

  if (!signalSet.has("behavior_justification_nonsensical")) {
    throw new Error("Expected behavior_justification_nonsensical to be present");
  }

  if (!matches.some((match) => match.pattern.code === "online_purchase_marketplace_advance_payment")) {
    throw new Error("Expected official marketplace advance-payment pattern to match");
  }

   
  console.log("\nPASS -> El motor eleva riesgo por asimetria + bypass, no por palabras aisladas.");
}

main().catch((error) => {
   
  console.error("Script failed:", error);
  process.exit(1);
});
