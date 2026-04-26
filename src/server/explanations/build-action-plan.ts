import type { ActionPlan, NormalizedSignal } from "@/types/analysis";
import type { RiskLevel } from "@/types/domain";

function uniqueFirst(items: string[], limit?: number) {
  const unique = Array.from(new Set(items.filter(Boolean)));
  return typeof limit === "number" ? unique.slice(0, limit) : unique;
}

function basePrimaryAction(riskLevel: RiskLevel) {
  switch (riskLevel) {
    case "very_high":
      return "Corta la comunicacion, no pagues y no compartas datos ni codigos.";
    case "high":
      return "No avances hasta verificar por un canal oficial o independiente.";
    case "medium":
      return "Pausa la conversacion y verifica antes de pagar, responder o compartir datos.";
    case "low":
      return "Avanza solo si podes verificar identidad, contexto y canal por tu cuenta.";
  }
}

function baseSteps(riskLevel: RiskLevel) {
  switch (riskLevel) {
    case "very_high":
      return [
        "No respondas bajo presion ni sigas instrucciones de esa conversacion.",
        "Usa un canal oficial o una persona de confianza para confirmar la situacion.",
        "Guarda capturas, links, telefonos y alias por si necesitas pedir ayuda.",
      ];
    case "high":
      return [
        "No transfieras, no pagues y no compartas codigos por ahora.",
        "Verifica el pedido por fuera de la conversacion original.",
        "Si la otra parte apura o cambia condiciones, toma eso como una senal de riesgo.",
      ];
    case "medium":
      return [
        "Frena antes de actuar y revisa si el pedido tiene sentido.",
        "Confirma por otro canal con la persona, comercio o entidad real.",
        "Pedi mas contexto antes de compartir dinero, codigos o datos.",
      ];
    case "low":
      return [
        "Verifica que el canal y la identidad coincidan con informacion que ya conoces.",
        "Evita compartir datos sensibles si no hay una razon clara.",
        "Guarda evidencia minima de la conversacion antes de seguir.",
      ];
  }
}

function baseAvoid() {
  return [
    "No compartas claves, codigos de verificacion, token ni fotos de tarjetas.",
    "No transfieras dinero hasta verificar por un canal oficial o independiente.",
  ];
}

function verificationForCase(caseType: string | null) {
  switch (caseType) {
    case "bank_support":
      return [
        "Entra a la app o sitio oficial escribiendo la direccion vos mismo.",
        "Llama al numero que figura en tu tarjeta o en el sitio oficial del banco.",
        "Ningun banco deberia pedirte codigos, claves o tokens por chat.",
      ];
    case "online_purchase":
      return [
        "Mantene pago y mensajes dentro de la plataforma original cuando exista.",
        "Revisa reputacion, antiguedad y condiciones antes de reservar o senar.",
        "Prioriza medios con proteccion al comprador o entrega verificable.",
      ];
    case "family_money":
      return [
        "Llama al numero anterior o a otro familiar antes de transferir.",
        "Hace una pregunta que solo la persona real podria responder.",
        "Desconfia si pide secreto, apuro o transferencia inmediata.",
      ];
    case "authority_extortion":
      return [
        "Corta la llamada o chat y consulta por un canal oficial verificable.",
        "No negocies pagos para evitar supuestas consecuencias legales.",
        "Si hay amenaza real o extorsion, pedi ayuda a una persona de confianza.",
      ];
    default:
      return [
        "Busca un canal independiente para confirmar identidad y motivo.",
        "No uses links ni telefonos enviados en la conversacion sospechosa.",
        "Si falta contexto, pedi una explicacion verificable antes de actuar.",
      ];
  }
}

export function buildActionPlan(input: {
  riskLevel: RiskLevel;
  caseType: string | null;
  signals: Array<Pick<NormalizedSignal, "code" | "severity">>;
}): ActionPlan {
  const codes = new Set(input.signals.map((signal) => signal.code));
  const steps = [...baseSteps(input.riskLevel)];
  const avoid = [...baseAvoid()];
  const verification = [...verificationForCase(input.caseType)];
  const escalation: string[] = [];

  if (codes.has("asks_for_otp") || codes.has("asks_for_credentials")) {
    steps.unshift("No compartas ningun codigo, clave, token o enlace de validacion.");
    avoid.push("No dictes codigos de WhatsApp, banco, mail o billetera aunque digan que es para verificar.");
    verification.unshift("Si ya compartiste un codigo o clave, cambia credenciales y contacta al soporte oficial.");
    escalation.push("Contacta a la entidad real si diste una clave, token o codigo.");
  }

  if (codes.has("threatens_arrest") || codes.has("authority_impersonation")) {
    steps.unshift("No negocies bajo amenaza: corta la comunicacion y busca un canal oficial.");
    avoid.push("No pagues multas, fianzas o arreglos por transferencia desde una conversacion.");
    escalation.push("Si hay amenaza o extorsion, guarda evidencia y pedi ayuda presencial o institucional.");
  }

  if (codes.has("off_platform_payment") || codes.has("platform_bypass")) {
    steps.push("Volve al canal o plataforma original antes de hablar de pagos.");
    avoid.push("No pagues por fuera de la plataforma donde empezo la operacion.");
    verification.unshift("Confirma que el pago, reserva o entrega quede registrado en el canal original.");
  }

  if (
    codes.has("suspicious_link") ||
    codes.has("phishing_domain_characteristics") ||
    codes.has("brand_domain_mismatch") ||
    codes.has("punycode_domain")
  ) {
    steps.push("Ignora links enviados en esa conversacion y busca el sitio oficial por tu cuenta.");
    avoid.push("No abras links ni completes formularios enviados por esa conversacion.");
    verification.unshift("Compara el dominio con el sitio oficial antes de ingresar datos.");
  }

  if (codes.has("transfer_request") || codes.has("advance_payment_request") || codes.has("deposit_request")) {
    steps.push("Antes de pagar, valida identidad, motivo y titularidad del alias o cuenta.");
    avoid.push("No transfieras por apuro, promesa de reserva o amenaza de perder la oportunidad.");
  }

  if (input.riskLevel === "very_high" || input.riskLevel === "high") {
    escalation.push("Consulta con una persona de confianza antes de responder o hacer movimientos de dinero.");
  }

  return {
    primaryAction: basePrimaryAction(input.riskLevel),
    steps: uniqueFirst(steps, 5),
    avoid: uniqueFirst(avoid, 5),
    verification: uniqueFirst(verification, 4),
    escalation: uniqueFirst(escalation, 3),
  };
}
