import { buildActionPlan } from "@/server/explanations/build-action-plan";
import { calibrateRiskDecision } from "@/server/risk/calibration";
import { computeFinalScore } from "@/server/risk/final-score";
import { deriveRiskFactors } from "@/server/risk/factors";
import { deriveRiskLevel } from "@/server/risk/risk-band";
import { computeSubscores } from "@/server/risk/subscores";
import { applyHardRules } from "@/server/signals/hard-rules";
import { mergeSignals } from "@/server/signals/merge-signals";
import { detectRuleSignals } from "@/server/signals/detectors/rule-signals";
import type { RiskLevel } from "@/types/domain";
import { forbiddenAbsoluteClaims, qualityFixtures } from "./quality-fixtures";

const rank: RiskLevel[] = ["low", "medium", "high", "very_high"];

function compareRisk(left: RiskLevel, right: RiskLevel) {
  return rank.indexOf(left) - rank.indexOf(right);
}

function inferCaseType(text: string) {
  const lower = text.toLowerCase();

  if (/\b(banco|homebanking|token|cuenta bloqueada)\b/.test(lower)) {
    return "bank_support";
  }
  if (/\b(marketplace|vendedor|comprar|compra|reservar|retirar|producto|alquiler)\b/.test(lower)) {
    return "online_purchase";
  }
  if (/\b(mama|papa|hijo|hija|familiar|numero nuevo|hermana)\b/.test(lower)) {
    return "family_money";
  }
  if (/\b(fiscalia|policia|allanamiento|arresto|causa penal|denuncia)\b/.test(lower)) {
    return "authority_extortion";
  }

  return "mixed";
}

function evaluateText(text: string, caseType: string | null) {
  const signals = mergeSignals({
    ruleSignals: detectRuleSignals(text),
  });
  const signalCodes = signals.map((signal) => signal.code);
  const subscores = computeSubscores(signals);
  const baseScore = computeFinalScore(subscores);
  const hardRules = applyHardRules(signalCodes, deriveRiskLevel(baseScore));
  const factors = deriveRiskFactors(signals);
  const calibrated = calibrateRiskDecision({
    baseScore,
    baseLevel: hardRules.level,
    signalCodes,
    factors,
    hardRulesApplied: hardRules.applied,
  });
  const actionPlan = buildActionPlan({ riskLevel: calibrated.level, caseType, signals });

  return {
    riskLevel: calibrated.level,
    score: calibrated.score,
    signalCodes,
    missingSignals: [] as string[],
    unexpectedSignals: [] as string[],
    actionText: [
      actionPlan.primaryAction,
      ...actionPlan.steps,
      ...actionPlan.avoid,
      ...actionPlan.verification,
      ...actionPlan.escalation,
    ].join(" "),
  };
}

const rows: Array<{
  name: string;
  category: string;
  expectedRisk: RiskLevel;
  actualRisk: RiskLevel;
  score: number;
  signals: string;
  missingSignals: string;
  unexpectedSignals: string;
  result: "exact" | "within_range" | "false_negative" | "false_positive" | "fail";
}> = [];
const failures: string[] = [];
const summary = {
  exact: 0,
  withinRange: 0,
  falseNegatives: 0,
  falsePositives: 0,
  failures: 0,
};

for (const fixture of qualityFixtures) {
  const caseType = fixture.expected.caseType ?? inferCaseType(fixture.input.narrative);
  const result = evaluateText(fixture.input.narrative, caseType);
  const missingSignals = fixture.expected.requiredSignals.filter((code) => !result.signalCodes.includes(code));
  const unexpectedSignals = fixture.expected.forbiddenSignals.filter((code) => result.signalCodes.includes(code));
  const lowerActionText = result.actionText.toLowerCase();
  const forbiddenClaims = forbiddenAbsoluteClaims.filter((claim) => lowerActionText.includes(claim.toLowerCase()));
  const missingActionKeywords = fixture.expected.expectedPrimaryActionIncludes.filter(
    (keyword) => !lowerActionText.includes(keyword.toLowerCase()),
  );
  const inRange = fixture.expected.acceptableRiskLevels.includes(result.riskLevel);
  const exact = result.riskLevel === fixture.expected.expectedRiskLevel;
  const riskDiff = compareRisk(result.riskLevel, fixture.expected.expectedRiskLevel);

  let rowResult: (typeof rows)[number]["result"] = "fail";
  if (exact && !missingSignals.length && !unexpectedSignals.length && !forbiddenClaims.length && !missingActionKeywords.length) {
    rowResult = "exact";
    summary.exact += 1;
  } else if (inRange && !missingSignals.length && !unexpectedSignals.length && !forbiddenClaims.length && !missingActionKeywords.length) {
    rowResult = "within_range";
    summary.withinRange += 1;
  } else if (riskDiff < 0) {
    rowResult = "false_negative";
    summary.falseNegatives += 1;
  } else if (riskDiff > 0) {
    rowResult = "false_positive";
    summary.falsePositives += 1;
  } else {
    summary.failures += 1;
  }

  rows.push({
    name: fixture.name,
    category: fixture.category,
    expectedRisk: fixture.expected.expectedRiskLevel,
    actualRisk: result.riskLevel,
    score: result.score,
    signals: result.signalCodes.join(", "),
    missingSignals: missingSignals.join(", "),
    unexpectedSignals: unexpectedSignals.join(", "),
    result: rowResult,
  });

  if (rowResult !== "exact" && rowResult !== "within_range") {
    failures.push(
      `${fixture.name}: expected ${fixture.expected.expectedRiskLevel} (${fixture.expected.acceptableRiskLevels.join("/")}), got ${result.riskLevel}; missing=[${missingSignals.join(", ")}], unexpected=[${unexpectedSignals.join(", ")}], missingAction=[${missingActionKeywords.join(", ")}], forbiddenClaims=[${forbiddenClaims.join(", ")}]. Notes: ${fixture.expected.notes}`,
    );
  }
}

console.table(rows);
console.log(
  `Quality summary: exact=${summary.exact}, within_range=${summary.withinRange}, false_negatives=${summary.falseNegatives}, false_positives=${summary.falsePositives}, failures=${summary.failures}, total=${qualityFixtures.length}`,
);

if (failures.length) {
  console.error("Quality regression failures:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Quality suite passed (${qualityFixtures.length} fixtures).`);
