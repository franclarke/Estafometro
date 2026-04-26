import type { NormalizedSignal, RiskFactor, RiskFactorCode } from "@/types/analysis";

const factorDefinitions: Record<
  RiskFactorCode,
  Omit<RiskFactor, "code" | "signalCodes">
> = {
  money_request: {
    label: "Pedido de dinero o pago",
    description: "La situacion incluye transferencia, sena, deposito, alias, CBU o pago pedido al usuario.",
    impact: "risk",
    severity: "medium",
  },
  credential_request: {
    label: "Pedido de codigos o credenciales",
    description: "Aparece un pedido de OTP, token, clave o credencial sensible.",
    impact: "risk",
    severity: "critical",
  },
  identity_impersonation: {
    label: "Identidad sensible o suplantada",
    description: "La contraparte se presenta como banco, soporte, autoridad, familiar, correo u otro actor sensible.",
    impact: "risk",
    severity: "high",
  },
  authority_threat: {
    label: "Amenaza legal o de autoridad",
    description: "Hay amenazas de arresto, allanamiento, causa, denuncia o pago para evitar consecuencias.",
    impact: "risk",
    severity: "critical",
  },
  process_bypass: {
    label: "Desvio del proceso normal",
    description: "Se intenta salir de una plataforma, canal oficial o flujo verificable.",
    impact: "risk",
    severity: "high",
  },
  time_pressure: {
    label: "Apuro o presion temporal",
    description: "El caso usa urgencia, escasez o plazo corto para reducir la verificacion.",
    impact: "risk",
    severity: "medium",
  },
  suspicious_link: {
    label: "Link o interfaz sospechosa",
    description: "Hay link, dominio, formulario o pantalla de validacion que requiere cuidado.",
    impact: "risk",
    severity: "high",
  },
  asymmetric_risk: {
    label: "Riesgo cargado sobre el usuario",
    description: "Te piden asumir el riesgo antes de recibir o verificar la contraprestacion.",
    impact: "risk",
    severity: "high",
  },
  positive_verification: {
    label: "Identidad parcialmente verificada",
    description: "Hay un dato que reduce incertidumbre, aunque no anula banderas rojas.",
    impact: "trust",
    severity: "positive",
  },
  safe_payment_flow: {
    label: "Flujo de pago mas seguro",
    description: "El caso menciona pago contra entrega, pago al retirar o canal oficial de plataforma.",
    impact: "trust",
    severity: "positive",
  },
};

const factorSignalMap: Record<RiskFactorCode, string[]> = {
  money_request: [
    "transfer_request",
    "deposit_request",
    "advance_payment_request",
    "payment_before_delivery",
    "cbu_shared",
    "alias_shared",
  ],
  credential_request: [
    "asks_for_otp",
    "asks_for_credentials",
    "behavior_credential_phishing_disguise_medium",
    "behavior_credential_phishing_disguise_high",
    "behavior_combo_disguised_credential_theft",
  ],
  identity_impersonation: [
    "authority_impersonation",
    "bank_impersonation",
    "support_impersonation",
    "family_impersonation",
    "delivery_impersonation",
    "visual_brand_impersonation",
    "inconsistent_identity",
    "new_number_claim",
    "identity_change",
  ],
  authority_threat: ["threatens_arrest", "threatens_legal_action", "bribery_request"],
  process_bypass: [
    "platform_bypass",
    "off_platform_payment",
    "channel_shift",
    "payment_settlement_bypass",
    "refuses_in_person_exchange",
    "fake_verification_interface",
    "behavior_standard_process_bypass_medium",
    "behavior_standard_process_bypass_high",
  ],
  time_pressure: [
    "urgent_transfer",
    "urgency_language",
    "deadline_pressure",
    "scarcity_pressure",
    "emotional_pressure",
    "behavior_artificial_time_pressure_medium",
    "behavior_artificial_time_pressure_high",
  ],
  suspicious_link: [
    "suspicious_link",
    "phishing_domain_characteristics",
    "brand_domain_mismatch",
    "punycode_domain",
    "domain_recently_created",
    "fake_verification_interface",
  ],
  asymmetric_risk: [
    "advance_payment_request",
    "payment_before_delivery",
    "unconfirmed_payment_pressure",
    "refuses_in_person_exchange",
    "behavior_asymmetric_risk_medium",
    "behavior_asymmetric_risk_high",
    "behavior_combo_asymmetric_risk_time_pressure",
    "behavior_combo_asymmetric_risk_process_bypass",
    "behavior_combo_nonsensical_transaction_justification",
  ],
  positive_verification: ["verified_identity_signal"],
  safe_payment_flow: ["payment_on_delivery_available", "official_platform_interaction"],
};

const severityRank: Record<RiskFactor["severity"], number> = {
  positive: -1,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export function deriveRiskFactors(signals: Array<Pick<NormalizedSignal, "code">>): RiskFactor[] {
  const signalCodes = new Set(signals.map((signal) => signal.code));
  const factors: RiskFactor[] = [];

  for (const [code, mappedSignals] of Object.entries(factorSignalMap) as Array<[RiskFactorCode, string[]]>) {
    const matchedSignals = mappedSignals.filter((signalCode) => signalCodes.has(signalCode));
    if (!matchedSignals.length) {
      continue;
    }

    factors.push({
      code,
      ...factorDefinitions[code],
      signalCodes: matchedSignals,
    });
  }

  return factors.sort((left, right) => {
    if (left.impact !== right.impact) {
      return left.impact === "risk" ? -1 : 1;
    }
    return severityRank[right.severity] - severityRank[left.severity];
  });
}

export function hasRiskFactor(factors: RiskFactor[], code: RiskFactorCode) {
  return factors.some((factor) => factor.code === code);
}
