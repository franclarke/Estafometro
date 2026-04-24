import { z } from "zod";

export const caseTypeEnum = [
  "family_money",
  "online_purchase",
  "bank_support",
  "authority_extortion",
  "mixed",
] as const;

export const fingerprintActorEnum = [
  "authority",
  "bank",
  "support",
  "family",
  "seller",
  "unknown",
] as const;

export const fingerprintThreatEnum = [
  "arrest_or_search",
  "account_block",
  "product_loss",
  "family_emergency",
  "identity_uncertain",
  "none",
] as const;

export const fingerprintActionEnum = [
  "transfer_money",
  "share_credentials",
  "share_otp",
  "pay_deposit",
  "follow_link",
  "verify_identity",
  "unknown",
] as const;

export const fingerprintThemeEnum = [
  "marketplace_bypass",
  "bank_support",
  "family_urgency",
  "authority_pressure",
  "generic_scary_message",
  "unknown",
] as const;

export const urgencyEnum = ["low", "medium", "high"] as const;

export const behavioralSeverityEnum = ["none", "low", "medium", "high"] as const;
export type BehavioralSeverity = (typeof behavioralSeverityEnum)[number];

export const justificationCoherenceEnum = ["coherent", "weak", "nonsensical"] as const;
export type JustificationCoherence = (typeof justificationCoherenceEnum)[number];

const nonEmptyStringOr = (fallback: string) =>
  z
    .string()
    .transform((value) => value.trim())
    .transform((value) => (value.length > 0 ? value : fallback));

const behavioralVectorsSchema = z
  .object({
    asymmetric_risk_demand: z.enum(behavioralSeverityEnum).default("none"),
    artificial_time_pressure: z.enum(behavioralSeverityEnum).default("none"),
    trust_manipulation_excuse: z.enum(behavioralSeverityEnum).default("none"),
    standard_process_bypass: z.enum(behavioralSeverityEnum).default("none"),
    credential_phishing_disguise: z.enum(behavioralSeverityEnum).default("none"),
    justification_coherence: z.enum(justificationCoherenceEnum).default("coherent"),
    reasoning: z.string().default(""),
  })
  .default({
    asymmetric_risk_demand: "none",
    artificial_time_pressure: "none",
    trust_manipulation_excuse: "none",
    standard_process_bypass: "none",
    credential_phishing_disguise: "none",
    justification_coherence: "coherent",
    reasoning: "",
  });

export type RawBehavioralVectors = z.infer<typeof behavioralVectorsSchema>;

export const extractionSchema = z.object({
  case_type: z.enum(caseTypeEnum),
  summary: nonEmptyStringOr("No hubo suficiente texto para extraer un resumen más claro."),
  requested_action: z.enum(fingerprintActionEnum),
  narrative_theme: z.enum(fingerprintThemeEnum),
  actor: z.enum(fingerprintActorEnum),
  threat: z.enum(fingerprintThreatEnum),
  payment_reason: nonEmptyStringOr("unknown"),
  urgency: z.enum(urgencyEnum),
  probable_pattern: z.string().nullable().default(null),
  uncertainties: z.array(z.string()).default([]),
  suggested_followup_question: z.string().nullable().default(null),
  entities: z
    .array(
      z.object({
        type: z.string(),
        value: z.string(),
        confidence: z.number().min(0).max(1).default(0.7),
      }),
    )
    .default([]),
  signals: z
    .array(
      z.object({
        code: z.string(),
        confidence: z.number().min(0).max(1).default(0.7),
      }),
    )
    .default([]),
  behavioral_vectors: behavioralVectorsSchema,
});

export type RawExtractionPayload = z.infer<typeof extractionSchema>;

export const extractionJsonSchema = {
  type: "object",
  propertyOrdering: [
    "case_type",
    "summary",
    "requested_action",
    "narrative_theme",
    "actor",
    "threat",
    "payment_reason",
    "urgency",
    "probable_pattern",
    "uncertainties",
    "suggested_followup_question",
    "entities",
    "signals",
    "behavioral_vectors",
  ],
  properties: {
    case_type: { type: "string", enum: [...caseTypeEnum], description: "Tipo de caso más probable." },
    summary: { type: "string", description: "Resumen prudente y corto del caso." },
    requested_action: {
      type: "string",
      enum: [...fingerprintActionEnum],
      description: "Acción principal que le están pidiendo al usuario.",
    },
    narrative_theme: {
      type: "string",
      enum: [...fingerprintThemeEnum],
      description: "Tema narrativo dominante del caso.",
    },
    actor: { type: "string", enum: [...fingerprintActorEnum], description: "Actor declarado o aparente." },
    threat: { type: "string", enum: [...fingerprintThreatEnum], description: "Amenaza principal o presión central." },
    payment_reason: { type: "string", description: "Motivo explícito o implícito del pedido de pago." },
    urgency: { type: "string", enum: [...urgencyEnum], description: "Nivel de urgencia visible." },
    probable_pattern: { type: ["string", "null"], description: "Código tentativo de patrón si aplica." },
    uncertainties: {
      type: "array",
      description: "Aspectos que el sistema no puede confirmar.",
      items: { type: "string" },
    },
    suggested_followup_question: {
      type: ["string", "null"],
      description: "Repregunta opcional que mejoraría el análisis.",
    },
    entities: {
      type: "array",
      items: {
        type: "object",
        propertyOrdering: ["type", "value", "confidence"],
        properties: {
          type: { type: "string" },
          value: { type: "string" },
          confidence: { type: "number", minimum: 0, maximum: 1 },
        },
        required: ["type", "value", "confidence"],
      },
    },
    signals: {
      type: "array",
      items: {
        type: "object",
        propertyOrdering: ["code", "confidence"],
        properties: {
          code: { type: "string" },
          confidence: { type: "number", minimum: 0, maximum: 1 },
        },
        required: ["code", "confidence"],
      },
    },
    behavioral_vectors: {
      type: "object",
      description:
        "Análisis conductual universal del caso. Estos vectores razonan sobre la mecánica subyacente (asimetría de riesgo, presión, manipulación), no sobre palabras clave.",
      propertyOrdering: [
        "asymmetric_risk_demand",
        "artificial_time_pressure",
        "trust_manipulation_excuse",
        "standard_process_bypass",
        "credential_phishing_disguise",
        "justification_coherence",
        "reasoning",
      ],
      properties: {
        asymmetric_risk_demand: {
          type: "string",
          enum: [...behavioralSeverityEnum],
          description:
            "¿Se le exige a la víctima asumir 100% del riesgo financiero antes de recibir cualquier garantía real o bien físico?",
        },
        artificial_time_pressure: {
          type: "string",
          enum: [...behavioralSeverityEnum],
          description:
            "¿Se impone un ultimátum o se genera escasez artificial (FOMO) para forzar una decisión apresurada?",
        },
        trust_manipulation_excuse: {
          type: "string",
          enum: [...behavioralSeverityEnum],
          description:
            "¿La contraparte se victimiza, usa excusas de seguridad propias o invoca terceros para justificar un procedimiento inusual?",
        },
        standard_process_bypass: {
          type: "string",
          enum: [...behavioralSeverityEnum],
          description:
            "¿La contraparte esquiva los mecanismos de seguridad naturales (verse en persona, MercadoPago formal, validar por app, contraentrega)?",
        },
        credential_phishing_disguise: {
          type: "string",
          enum: [...behavioralSeverityEnum],
          description:
            "¿Se pide información confidencial (OTP, SMS, contraseñas, mails) disfrazada de trámite administrativo o validación?",
        },
        justification_coherence: {
          type: "string",
          enum: [...justificationCoherenceEnum],
          description:
            "¿La justificación que da la contraparte tiene sentido lógico en una transacción normal, o es coherente sólo si asumimos intención dolosa?",
        },
        reasoning: {
          type: "string",
          description:
            "Explicación breve (1-2 frases) del análisis conductual. En español neutro, sin afirmar certeza absoluta.",
        },
      },
      required: [
        "asymmetric_risk_demand",
        "artificial_time_pressure",
        "trust_manipulation_excuse",
        "standard_process_bypass",
        "credential_phishing_disguise",
        "justification_coherence",
        "reasoning",
      ],
    },
  },
  required: [
    "case_type",
    "summary",
    "requested_action",
    "narrative_theme",
    "actor",
    "threat",
    "payment_reason",
    "urgency",
    "probable_pattern",
    "uncertainties",
    "suggested_followup_question",
    "entities",
    "signals",
    "behavioral_vectors",
  ],
} as const;
