import { clamp } from "@/lib/utils";
import type { Subscores } from "@/types/analysis";

export function computeFinalScore(subscores: Subscores) {
  return clamp(
    subscores.interactionScore +
      subscores.paymentScore +
      subscores.identityScore +
      subscores.platformScore +
      subscores.externalValidationScore +
      subscores.behavioralScore +
      subscores.logicScore,
    0,
    100,
  );
}
