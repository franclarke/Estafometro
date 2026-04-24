import type { NormalizedSignal } from "@/types/analysis";
import type { SignalGroup, SignalSeverity } from "@/types/domain";

export interface SignalDefinition {
  code: string;
  groupName: SignalGroup;
  description: string;
  userLabel: string;
  defaultWeight: number;
  severity: SignalSeverity;
  isActive: boolean;
}

export const signalCatalog: SignalDefinition[] = [
  {
    code: "behavior_asymmetric_risk_medium",
    groupName: "behavioral",
    description: "La operación pone sobre la víctima la mayor parte del riesgo financiero antes de darle una garantía real.",
    userLabel: "La otra parte quiere que asumas el riesgo primero",
    defaultWeight: 20,
    severity: "high",
    isActive: true,
  },
  {
    code: "behavior_asymmetric_risk_high",
    groupName: "behavioral",
    description: "La víctima debe pagar o entregar primero y recién después recibiría la contraprestación prometida.",
    userLabel: "Te piden asumir todo el riesgo antes de ver resultados",
    defaultWeight: 32,
    severity: "critical",
    isActive: true,
  },
  {
    code: "behavior_artificial_time_pressure_medium",
    groupName: "behavioral",
    description: "La contraparte mete urgencia o escasez para limitar la verificación.",
    userLabel: "Apuro artificial",
    defaultWeight: 12,
    severity: "medium",
    isActive: true,
  },
  {
    code: "behavior_artificial_time_pressure_high",
    groupName: "behavioral",
    description: "La contraparte usa ultimátum, FOMO o ventana de decisión irreal para forzar la acción.",
    userLabel: "Ultimátum o escasez artificial",
    defaultWeight: 18,
    severity: "high",
    isActive: true,
  },
  {
    code: "behavior_trust_manipulation_medium",
    groupName: "behavioral",
    description: "La contraparte usa una excusa emocional o de confianza para justificar una excepción.",
    userLabel: "Excusa manipulativa",
    defaultWeight: 10,
    severity: "medium",
    isActive: true,
  },
  {
    code: "behavior_trust_manipulation_high",
    groupName: "behavioral",
    description: "La contraparte se victimiza o apela a terceros para que aceptes un procedimiento anormal.",
    userLabel: "Manipulación emocional o excusa de seguridad",
    defaultWeight: 16,
    severity: "high",
    isActive: true,
  },
  {
    code: "behavior_standard_process_bypass_medium",
    groupName: "behavioral",
    description: "La contraparte sugiere apartarse del canal o la secuencia normal de seguridad.",
    userLabel: "Intento de saltar el proceso normal",
    defaultWeight: 18,
    severity: "high",
    isActive: true,
  },
  {
    code: "behavior_standard_process_bypass_high",
    groupName: "behavioral",
    description: "La contraparte rechaza directamente los mecanismos naturales de protección o verificación.",
    userLabel: "Bypass explícito de los mecanismos de seguridad",
    defaultWeight: 26,
    severity: "critical",
    isActive: true,
  },
  {
    code: "behavior_credential_phishing_disguise_medium",
    groupName: "behavioral",
    description: "Se insinúa un pedido de datos sensibles disfrazado como validación administrativa.",
    userLabel: "Pedido disfrazado de datos sensibles",
    defaultWeight: 28,
    severity: "critical",
    isActive: true,
  },
  {
    code: "behavior_credential_phishing_disguise_high",
    groupName: "behavioral",
    description: "Se pide directamente OTP, clave o credencial bajo un pretexto administrativo o de seguridad.",
    userLabel: "Phishing de credenciales disfrazado de trámite",
    defaultWeight: 40,
    severity: "critical",
    isActive: true,
  },
  {
    code: "behavior_justification_weak",
    groupName: "logic",
    description: "La explicación dada por la contraparte suena forzada para una operación normal.",
    userLabel: "Justificación débil",
    defaultWeight: 8,
    severity: "medium",
    isActive: true,
  },
  {
    code: "behavior_justification_nonsensical",
    groupName: "logic",
    description: "La justificación sólo cierra si se acepta un flujo objetivamente anómalo o riesgoso.",
    userLabel: "Justificación sin sentido transaccional",
    defaultWeight: 18,
    severity: "high",
    isActive: true,
  },
  {
    code: "behavior_combo_asymmetric_risk_time_pressure",
    groupName: "behavioral",
    description: "Combinación de asimetría de riesgo con apuro artificial: patrón típico de decisión forzada.",
    userLabel: "Quieren que arriesgues ya",
    defaultWeight: 30,
    severity: "critical",
    isActive: true,
  },
  {
    code: "behavior_combo_asymmetric_risk_process_bypass",
    groupName: "behavioral",
    description: "La contraparte te traslada el riesgo y además evita el proceso que lo mitigaría.",
    userLabel: "Te cargan el riesgo y bloquean la verificación",
    defaultWeight: 34,
    severity: "critical",
    isActive: true,
  },
  {
    code: "behavior_combo_trust_excuse_process_bypass",
    groupName: "behavioral",
    description: "Una excusa emocional o de seguridad se usa para justificar la ruptura del proceso normal.",
    userLabel: "Excusa para que aceptes un atajo inseguro",
    defaultWeight: 22,
    severity: "high",
    isActive: true,
  },
  {
    code: "behavior_combo_disguised_credential_theft",
    groupName: "behavioral",
    description: "Pedido de credenciales enmascarado como validación legítima.",
    userLabel: "Robo de credenciales disfrazado",
    defaultWeight: 32,
    severity: "critical",
    isActive: true,
  },
  {
    code: "behavior_combo_nonsensical_transaction_justification",
    groupName: "logic",
    description: "La operación exige aceptar una lógica transaccional que no sería razonable en un intercambio honesto.",
    userLabel: "La lógica de la operación no cierra",
    defaultWeight: 18,
    severity: "high",
    isActive: true,
  },
  { code: "emotional_pressure", groupName: "interaction", description: "Apela a emociones para condicionar la decisión.", userLabel: "Presión emocional", defaultWeight: 4, severity: "medium", isActive: true },
  { code: "urgency_language", groupName: "urgency", description: "Usa lenguaje de urgencia o inmediatez.", userLabel: "Lenguaje urgente", defaultWeight: 4, severity: "medium", isActive: true },
  { code: "secrecy_request", groupName: "interaction", description: "Pide mantener el asunto en secreto.", userLabel: "Pedido de secreto", defaultWeight: 10, severity: "high", isActive: true },
  { code: "identity_change", groupName: "interaction", description: "Dice que cambió de número o identidad de contacto.", userLabel: "Cambio repentino de identidad", defaultWeight: 8, severity: "high", isActive: true },
  { code: "new_number_claim", groupName: "interaction", description: "Afirma que está escribiendo desde un número nuevo.", userLabel: "Número nuevo inesperado", defaultWeight: 8, severity: "high", isActive: true },
  { code: "urgent_transfer", groupName: "urgency", description: "Pide una transferencia urgente.", userLabel: "Transferencia urgente", defaultWeight: 8, severity: "high", isActive: true },
  { code: "deadline_pressure", groupName: "urgency", description: "Impone un plazo corto para actuar.", userLabel: "Presión por plazo", defaultWeight: 6, severity: "medium", isActive: true },
  { code: "scarcity_pressure", groupName: "urgency", description: "Invoca escasez o competencia para forzar una seña o decisión inmediata.", userLabel: "FOMO o falsa escasez", defaultWeight: 8, severity: "high", isActive: true },
  { code: "transfer_request", groupName: "payment", description: "Solicita transferencia de dinero.", userLabel: "Pedido de transferencia", defaultWeight: 8, severity: "medium", isActive: true },
  { code: "deposit_request", groupName: "payment", description: "Solicita seña o depósito.", userLabel: "Pedido de seña", defaultWeight: 6, severity: "medium", isActive: true },
  { code: "off_platform_payment", groupName: "payment", description: "Pide pagar por fuera de la plataforma original.", userLabel: "Pago fuera de plataforma", defaultWeight: 10, severity: "high", isActive: true },
  { code: "asks_for_credentials", groupName: "payment", description: "Pide claves o credenciales sensibles.", userLabel: "Pedido de credenciales", defaultWeight: 14, severity: "critical", isActive: true },
  { code: "asks_for_otp", groupName: "payment", description: "Pide un código de verificación u OTP.", userLabel: "Pedido de código de verificación", defaultWeight: 14, severity: "critical", isActive: true },
  { code: "cbu_shared", groupName: "payment", description: "Comparte un CBU explícito.", userLabel: "CBU compartido", defaultWeight: 3, severity: "medium", isActive: true },
  { code: "alias_shared", groupName: "payment", description: "Comparte un alias para cobrar.", userLabel: "Alias compartido", defaultWeight: 2, severity: "low", isActive: true },
  { code: "advance_payment_request", groupName: "payment", description: "Pide que pagues antes de recibir o ver el bien.", userLabel: "Pago adelantado pedido", defaultWeight: 8, severity: "high", isActive: true },
  { code: "payment_before_delivery", groupName: "payment", description: "La secuencia exige pagar primero y después entregar o mostrar.", userLabel: "Pago antes de la entrega", defaultWeight: 8, severity: "high", isActive: true },
  { code: "refuses_in_person_exchange", groupName: "platform", description: "Se niega a concretar un intercambio presencial o verificable antes del pago.", userLabel: "Se niega a una verificación básica", defaultWeight: 8, severity: "high", isActive: true },
  { code: "seller_safety_excuse", groupName: "interaction", description: "Usa la 'seguridad' propia o ajena para justificar que vos asumas el riesgo primero.", userLabel: "Excusa de seguridad para alterar el trato", defaultWeight: 6, severity: "high", isActive: true },
  { code: "bank_delay_excuse", groupName: "interaction", description: "Usa supuestas demoras bancarias o de terceros para forzar una entrega o liberación anticipada.", userLabel: "Excusa de demora bancaria", defaultWeight: 7, severity: "high", isActive: true },
  { code: "in_person_meeting_bait", groupName: "platform", description: "Promete encuentro físico, pero lo condiciona a un paso inseguro previo.", userLabel: "Encuentro físico condicionado", defaultWeight: 5, severity: "medium", isActive: true },
  { code: "payment_settlement_bypass", groupName: "platform", description: "Pide aceptar un comprobante o promesa de acreditación como reemplazo de la confirmación real.", userLabel: "Quiere saltear la confirmación real del pago", defaultWeight: 10, severity: "high", isActive: true },
  { code: "unconfirmed_payment_pressure", groupName: "payment", description: "Envía comprobante o habla de demoras bancarias para exigir liberar dinero o mercadería antes de acreditar.", userLabel: "Presiona con pago todavía no acreditado", defaultWeight: 10, severity: "high", isActive: true },
  { code: "marketplace_p2p_context", groupName: "platform", description: "La operación ocurre entre desconocidos en una compraventa P2P.", userLabel: "Contexto P2P entre desconocidos", defaultWeight: 2, severity: "low", isActive: true },
  { code: "prompt_injection_attempt", groupName: "interaction", description: "El texto intenta manipular al sistema para sesgar el análisis.", userLabel: "Intento de manipular el sistema", defaultWeight: 18, severity: "critical", isActive: true },
  { code: "authority_impersonation", groupName: "identity", description: "Se presenta como autoridad, policía o justicia.", userLabel: "Supuesta autoridad", defaultWeight: 10, severity: "critical", isActive: true },
  { code: "bank_impersonation", groupName: "identity", description: "Se presenta como banco o entidad financiera.", userLabel: "Supuesto banco", defaultWeight: 10, severity: "critical", isActive: true },
  { code: "delivery_impersonation", groupName: "identity", description: "Se presenta como correo, mensajería o servicio de envíos para justificar un pago, validación o gestión inesperada.", userLabel: "Supuesto correo o mensajería", defaultWeight: 10, severity: "high", isActive: true },
  { code: "visual_brand_impersonation", groupName: "identity", description: "La evidencia visual muestra branding, logos o identidad institucional que parecen apócrifos o inconsistentes.", userLabel: "Branding o logo sospechoso", defaultWeight: 12, severity: "high", isActive: true },
  { code: "support_impersonation", groupName: "identity", description: "Se presenta como soporte o asistencia.", userLabel: "Supuesto soporte", defaultWeight: 8, severity: "high", isActive: true },
  { code: "family_impersonation", groupName: "identity", description: "Se presenta como familiar o conocido cercano.", userLabel: "Supuesto familiar", defaultWeight: 8, severity: "high", isActive: true },
  { code: "inconsistent_identity", groupName: "identity", description: "Los datos de identidad no son consistentes entre sí.", userLabel: "Identidad inconsistente", defaultWeight: 6, severity: "medium", isActive: true },
  { code: "threatens_arrest", groupName: "authority", description: "Amenaza con arresto, allanamiento o consecuencias penales.", userLabel: "Amenaza con arresto o allanamiento", defaultWeight: 12, severity: "critical", isActive: true },
  { code: "threatens_legal_action", groupName: "authority", description: "Amenaza con acciones legales o judiciales.", userLabel: "Amenaza legal", defaultWeight: 8, severity: "high", isActive: true },
  { code: "bribery_request", groupName: "authority", description: "Pide dinero para evitar consecuencias o resolver el caso.", userLabel: "Pedido de pago para resolver", defaultWeight: 12, severity: "critical", isActive: true },
  { code: "platform_bypass", groupName: "platform", description: "Desvía la operación fuera del mecanismo natural o de la plataforma original.", userLabel: "Desvío fuera del proceso normal", defaultWeight: 10, severity: "high", isActive: true },
  { code: "suspicious_link", groupName: "platform", description: "Incluye links dudosos o inconsistentes.", userLabel: "Link sospechoso", defaultWeight: 8, severity: "high", isActive: true },
  { code: "fake_verification_interface", groupName: "platform", description: "La evidencia visual muestra una interfaz o pantalla de verificación dudosa o apócrifa.", userLabel: "Pantalla de verificación sospechosa", defaultWeight: 12, severity: "high", isActive: true },
  { code: "channel_shift", groupName: "platform", description: "Insiste en mover la conversación a otro canal.", userLabel: "Cambio de canal", defaultWeight: 6, severity: "medium", isActive: true },
  { code: "phishing_domain_characteristics", groupName: "external", description: "El dominio comparte características comunes de phishing o suplantación.", userLabel: "Dominio con rasgos de phishing", defaultWeight: 12, severity: "high", isActive: true },
  { code: "brand_domain_mismatch", groupName: "external", description: "El dominio no guarda relación razonable con la marca o entidad que dice representar.", userLabel: "Dominio que no coincide con la marca", defaultWeight: 14, severity: "high", isActive: true },
  { code: "punycode_domain", groupName: "external", description: "El dominio usa punycode o caracteres visualmente engañosos.", userLabel: "Dominio visualmente engañoso", defaultWeight: 16, severity: "critical", isActive: true },
  { code: "external_presence_inconsistent", groupName: "external", description: "La presencia pública encontrada no coincide con lo declarado.", userLabel: "Presencia externa inconsistente", defaultWeight: 10, severity: "medium", isActive: true },
  { code: "domain_recently_created", groupName: "external", description: "El dominio parece nuevo o poco confiable.", userLabel: "Dominio con señales débiles", defaultWeight: 10, severity: "high", isActive: true },
  { code: "website_unreachable", groupName: "external", description: "El sitio no responde o falla al abrir.", userLabel: "Sitio no disponible", defaultWeight: 4, severity: "low", isActive: true },
  { code: "phone_possible_voip", groupName: "external", description: "El teléfono parece no geográfico, reenrutable o poco consistente con un contacto institucional normal.", userLabel: "Teléfono con rasgos de línea virtual", defaultWeight: 8, severity: "medium", isActive: true },
  { code: "phone_prefix_mismatch", groupName: "external", description: "El prefijo del teléfono no coincide con la localización esperable para la entidad que dice representar.", userLabel: "Prefijo telefónico inconsistente", defaultWeight: 10, severity: "high", isActive: true },
  { code: "suspicious_phone_pattern", groupName: "external", description: "El número muestra un patrón poco normal para un contacto operativo legítimo.", userLabel: "Número telefónico sospechoso", defaultWeight: 8, severity: "medium", isActive: true },
  { code: "unsolicited_contact", groupName: "trust_reducer", description: "El contacto llega sin contexto previo.", userLabel: "Contacto no solicitado", defaultWeight: 4, severity: "medium", isActive: true },
  { code: "price_too_good", groupName: "trust_reducer", description: "La oferta parece demasiado conveniente.", userLabel: "Oferta demasiado conveniente", defaultWeight: 4, severity: "medium", isActive: true },
  { code: "verified_identity_signal", groupName: "trust_builder", description: "Hay una señal parcial de identidad verificada.", userLabel: "Señal parcial de identidad verificada", defaultWeight: -8, severity: "info", isActive: true },
  { code: "payment_on_delivery_available", groupName: "trust_builder", description: "Existe una modalidad de pago menos riesgosa y controlada.", userLabel: "Pago contra entrega disponible", defaultWeight: -6, severity: "info", isActive: true },
  { code: "official_platform_interaction", groupName: "trust_builder", description: "La interacción sigue un canal oficial de la plataforma.", userLabel: "Interacción en canal oficial", defaultWeight: -8, severity: "info", isActive: true },
];

const catalogMap = new Map(signalCatalog.map((signal) => [signal.code, signal]));

export function getSignalDefinition(code: string) {
  return catalogMap.get(code);
}

export function createNormalizedSignal(input: {
  code: string;
  confidence: number;
  sources: string[];
}): NormalizedSignal | null {
  const definition = getSignalDefinition(input.code);
  if (!definition || !definition.isActive) {
    return null;
  }

  return {
    code: definition.code,
    description: definition.description,
    userLabel: definition.userLabel,
    severity: definition.severity,
    groupName: definition.groupName,
    weight: definition.defaultWeight,
    confidence: input.confidence,
    sources: input.sources,
  };
}
