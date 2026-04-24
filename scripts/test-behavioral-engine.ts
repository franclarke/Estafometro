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
import type { BehavioralVectors, NormalizedSignal } from "@/types/analysis";
import type { RiskLevel } from "@/types/domain";

interface BehavioralFixture {
  id: string;
  title: string;
  text: string;
  requestedAction: string;
  expectedMinimum: RiskLevel;
}

const FIXTURES: BehavioralFixture[] = [
  {
    id: "dog-uber-deposit",
    title: "Vendedor absurdo con perro + Uber",
    text:
      "Vendo un perro de raza a $10.000. No te lo puedo mostrar porque mi hijo llora si lo ve irse, " +
      "transferime una seña para el pasaje y te lo mando en un Uber apenas impacte.",
    requestedAction: "pay_deposit",
    expectedMinimum: "high",
  },
  {
    id: "fake-receipt-buyer",
    title: "Comprador apura entrega con comprobante y demora bancaria",
    text:
      "Ya te mandé el comprobante, el banco anda lento y la transferencia demora. " +
      "Entregame la notebook ahora porque ya me estoy yendo.",
    requestedAction: "transfer_money",
    expectedMinimum: "high",
  },
  {
    id: "otp-validation",
    title: "OTP disfrazado de validación de compra",
    text:
      "Te llegó un código de 6 dígitos, pasámelo así valido la compra y el sistema libera el pago.",
    requestedAction: "share_otp",
    expectedMinimum: "very_high",
  },
  {
    id: "fomo-deposit",
    title: "FOMO para seña inmediata",
    text:
      "Tengo mucha gente preguntando por la bici, si la querés señámela ya porque en diez minutos la cierro con otro.",
    requestedAction: "pay_deposit",
    expectedMinimum: "high",
  },
];

const riskRank: RiskLevel[] = ["low", "medium", "high", "very_high"];

function formatSignals(signals: NormalizedSignal[]) {
  return signals
    .map((signal) => `  - ${signal.code.padEnd(48)} weight=${String(signal.weight).padStart(2)} group=${signal.groupName}`)
    .join("\n");
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

function floorRisk(current: RiskLevel, floor: RiskLevel): RiskLevel {
  return riskRank.indexOf(floor) > riskRank.indexOf(current) ? floor : current;
}

async function evaluateBehavioralOnly(input: BehavioralFixture) {
  const ruleSignals = detectRuleSignals(input.text);
  const vectors = inferBehavioralVectors({
    text: input.text,
    signalCodes: ruleSignals.map((signal) => signal.code),
    requestedAction: input.requestedAction,
  });
  const behavioralSignals = deriveBehavioralSignals(vectors);
  const merged = mergeSignals({ behavioralSignals });
  const subscores = computeSubscores(merged);
  const baseScore = computeFinalScore(subscores);
  const baseLevel = deriveRiskLevel(baseScore);
  const hardRules = applyHardRules(
    merged.map((signal) => signal.code),
    baseLevel,
  );

  const patterns = await loadPatternsFromDisk(path.join(process.cwd(), "patterns"));
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
        signalCodes: merged.map((signal) => signal.code),
        caseType:
          input.id === "otp-validation"
            ? "bank_support"
            : "online_purchase",
        narrativeTheme:
          input.id === "otp-validation"
            ? "bank_support"
            : "marketplace_bypass",
      }),
    }))
    .filter((match) => match.matchScore >= 0.6)
    .sort((left, right) => right.matchScore - left.matchScore);

  let finalLevel = hardRules.level;
  for (const match of matches) {
    finalLevel = floorRisk(finalLevel, match.pattern.minimumRiskLevel);
    for (const hardRule of match.pattern.hardRules) {
      if (hardRule.when.every((code) => merged.some((signal) => signal.code === code))) {
        finalLevel = floorRisk(finalLevel, hardRule.floor);
      }
    }
  }

  const finalScore = Math.max(baseScore, minScoreFor(finalLevel));

  return {
    ruleSignals,
    vectors,
    merged,
    subscores,
    hardRules,
    finalLevel,
    finalScore,
    matches,
  };
}

function assertMinimumLevel(actual: RiskLevel, expected: RiskLevel, label: string) {
  if (riskRank.indexOf(actual) < riskRank.indexOf(expected)) {
    throw new Error(`${label}: expected at least ${expected}, got ${actual}`);
  }
}

function explainVectors(vectors: BehavioralVectors) {
  return [
    `asymmetric_risk_demand=${vectors.asymmetricRiskDemand}`,
    `artificial_time_pressure=${vectors.artificialTimePressure}`,
    `trust_manipulation_excuse=${vectors.trustManipulationExcuse}`,
    `standard_process_bypass=${vectors.standardProcessBypass}`,
    `credential_phishing_disguise=${vectors.credentialPhishingDisguise}`,
    `justification_coherence=${vectors.justificationCoherence}`,
  ].join(" | ");
}

async function main() {
   
  console.log("======================================================================");
   
  console.log(" Estafometro · Zero-day behavioral engine test");
   
  console.log("======================================================================");
   
  console.log("La evaluación final usa SOLO señales conductuales derivadas de vectores.");
   
  console.log("Las keywords literales quedan logueadas como evidencia auxiliar, no como motor principal.\n");

  for (const fixture of FIXTURES) {
    const result = await evaluateBehavioralOnly(fixture);
    assertMinimumLevel(result.finalLevel, fixture.expectedMinimum, fixture.id);

     
    console.log(`CASE ${fixture.id} :: ${fixture.title}`);
     
    console.log(`text: ${fixture.text}`);
     
    console.log(`rule evidence: ${result.ruleSignals.map((signal) => signal.code).join(", ") || "(none)"}`);
     
    console.log(`behavioral vectors: ${explainVectors(result.vectors)}`);
     
    console.log(`reasoning: ${result.vectors.reasoning}`);
     
    console.log("[signals used for scoring]");
     
    console.log(formatSignals(result.merged));
     
    console.log("[subscores]", result.subscores);
     
    console.log(
      `[decision] level=${result.finalLevel} score=${result.finalScore} hard_rules=${JSON.stringify(result.hardRules.applied)}`,
    );
     
    console.log(
      `[patterns] ${result.matches.map((match) => `${match.pattern.code}:${match.matchScore.toFixed(2)}`).join(", ") || "(none)"}`,
    );
     
    console.log("----------------------------------------------------------------------\n");
  }

   
  console.log("PASS -> los casos absurdos o novedosos siguen cayendo por mecánica conductual.");
}

main().catch((error) => {
   
  console.error("Behavioral engine test failed:", error);
  process.exit(1);
});
