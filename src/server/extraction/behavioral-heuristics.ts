import type { BehavioralSeverity, BehavioralVectors, JustificationCoherence } from "@/types/analysis";

const severityOrder: BehavioralSeverity[] = ["none", "low", "medium", "high"];

function hasAny(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

function maxSeverity(...values: BehavioralSeverity[]): BehavioralSeverity {
  return values.reduce((current, candidate) =>
    severityOrder.indexOf(candidate) > severityOrder.indexOf(current) ? candidate : current,
  );
}

function severityAtLeast(value: BehavioralSeverity, floor: BehavioralSeverity) {
  return severityOrder.indexOf(value) >= severityOrder.indexOf(floor);
}

export const DEFAULT_BEHAVIORAL_VECTORS: BehavioralVectors = {
  asymmetricRiskDemand: "none",
  artificialTimePressure: "none",
  trustManipulationExcuse: "none",
  standardProcessBypass: "none",
  credentialPhishingDisguise: "none",
  justificationCoherence: "coherent",
  reasoning: "No hubo suficiente evidencia para detectar vectores conductuales claros.",
};

export function evaluateJustificationCoherence(input: {
  requestedAction: string;
  asymmetricRiskDemand: BehavioralSeverity;
  standardProcessBypass: BehavioralSeverity;
  trustManipulationExcuse: BehavioralSeverity;
  credentialPhishingDisguise: BehavioralSeverity;
  text?: string;
}): JustificationCoherence {
  const lower = (input.text ?? "").toLowerCase();

  if (severityAtLeast(input.credentialPhishingDisguise, "medium")) {
    return "nonsensical";
  }

  if (
    severityAtLeast(input.asymmetricRiskDemand, "high") &&
    (severityAtLeast(input.standardProcessBypass, "medium") ||
      severityAtLeast(input.trustManipulationExcuse, "medium"))
  ) {
    return "nonsensical";
  }

  if (
    severityAtLeast(input.standardProcessBypass, "high") &&
    severityAtLeast(input.trustManipulationExcuse, "medium")
  ) {
    return "nonsensical";
  }

  if (
    input.requestedAction === "share_otp" ||
    input.requestedAction === "share_credentials" ||
    hasAny(lower, [/valida[rc]/i, /seguridad/i, /protocolo/i, /comprobante/i, /demora/i, /liberar (el |un )?(paquete|envio|compra)/i])
  ) {
    return "weak";
  }

  if (
    severityAtLeast(input.asymmetricRiskDemand, "medium") ||
    severityAtLeast(input.standardProcessBypass, "medium") ||
    severityAtLeast(input.trustManipulationExcuse, "medium")
  ) {
    return "weak";
  }

  return "coherent";
}

function buildReasoning(vectors: BehavioralVectors) {
  const findings: string[] = [];

  if (severityAtLeast(vectors.asymmetricRiskDemand, "medium")) {
    findings.push("la otra parte intenta trasladarte el riesgo antes de darte una garantia real");
  }

  if (severityAtLeast(vectors.standardProcessBypass, "medium")) {
    findings.push("te empuja a salir del proceso normal o a aceptar un atajo inseguro");
  }

  if (severityAtLeast(vectors.artificialTimePressure, "medium")) {
    findings.push("mete apuro o escasez artificial para que decidas sin verificar");
  }

  if (severityAtLeast(vectors.trustManipulationExcuse, "medium")) {
    findings.push("usa una excusa emocional o de seguridad para justificar el desvio");
  }

  if (severityAtLeast(vectors.credentialPhishingDisguise, "medium")) {
    findings.push("disfraza un pedido de credenciales como un tramite o validacion");
  }

  if (vectors.justificationCoherence === "nonsensical") {
    findings.push("la justificacion no cierra dentro de una transaccion honesta");
  } else if (vectors.justificationCoherence === "weak") {
    findings.push("la justificacion suena forzada y merece verificacion externa");
  }

  if (!findings.length) {
    return DEFAULT_BEHAVIORAL_VECTORS.reasoning;
  }

  const [firstFinding, ...rest] = findings;
  if (!firstFinding) {
    return DEFAULT_BEHAVIORAL_VECTORS.reasoning;
  }

  return `${firstFinding.charAt(0).toUpperCase()}${firstFinding.slice(1)}${rest.length > 0 ? `; ademas, ${rest.join(", ")}` : ""}.`;
}

export function inferBehavioralVectors(input: {
  text: string;
  signalCodes: string[];
  requestedAction: string;
}): BehavioralVectors {
  const lower = input.text.toLowerCase();
  const codes = new Set(input.signalCodes);

  const asymmetricRiskDemand = maxSeverity(
    codes.has("advance_payment_request") || codes.has("payment_before_delivery") || codes.has("unconfirmed_payment_pressure")
      ? "high"
      : "none",
    input.requestedAction === "pay_deposit" || input.requestedAction === "transfer_money" ? "medium" : "none",
    codes.has("transfer_request") || codes.has("deposit_request") ? "medium" : "none",
    hasAny(lower, [
      /te lo mando/i,
      /despues te/i,
      /cuando se acredite/i,
      /pasaje/i,
      /sena/i,
      /reserv/i,
      /liberar (el |un )?(paquete|envio|compra)/i,
      /pagar (un |el )?(monto|importe)/i,
    ])
      ? "medium"
      : "none",
  );

  const artificialTimePressure = maxSeverity(
    codes.has("urgent_transfer") || codes.has("deadline_pressure") ? "high" : "none",
    codes.has("urgency_language") || codes.has("scarcity_pressure") ? "medium" : "none",
    hasAny(lower, [/mucha gente/i, /senalo/i, /te lo reservo/i, /antes que otro/i, /ya mismo/i]) ? "high" : "none",
  );

  const trustManipulationExcuse = maxSeverity(
    codes.has("seller_safety_excuse") || codes.has("bank_delay_excuse") ? "high" : "none",
    codes.has("emotional_pressure") ? "medium" : "none",
    hasAny(lower, [/ya me robaron/i, /por mi seguridad/i, /por tu seguridad/i, /mi hijo llora/i, /el banco demora/i, /es protocolo/i])
      ? "high"
      : "none",
  );

  const standardProcessBypass = maxSeverity(
    codes.has("platform_bypass") ||
      codes.has("off_platform_payment") ||
      codes.has("refuses_in_person_exchange") ||
      codes.has("payment_settlement_bypass")
      ? "high"
      : "none",
    codes.has("channel_shift") || codes.has("in_person_meeting_bait") ? "medium" : "none",
    hasAny(lower, [
      /whatsapp/i,
      /telegram/i,
      /por afuera/i,
      /no te lo puedo mostrar/i,
      /te entrego apenas/i,
      /(entrar|ingresar|abrir|hacer click|clic).{0,40}(link|enlace)/i,
      /(link|enlace).{0,40}(pagar|abonar|liberar|desbloquear|verificar|confirmar)/i,
    ])
      ? "medium"
      : "none",
  );

  const credentialPhishingDisguise = maxSeverity(
    codes.has("asks_for_otp") || codes.has("asks_for_credentials") ? "high" : "none",
    hasAny(lower, [/codigo de 6 digitos/i, /validacion/i, /confirmar compra/i, /clave/i]) ? "medium" : "none",
  );

  const justificationCoherence = evaluateJustificationCoherence({
    requestedAction: input.requestedAction,
    asymmetricRiskDemand,
    standardProcessBypass,
    trustManipulationExcuse,
    credentialPhishingDisguise,
    text: input.text,
  });

  const vectors: BehavioralVectors = {
    asymmetricRiskDemand,
    artificialTimePressure,
    trustManipulationExcuse,
    standardProcessBypass,
    credentialPhishingDisguise,
    justificationCoherence,
    reasoning: "",
  };

  vectors.reasoning = buildReasoning(vectors);
  return vectors;
}

const coherenceOrder: JustificationCoherence[] = ["coherent", "weak", "nonsensical"];

function maxCoherence(left: JustificationCoherence, right: JustificationCoherence): JustificationCoherence {
  return coherenceOrder.indexOf(right) > coherenceOrder.indexOf(left) ? right : left;
}

export function enforceBehavioralVectorFloors(input: {
  detected: BehavioralVectors;
  text: string;
  signalCodes: string[];
  requestedAction: string;
}): BehavioralVectors {
  const heuristic = inferBehavioralVectors({
    text: input.text,
    signalCodes: input.signalCodes,
    requestedAction: input.requestedAction,
  });

  const merged: BehavioralVectors = {
    asymmetricRiskDemand: maxSeverity(input.detected.asymmetricRiskDemand, heuristic.asymmetricRiskDemand),
    artificialTimePressure: maxSeverity(input.detected.artificialTimePressure, heuristic.artificialTimePressure),
    trustManipulationExcuse: maxSeverity(input.detected.trustManipulationExcuse, heuristic.trustManipulationExcuse),
    standardProcessBypass: maxSeverity(input.detected.standardProcessBypass, heuristic.standardProcessBypass),
    credentialPhishingDisguise: maxSeverity(
      input.detected.credentialPhishingDisguise,
      heuristic.credentialPhishingDisguise,
    ),
    justificationCoherence: maxCoherence(input.detected.justificationCoherence, heuristic.justificationCoherence),
    reasoning: input.detected.reasoning,
  };

  const extraReasoning =
    heuristic.reasoning !== DEFAULT_BEHAVIORAL_VECTORS.reasoning && heuristic.reasoning !== input.detected.reasoning
      ? ` Validacion deterministica: ${heuristic.reasoning}`
      : "";

  merged.reasoning = `${input.detected.reasoning || heuristic.reasoning}${extraReasoning}`.trim();
  if (!merged.reasoning) {
    merged.reasoning = heuristic.reasoning;
  }

  return merged;
}
