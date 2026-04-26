import type { ExtractedSignal, ExtractionResult } from "@/types/analysis";

function hasSignal(signals: ExtractedSignal[], code: string) {
  return signals.some((signal) => signal.code === code);
}

function addSignal(signals: ExtractedSignal[], signal: ExtractedSignal) {
  if (!hasSignal(signals, signal.code)) {
    signals.push(signal);
  }
}

export function normalizeExtractionForRisk(input: {
  extraction: ExtractionResult;
  ruleSignals: ExtractedSignal[];
  mergedCaseText: string;
}) {
  const ruleCodes = new Set(input.ruleSignals.map((signal) => signal.code));
  const adjustments: string[] = [];
  const normalized: ExtractionResult = {
    ...input.extraction,
    signals: [...input.extraction.signals],
    uncertainties: [...input.extraction.uncertainties],
  };

  for (const ruleSignal of input.ruleSignals) {
    const isCritical =
      ruleSignal.code === "asks_for_otp" ||
      ruleSignal.code === "asks_for_credentials" ||
      ruleSignal.code === "threatens_arrest" ||
      ruleSignal.code === "authority_impersonation" ||
      ruleSignal.code === "off_platform_payment" ||
      ruleSignal.code === "suspicious_link";

    if (isCritical && !hasSignal(normalized.signals, ruleSignal.code)) {
      addSignal(normalized.signals, { code: ruleSignal.code, confidence: Math.max(ruleSignal.confidence, 0.86) });
      adjustments.push(`added_critical_rule_signal_${ruleSignal.code}`);
    }
  }

  if (ruleCodes.has("asks_for_otp")) {
    if (normalized.caseType !== "bank_support" && (ruleCodes.has("bank_impersonation") || ruleCodes.has("support_impersonation"))) {
      normalized.caseType = "bank_support";
      adjustments.push("case_type_bank_support_from_otp");
    }
    if (normalized.requestedAction !== "share_otp") {
      normalized.requestedAction = "share_otp";
      adjustments.push("requested_action_share_otp_from_rules");
    }
    normalized.narrativeTheme = "bank_support";
  }

  if (ruleCodes.has("asks_for_credentials")) {
    normalized.requestedAction = "share_credentials";
    adjustments.push("requested_action_share_credentials_from_rules");
  }

  if (ruleCodes.has("authority_impersonation") || ruleCodes.has("threatens_arrest")) {
    normalized.caseType = "authority_extortion";
    normalized.narrativeTheme = "authority_pressure";
    normalized.actor = "authority";
    adjustments.push("case_type_authority_extortion_from_rules");
  }

  if (ruleCodes.has("family_impersonation") || ruleCodes.has("new_number_claim")) {
    normalized.caseType = "family_money";
    normalized.narrativeTheme = "family_urgency";
    normalized.actor = "family";
    adjustments.push("case_type_family_money_from_rules");
  }

  if (
    ruleCodes.has("marketplace_p2p_context") ||
    ruleCodes.has("off_platform_payment") ||
    ruleCodes.has("platform_bypass") ||
    ruleCodes.has("advance_payment_request") ||
    ruleCodes.has("payment_before_delivery")
  ) {
    normalized.caseType = "online_purchase";
    normalized.narrativeTheme = "marketplace_bypass";
    normalized.actor = normalized.actor === "unknown" ? "seller" : normalized.actor;
    adjustments.push("case_type_online_purchase_from_rules");
  }

  if (ruleCodes.has("deposit_request")) {
    normalized.requestedAction = "pay_deposit";
    adjustments.push("requested_action_pay_deposit_from_rules");
  } else if (ruleCodes.has("transfer_request") || ruleCodes.has("advance_payment_request")) {
    normalized.requestedAction = "transfer_money";
    adjustments.push("requested_action_transfer_money_from_rules");
  } else if (ruleCodes.has("suspicious_link")) {
    normalized.requestedAction = "follow_link";
    adjustments.push("requested_action_follow_link_from_rules");
  }

  if (!input.mergedCaseText.trim()) {
    normalized.uncertainties.push("Hay muy poca evidencia textual para calibrar el riesgo con precision.");
    adjustments.push("added_low_evidence_uncertainty");
  } else if (normalized.signals.length <= 1) {
    normalized.uncertainties.push("Hay pocas senales detectadas; si vas a decidir, conviene sumar mas contexto.");
    adjustments.push("added_few_signals_uncertainty");
  }

  return {
    extraction: normalized,
    adjustments: Array.from(new Set(adjustments)),
  };
}
