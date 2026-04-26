import type {
  CaseStatus,
  CheckType,
  EntityType,
  EvidenceType,
  RiskLevel,
  SignalSeverity,
} from "@/types/domain";

export type BehavioralSeverity = "none" | "low" | "medium" | "high";
export type JustificationCoherence = "coherent" | "weak" | "nonsensical";

export interface BehavioralVectors {
  asymmetricRiskDemand: BehavioralSeverity;
  artificialTimePressure: BehavioralSeverity;
  trustManipulationExcuse: BehavioralSeverity;
  standardProcessBypass: BehavioralSeverity;
  credentialPhishingDisguise: BehavioralSeverity;
  justificationCoherence: JustificationCoherence;
  reasoning: string;
}

export interface ExtractedEntity {
  type: EntityType;
  value: string;
  confidence: number;
}

export interface ExtractedSignal {
  code: string;
  confidence: number;
}

export interface ExtractionResult {
  caseType: string;
  summary: string;
  requestedAction: string;
  narrativeTheme: string;
  actor: string;
  threat: string;
  paymentReason: string;
  urgency: string;
  entities: ExtractedEntity[];
  signals: ExtractedSignal[];
  uncertainties: string[];
  probablePattern: string | null;
  suggestedFollowupQuestion: string | null;
  behavioralVectors: BehavioralVectors;
}

export interface PreprocessedEvidence {
  evidenceType: EvidenceType;
  sourceId: string;
  rawText: string | null;
  normalizedText: string | null;
  storagePath: string | null;
  parsedMetadata: Record<string, unknown> | null;
  contentType?: string | null;
  binaryContent?: Buffer | null;
}

export interface PreprocessingOutput {
  mergedCaseText: string;
  parsedEntities: ExtractedEntity[];
  preprocessedEvidence: PreprocessedEvidence[];
}

export interface NormalizedSignal {
  code: string;
  description: string;
  userLabel: string;
  severity: SignalSeverity;
  groupName: string;
  weight: number;
  confidence: number;
  sources: string[];
}

export interface Subscores {
  interactionScore: number;
  paymentScore: number;
  identityScore: number;
  platformScore: number;
  externalValidationScore: number;
  behavioralScore: number;
  logicScore: number;
}

export interface RiskDecision {
  score: number;
  level: RiskLevel;
  confidence: number;
  hardRulesApplied: string[];
}

export type RiskFactorCode =
  | "money_request"
  | "credential_request"
  | "identity_impersonation"
  | "authority_threat"
  | "process_bypass"
  | "time_pressure"
  | "suspicious_link"
  | "asymmetric_risk"
  | "positive_verification"
  | "safe_payment_flow";

export interface RiskFactor {
  code: RiskFactorCode;
  label: string;
  description: string;
  impact: "risk" | "trust";
  severity: "low" | "medium" | "high" | "critical" | "positive";
  signalCodes: string[];
}

export interface RiskTrace {
  signalCodes: string[];
  factors: RiskFactor[];
  hardRulesApplied: string[];
  calibrationRulesApplied: string[];
  mitigationsApplied: string[];
  explanationSummary: string;
}

export interface EnrichmentFinding {
  checkType: CheckType;
  status: "skipped" | "success" | "warning" | "failed";
  summary: string;
  result: Record<string, unknown>;
  derivedSignals: ExtractedSignal[];
}

export interface PatternMatchSummary {
  patternCode: string;
  patternName: string;
  matchScore: number;
  matchedSignals?: string[];
}

export interface ActionPlan {
  primaryAction: string;
  steps: string[];
  avoid: string[];
  verification: string[];
  escalation: string[];
}

export interface FollowupQuestion {
  id: string;
  label: string;
  type: "yes_no" | "short_text";
  reason: string;
}

export interface AnalysisResultPayload {
  publicId: string;
  status: CaseStatus;
  caseType: string | null;
  summary: string;
  risk: {
    level: RiskLevel;
    score: number;
    confidence: number;
    explanationSummary: string;
    topFactors: RiskFactor[];
    confidenceReason: string;
  };
  signals: NormalizedSignal[];
  externalFindings: Array<{
    type: CheckType;
    status: "skipped" | "success" | "warning" | "failed";
    summary: string;
  }>;
  patternMatches: PatternMatchSummary[];
  uncertainties: string[];
  recommendations: string[];
  actionPlan: ActionPlan;
  followupQuestions: FollowupQuestion[];
  limitsNotice: string;
  suggestedFollowupQuestion?: string | null;
  behavioralVectors?: BehavioralVectors;
  analyzedEvidence?: {
    screenshots: number;
    urls: string[];
    phones: string[];
  };
  analyzedAt?: string | null;
}
