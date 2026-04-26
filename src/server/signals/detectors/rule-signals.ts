import type { ExtractedEntity, ExtractedSignal } from "@/types/analysis";

const patterns: Array<{ code: string; regex: RegExp }> = [
  { code: "asks_for_otp", regex: /\b(codigo|otp|token|verificacion)\b/i },
  {
    code: "transfer_request",
    regex:
      /\b(transferi|transferir|transferime|transferile|transferencia|transfiere|transfieran|transfieras|deposita|depositame|pagame|pagas|pagar|pagues|pago|abonar|abones|abona|cobro|importe|monto|pasame (el |la )?(plata|dinero|guita))\b/i,
  },
  { code: "deposit_request", regex: /\b(sena|deposito|depositar|depositame|mandame una sena|manda una sena|se[nÃ±]a para guardar|reservalo con sena|reservar con sena)\b/i },
  { code: "off_platform_payment", regex: /\bpor fuera de (la )?plataforma|afuera de (mercado|la plataforma)\b/i },
  { code: "platform_bypass", regex: /\bseguime por whatsapp|hablame por whatsapp|pasar a whatsapp|pasemos a whatsapp|por instagram|por privado\b/i },
  { code: "new_number_claim", regex: /\bcambie de numero|este es mi numero nuevo\b/i },
  { code: "identity_change", regex: /\bcambie de numero|me hackearon|perdi el telefono\b/i },
  { code: "urgent_transfer", regex: /\burgente|ya mismo|ahora|en este momento\b/i },
  { code: "urgency_language", regex: /\burgente|apurate|ahora mismo|sin demora\b/i },
  { code: "scarcity_pressure", regex: /\b(mucha gente|varios interesados|te lo reservo|te lo guardo|lo guardo hasta|senalo|senalamelo|antes que otro|vuela|hay otros interesados)\b/i },
  { code: "emotional_pressure", regex: /\bpor favor|estoy desesperado|me ayudas|es de vida o muerte\b/i },
  { code: "secrecy_request", regex: /\bno le digas a nadie|mantenelo en secreto|que nadie se entere\b/i },
  { code: "authority_impersonation", regex: /\bpolicia|fiscalia|juzgado|comisaria|tribunal\b/i },
  {
    code: "bank_impersonation",
    regex:
      /\b(somos|soy|te escribimos|habla|contactamos|soporte|seguridad)\b[\s\S]{0,40}\b(banco|homebanking|tarjeta)\b|\b(tu )?cuenta\b[\s\S]{0,40}\b(bloqueada|suspendida|desbloquear|validar)\b|\bbanco\b[\s\S]{0,60}\b(codigo|token|clave|otp|validar|desbloquear)\b/i,
  },
  {
    code: "bank_impersonation",
    regex: /\bhomebanking\b[\s\S]{0,80}\b(usuario|clave|contrasena|token|desbloquear|validar)\b/i,
  },
  {
    code: "delivery_impersonation",
    regex:
      /\b(correo|correo argentino|andreani|oca|mensajeria|courier|paquete retenido|envio retenido|aduana|sucursal de correo)\b/i,
  },
  { code: "support_impersonation", regex: /\bsoporte|servicio tecnico|asistencia\b/i },
  { code: "family_impersonation", regex: /\bsoy tu hijo|soy tu hija|mama|papa|tia|tio\b/i },
  { code: "bribery_request", regex: /\bcoima|arreglo|arreglamos|resolvemos con una transferencia|pagar para evitar\b/i },
  { code: "threatens_arrest", regex: /\ballanamiento|detencion|arresto|te van a venir a buscar\b/i },
  { code: "threatens_legal_action", regex: /\bdenuncia|causa penal|juicio|consecuencias legales\b/i },
  { code: "asks_for_credentials", regex: /\bclave|contrasena|usuario del banco|token de acceso\b/i },
  { code: "suspicious_link", regex: /\bhttps?:\/\/\S+/i },
  { code: "price_too_good", regex: /\bdemasiado barato|precio regalado|oferta unica|mitad de precio|muy por debajo\b/i },
  { code: "channel_shift", regex: /\bseguime por|hablame por|pasar a whatsapp|pasemos a whatsapp|pasemos a telegram\b/i },
  {
    code: "marketplace_p2p_context",
    regex: /\b(marketplace|facebook marketplace|mercado libre|olx|milanuncios|segundamano)\b/i,
  },
  {
    code: "seller_safety_excuse",
    regex: /\bpor (mi|su) (seguridad|tranquilidad)|es (por )?mi seguridad|para (mi|su) seguridad\b/i,
  },
  {
    code: "bank_delay_excuse",
    regex: /\b(el banco|la transferencia|el sistema|mercado pago|mp) (esta lento|demora|esta demorado|todavia no impacta|todavia no acredita)\b/i,
  },
  {
    code: "in_person_meeting_bait",
    regex: /\b(lugar de encuentro|punto de encuentro|nos (vemos|juntamos) en|edificio|domicilio|direccion|portal|portero|planta baja|vereda)\b/i,
  },
  {
    code: "payment_settlement_bypass",
    regex: /\b(comprobante|captura de transferencia|te mande el comprobante|ya te transferi)\b[\s\S]{0,80}\b(entrega|manda|despacha|dame|libera|pasamelo)\b/i,
  },
  {
    code: "unconfirmed_payment_pressure",
    regex: /\b(comprobante|transferencia demora|todavia no impacta|despues se acredita)\b[\s\S]{0,120}\b(entrega|manda|despacha|libera|damelo|pasamelo)\b/i,
  },
  {
    code: "unconfirmed_payment_pressure",
    regex: /\b(te mande|envie|adjunto|ahi va)\b[\s\S]{0,40}\b(comprobante|captura)\b[\s\S]{0,160}\b(entrega|entregame|libera|liberalo|despacha|mandame|igual)\b/i,
  },
  {
    code: "payment_on_delivery_available",
    regex: /\b(pago al retirar|pagar al retirar|pago cuando retiro|contra entrega|contrareembolso|nos vemos y pago ahi|pago ahi|pago en persona)\b/i,
  },
  {
    code: "official_platform_interaction",
    regex: /\b(por mercado pago|por mercadopago|checkout oficial|dentro de la plataforma|pago protegido|mercado libre protegido|por la app oficial)\b/i,
  },
  {
    code: "suspicious_link",
    regex: /\b(link|enlace|url)\b[\s\S]{0,80}\b(abrir|entrar|ingresar|tocar|hacer click|clic|pagar|abonar|liberar|desbloquear|verificar|confirmar)\b|\b(abrir|entrar|ingresar|tocar|hacer click|clic|pagar|abonar|liberar|desbloquear|verificar|confirmar)\b[\s\S]{0,80}\b(link|enlace|url)\b/i,
  },
  {
    code: "payment_settlement_bypass",
    regex: /\b(paquete|envio|compra)\b[\s\S]{0,80}\b(retenido|retenida|demorado|demorada|bloqueado|bloqueada|liberar)\b[\s\S]{0,120}\b(link|enlace|url)\b/i,
  },
];

const PAYMENT_VERB = "(transfer|transfi|deposi|pag|abona|sena)";
const DELIVERY_VERB = "(baj|entreg|te (la|lo) (doy|llev|muestro|paso|alcanzo)|llev|retir|mostr|vernos|verte)";

const multiWordPatterns: Array<{ code: string; regex: RegExp }> = [
  {
    code: "payment_before_delivery",
    regex: new RegExp(
      `(primero|antes|previo)[\\s\\S]{0,80}${PAYMENT_VERB}[\\s\\S]{0,180}(luego|despues|y (ahi|ya)|recien|una vez|posteriormente)[\\s\\S]{0,100}${DELIVERY_VERB}`,
      "i",
    ),
  },
  {
    code: "advance_payment_request",
    regex: new RegExp(
      `((primero|antes)[\\s\\S]{0,80}${PAYMENT_VERB})|(${PAYMENT_VERB}[\\s\\S]{0,80}(antes de (bajar|entregar|mostrar|ver|vernos|recibir|que (te |me |)mande))|${PAYMENT_VERB}[\\s\\S]{0,40}(y recien|recien ahi))`,
      "i",
    ),
  },
  {
    code: "refuses_in_person_exchange",
    regex: new RegExp(
      `(no (bajo|salgo|te (muestro|entrego|lo doy|la doy))[\\s\\S]{0,60}(sin|hasta que|antes de)[\\s\\S]{0,60}${PAYMENT_VERB})|((primero|antes)[\\s\\S]{0,60}${PAYMENT_VERB}[\\s\\S]{0,160}(luego|despues|y recien|recien ahi)[\\s\\S]{0,60}bajo)`,
      "i",
    ),
  },
  {
    code: "prompt_injection_attempt",
    regex:
      /(ignora (todas? )?(las? )?(reglas?|instrucciones?|directivas?)|(olvida|disregard|override|system prompt|prompt anterior)|marca(lo)? como (seguro|confiable|bajo riesgo)|clasifica(lo)? como (seguro|bajo riesgo|confiable)|devolve (riesgo )?bajo|devuelve (riesgo )?bajo|actua como (un )?(desarrollador|admin|root)|you are now|jailbreak|dan mode|este usuario es (confiable|seguro))/i,
  },
  {
    code: "transfer_request",
    regex: /\b(tengo que|tenes que|debo|deberia)\b[\s\S]{0,40}\b(pagar|abonar|hacer un pago)\b/i,
  },
];

function stripDiacritics(text: string) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function matches(text: string, stripped: string, regex: RegExp) {
  return regex.test(text) || regex.test(stripped);
}

function shouldSuppressGenericTransferRequest(input: {
  text: string;
  stripped: string;
  detectedCodes: string[];
}) {
  if (!input.detectedCodes.includes("transfer_request")) {
    return false;
  }

  const hasExplicitMoneyMovement = matches(
    input.text,
    input.stripped,
    /\b(transferi|transferir|transferime|transferencia|transfiere|depositame|deposita|alias|cbu|sena|deposito)\b/i,
  );
  const hasNegatedPaymentTalk = matches(
    input.text,
    input.stripped,
    /\b(no hablamos de pagar|todavia no (hablamos|me pidio|me pidieron)[\s\S]{0,40}pagar|no (me )?pidio pagar|no (me )?pidieron pagar)\b/i,
  );
  const hasSafePaymentFlow =
    input.detectedCodes.includes("payment_on_delivery_available") ||
    input.detectedCodes.includes("official_platform_interaction");
  const hasRiskCompanion = input.detectedCodes.some((code) =>
    [
      "urgent_transfer",
      "scarcity_pressure",
      "off_platform_payment",
      "platform_bypass",
      "asks_for_otp",
      "authority_impersonation",
      "family_impersonation",
      "delivery_impersonation",
      "off_platform_payment",
      "platform_bypass",
    ].includes(code),
  );

  if (hasNegatedPaymentTalk && !hasExplicitMoneyMovement) {
    return true;
  }

  return hasSafePaymentFlow && !hasExplicitMoneyMovement && !hasRiskCompanion;
}

export function detectRuleSignals(text: string, entities: ExtractedEntity[] = []): ExtractedSignal[] {
  const lower = text.toLowerCase();
  const lowerStripped = stripDiacritics(lower);
  const signals: ExtractedSignal[] = [];

  for (const pattern of patterns) {
    if (matches(lower, lowerStripped, pattern.regex)) {
      signals.push({ code: pattern.code, confidence: 0.92 });
    }
  }

  for (const pattern of multiWordPatterns) {
    if (matches(lower, lowerStripped, pattern.regex)) {
      signals.push({ code: pattern.code, confidence: 0.9 });
    }
  }

  if (entities.some((entity) => entity.type === "alias")) {
    signals.push({ code: "alias_shared", confidence: 0.88 });
  }

  if (matches(lower, lowerStripped, /\balias\b/i)) {
    signals.push({ code: "alias_shared", confidence: 0.82 });
  }

  if (entities.some((entity) => entity.type === "cbu")) {
    signals.push({ code: "cbu_shared", confidence: 0.9 });
  }

  if (entities.some((entity) => entity.type === "url")) {
    signals.push({ code: "suspicious_link", confidence: 0.8 });
  }

  const detectedCodes = signals.map((signal) => signal.code);
  if (shouldSuppressGenericTransferRequest({ text: lower, stripped: lowerStripped, detectedCodes })) {
    return signals.filter((signal) => signal.code !== "transfer_request");
  }

  return signals;
}
