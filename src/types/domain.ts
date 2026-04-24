export type RiskLevel = "low" | "medium" | "high" | "very_high";

export type CaseStatus =
  | "received"
  | "processing"
  | "analyzed"
  | "partial"
  | "error"
  | "expired";

export type PrivacyMode = "minimal_retention" | "no_store_raw";

export type EvidenceType =
  | "narrative"
  | "pasted_chat"
  | "screenshot"
  | "url"
  | "username"
  | "alias"
  | "phone"
  | "note";

export type EntityType =
  | "platform"
  | "business_name"
  | "instagram_handle"
  | "url"
  | "domain"
  | "alias"
  | "cbu"
  | "phone"
  | "authority"
  | "bank"
  | "product"
  | "payment_method"
  | "marketplace";

export type SignalSeverity = "info" | "low" | "medium" | "high" | "critical";

export type SignalGroup =
  | "interaction"
  | "urgency"
  | "payment"
  | "identity"
  | "authority"
  | "platform"
  | "behavioral"
  | "logic"
  | "external"
  | "trust_reducer"
  | "trust_builder";

export type CheckType =
  | "platform_bypass"
  | "domain"
  | "phone"
  | "website_consistency"
  | "public_business_presence"
  | "social_profile";

export type CheckStatus = "skipped" | "success" | "warning" | "failed";

export type SignalSource = "regex" | "llm" | "behavioral" | "enrichment" | "pattern" | "user_input";

export interface CaseRecord {
  id: string;
  publicId: string;
  status: CaseStatus;
  privacyMode: PrivacyMode;
  narrativeText: string | null;
  mergedCaseText: string | null;
  caseType: string | null;
  summary: string | null;
  finalRiskScore: number | null;
  finalRiskLevel: RiskLevel | null;
  confidence: number | null;
  expiresAt: string | null;
  analyzedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceRecord {
  id: string;
  caseId: string;
  evidenceType: EvidenceType;
  rawText: string | null;
  storagePath: string | null;
  ocrText: string | null;
  parsedMetadata: Record<string, unknown> | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface CaseEntityRecord {
  id: string;
  caseId: string;
  entityType: EntityType;
  value: string;
  normalizedValue: string;
  confidence: number;
  source: SignalSource | "parser";
  createdAt: string;
}

export interface CaseSignalRecord {
  id: string;
  caseId: string;
  signalCode: string;
  confidence: number;
  weight: number;
  sources: SignalSource[];
  evidenceRefId: string | null;
  createdAt: string;
}

export interface ExternalCheckRecord {
  id: string;
  caseId: string;
  checkType: CheckType;
  status: CheckStatus;
  resultSummary: string;
  resultJson: Record<string, unknown> | null;
  signalImpact: Record<string, unknown> | null;
  createdAt: string;
}

export interface PatternMatchRecord {
  id: string;
  caseId: string;
  patternId: string;
  patternVersionId: string;
  matchScore: number;
  matchedSignals: string[];
  createdAt: string;
}

export interface FeedbackRecord {
  id: string;
  caseId: string;
  helpful: boolean;
  falseAlarm: boolean;
  comment: string | null;
  createdAt: string;
}
