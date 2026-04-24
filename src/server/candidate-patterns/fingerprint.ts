import { createHash } from "node:crypto";

import type { ExtractionResult } from "@/types/analysis";

export function buildCaseFingerprint(extraction: ExtractionResult) {
  const signature = {
    actor: extraction.actor,
    threat: extraction.threat,
    requested_action: extraction.requestedAction,
    payment_reason: extraction.paymentReason,
    theme: extraction.narrativeTheme,
    urgency: extraction.urgency,
    behavioral_vectors: {
      asymmetric_risk_demand: extraction.behavioralVectors.asymmetricRiskDemand,
      artificial_time_pressure: extraction.behavioralVectors.artificialTimePressure,
      trust_manipulation_excuse: extraction.behavioralVectors.trustManipulationExcuse,
      standard_process_bypass: extraction.behavioralVectors.standardProcessBypass,
      credential_phishing_disguise: extraction.behavioralVectors.credentialPhishingDisguise,
      justification_coherence: extraction.behavioralVectors.justificationCoherence,
    },
  };

  const fingerprint = createHash("sha256").update(JSON.stringify(signature)).digest("hex");

  return {
    fingerprint,
    signature,
  };
}
