import type { ExtractedEntity, ExtractedSignal } from "@/types/analysis";

const patterns: Array<{ code: string; regex: RegExp }> = [
  { code: "asks_for_otp", regex: /\b(codigo|otp|token|verificacion)\b/i },
  {
    code: "transfer_request",
    regex:
      /\b(transferi|transferir|transferime|transferile|transferencia|transfiere|transfieran|transfieras|deposita|depositame|pagame|pagar|pagues|pago|abonar|abones|abona|cobro|importe|monto|pasame (el |la )?(plata|dinero|guita))\b/i,
  },
  { code: "deposit_request", regex: /\b(sena|deposito)\b/i },
  { code: "off_platform_payment", regex: /\bpor fuera de (la )?plataforma|afuera de (mercado|la plataforma)\b/i },
  { code: "platform_bypass", regex: /\bseguime por whatsapp|hablame por whatsapp|por instagram|por privado\b/i },
  { code: "new_number_claim", regex: /\bcambie de numero|este es mi numero nuevo\b/i },
  { code: "identity_change", regex: /\bcambie de numero|me hackearon|perdi el telefono\b/i },
  { code: "urgent_transfer", regex: /\burgente|ya mismo|ahora|en este momento\b/i },
  { code: "urgency_language", regex: /\burgente|apurate|ahora mismo|sin demora\b/i },
  { code: "scarcity_pressure", regex: /\b(mucha gente|varios interesados|te lo reservo|senalo|senalamelo|antes que otro|vuela)\b/i },
  { code: "emotional_pressure", regex: /\bpor favor|estoy desesperado|me ayudas|es de vida o muerte\b/i },
  { code: "secrecy_request", regex: /\bno le digas a nadie|mantenelo en secreto|que nadie se entere\b/i },
  { code: "authority_impersonation", regex: /\bpolicia|fiscalia|juzgado|comisaria|tribunal\b/i },
  { code: "bank_impersonation", regex: /\bbanco|homebanking|cuenta bloqueada|tarjeta\b/i },
  {
    code: "delivery_impersonation",
    regex:
      /\b(correo|correo argentino|andreani|oca|mensajeria|courier|paquete retenido|envio retenido|aduana|sucursal de correo)\b/i,
  },
  { code: "support_impersonation", regex: /\bsoporte|servicio tecnico|asistencia\b/i },
  { code: "family_impersonation", regex: /\bsoy tu hijo|soy tu hija|mama|papa|tia|tio\b/i },
  { code: "bribery_request", regex: /\bcoima|arreglo|resolvemos con una transferencia|pagar para evitar\b/i },
  { code: "threatens_arrest", regex: /\ballanamiento|detencion|arresto|te van a venir a buscar\b/i },
  { code: "threatens_legal_action", regex: /\bdenuncia|causa penal|juicio|consecuencias legales\b/i },
  { code: "asks_for_credentials", regex: /\bclave|contrasena|usuario del banco|token de acceso\b/i },
  { code: "suspicious_link", regex: /\bhttps?:\/\/\S+/i },
  { code: "price_too_good", regex: /\bdemasiado barato|precio regalado|oferta unica|mitad de precio|muy por debajo\b/i },
  { code: "channel_shift", regex: /\bseguime por|hablame por|pasemos a whatsapp|pasemos a telegram\b/i },
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
    code: "suspicious_link",
    regex: /\b(link|enlace|url)\b[\s\S]{0,80}\b(abrir|entrar|ingresar|tocar|hacer click|clic|pagar|abonar|liberar|desbloquear|verificar|confirmar)\b|\b(abrir|entrar|ingresar|tocar|hacer click|clic|pagar|abonar|liberar|desbloquear|verificar|confirmar)\b[\s\S]{0,80}\b(link|enlace|url)\b/i,
  },
  {
    code: "payment_settlement_bypass",
    regex: /\b(paquete|envio|compra)\b[\s\S]{0,80}\b(retenido|retenida|demorado|demorada|bloqueado|bloqueada|liberar)\b[\s\S]{0,120}\b(link|enlace|url)\b/i,
  },
];

const PAYMENT_VERB = "(transfer|deposi|pag|abona|sena)";
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

  if (entities.some((entity) => entity.type === "cbu")) {
    signals.push({ code: "cbu_shared", confidence: 0.9 });
  }

  if (entities.some((entity) => entity.type === "url")) {
    signals.push({ code: "suspicious_link", confidence: 0.8 });
  }

  return signals;
}
