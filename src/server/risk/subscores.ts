import { clamp } from "@/lib/utils";
import type { NormalizedSignal, Subscores } from "@/types/analysis";

export function computeSubscores(signals: NormalizedSignal[]): Subscores {
  const result: Subscores = {
    interactionScore: 0,
    paymentScore: 0,
    identityScore: 0,
    platformScore: 0,
    externalValidationScore: 0,
    behavioralScore: 0,
    logicScore: 0,
  };

  for (const signal of signals) {
    switch (signal.groupName) {
      case "interaction":
      case "urgency":
        result.interactionScore += signal.weight;
        break;
      case "payment":
        result.paymentScore += signal.weight;
        break;
      case "identity":
      case "authority":
        result.identityScore += signal.weight;
        break;
      case "platform":
        result.platformScore += signal.weight;
        break;
      case "behavioral":
        result.behavioralScore += signal.weight;
        break;
      case "logic":
        result.logicScore += signal.weight;
        break;
      case "external":
      case "trust_reducer":
      case "trust_builder":
        result.externalValidationScore += signal.weight;
        break;
      default:
        break;
    }
  }

  return {
    interactionScore: clamp(result.interactionScore, 0, 25),
    paymentScore: clamp(result.paymentScore, 0, 55),
    identityScore: clamp(result.identityScore, 0, 25),
    platformScore: clamp(result.platformScore, 0, 20),
    externalValidationScore: clamp(result.externalValidationScore, -10, 20),
    behavioralScore: clamp(result.behavioralScore, 0, 60),
    logicScore: clamp(result.logicScore, 0, 25),
  };
}
