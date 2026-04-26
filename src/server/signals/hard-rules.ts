import type { RiskLevel } from "@/types/domain";

const riskOrder: RiskLevel[] = ["low", "medium", "high", "very_high"];

const hardRules = [
  { id: "asks_for_otp_floor_high", when: ["asks_for_otp"], floor: "high" as const },
  {
    id: "behavior_credential_phishing_high_floor_very_high",
    when: ["behavior_credential_phishing_disguise_high"],
    floor: "very_high" as const,
  },
  {
    id: "authority_impersonation_bribery_request_floor_very_high",
    when: ["authority_impersonation", "bribery_request"],
    floor: "very_high" as const,
  },
  {
    id: "platform_bypass_off_platform_payment_floor_high",
    when: ["platform_bypass", "off_platform_payment"],
    floor: "high" as const,
  },
  {
    id: "delivery_impersonation_payment_link_floor_high",
    when: ["delivery_impersonation", "transfer_request", "suspicious_link"],
    floor: "high" as const,
  },
  {
    id: "threatens_arrest_transfer_request_floor_very_high",
    when: ["threatens_arrest", "transfer_request"],
    floor: "very_high" as const,
  },
  {
    id: "family_new_number_urgent_transfer_floor_high",
    when: ["family_impersonation", "new_number_claim", "urgent_transfer", "transfer_request"],
    floor: "high" as const,
  },
  {
    id: "suspicious_link_floor_medium",
    when: ["suspicious_link"],
    floor: "medium" as const,
  },
  {
    id: "asks_for_credentials_floor_very_high",
    when: ["asks_for_credentials"],
    floor: "very_high" as const,
  },
  {
    id: "behavior_combo_asymmetric_risk_time_pressure_floor_high",
    when: ["behavior_combo_asymmetric_risk_time_pressure"],
    floor: "high" as const,
  },
  {
    id: "behavior_combo_asymmetric_risk_process_bypass_floor_high",
    when: ["behavior_combo_asymmetric_risk_process_bypass"],
    floor: "high" as const,
  },
  {
    id: "behavior_combo_disguised_credential_theft_floor_very_high",
    when: ["behavior_combo_disguised_credential_theft"],
    floor: "very_high" as const,
  },
  {
    id: "behavior_combo_nonsensical_transaction_justification_floor_high",
    when: ["behavior_combo_nonsensical_transaction_justification"],
    floor: "high" as const,
  },
  {
    id: "advance_payment_request_transfer_floor_high",
    when: ["advance_payment_request", "transfer_request"],
    floor: "high" as const,
  },
  {
    id: "payment_before_delivery_floor_high",
    when: ["payment_before_delivery"],
    floor: "high" as const,
  },
  {
    id: "refuses_in_person_exchange_transfer_floor_very_high",
    when: ["refuses_in_person_exchange", "transfer_request"],
    floor: "very_high" as const,
  },
  {
    id: "marketplace_seller_safety_advance_payment_floor_high",
    when: ["marketplace_p2p_context", "seller_safety_excuse", "transfer_request"],
    floor: "high" as const,
  },
  {
    id: "in_person_meeting_advance_payment_floor_high",
    when: ["in_person_meeting_bait", "transfer_request"],
    floor: "high" as const,
  },
  {
    id: "unconfirmed_payment_release_floor_high",
    when: ["unconfirmed_payment_pressure", "payment_settlement_bypass"],
    floor: "high" as const,
  },
  {
    id: "prompt_injection_floor_high",
    when: ["prompt_injection_attempt"],
    floor: "high" as const,
  },
];

export function applyHardRules(signalCodes: string[], baseLevel: RiskLevel) {
  const codes = new Set(signalCodes);
  let level = baseLevel;
  const applied: string[] = [];

  for (const rule of hardRules) {
    if (rule.when.every((code) => codes.has(code))) {
      if (riskOrder.indexOf(rule.floor) > riskOrder.indexOf(level)) {
        level = rule.floor;
      }
      applied.push(rule.id);
    }
  }

  return { level, applied };
}
