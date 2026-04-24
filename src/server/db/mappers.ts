import type {
  CaseEntityRecord,
  CaseRecord,
  CaseSignalRecord,
  EvidenceRecord,
  ExternalCheckRecord,
  FeedbackRecord,
  PatternMatchRecord,
} from "@/types/domain";
import type {
  DbCaseRow,
  DbEntityRow,
  DbEvidenceRow,
  DbExternalCheckRow,
  DbFeedbackRow,
  DbPatternMatchRow,
  DbSignalRow,
} from "@/server/db/types";

export function mapCaseRow(row: DbCaseRow): CaseRecord {
  return {
    id: row.id,
    publicId: row.public_id,
    status: row.status as CaseRecord["status"],
    privacyMode: row.privacy_mode as CaseRecord["privacyMode"],
    narrativeText: row.narrative_text,
    mergedCaseText: row.merged_case_text,
    caseType: row.case_type,
    summary: row.summary,
    finalRiskScore: row.final_risk_score,
    finalRiskLevel: row.final_risk_level as CaseRecord["finalRiskLevel"],
    confidence: row.confidence,
    expiresAt: row.expires_at,
    analyzedAt: row.analyzed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapEvidenceRow(row: DbEvidenceRow): EvidenceRecord {
  return {
    id: row.id,
    caseId: row.case_id,
    evidenceType: row.evidence_type as EvidenceRecord["evidenceType"],
    rawText: row.raw_text,
    storagePath: row.storage_path,
    ocrText: row.ocr_text,
    parsedMetadata: (row.parsed_metadata as Record<string, unknown> | null) ?? null,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

export function mapEntityRow(row: DbEntityRow): CaseEntityRecord {
  return {
    id: row.id,
    caseId: row.case_id,
    entityType: row.entity_type as CaseEntityRecord["entityType"],
    value: row.value,
    normalizedValue: row.normalized_value,
    confidence: row.confidence,
    source: row.source as CaseEntityRecord["source"],
    createdAt: row.created_at,
  };
}

export function mapSignalRow(row: DbSignalRow): CaseSignalRecord {
  return {
    id: row.id,
    caseId: row.case_id,
    signalCode: row.signal_code,
    confidence: row.confidence,
    weight: row.weight,
    sources: row.sources as CaseSignalRecord["sources"],
    evidenceRefId: row.evidence_ref_id,
    createdAt: row.created_at,
  };
}

export function mapExternalCheckRow(row: DbExternalCheckRow): ExternalCheckRecord {
  return {
    id: row.id,
    caseId: row.case_id,
    checkType: row.check_type as ExternalCheckRecord["checkType"],
    status: row.status as ExternalCheckRecord["status"],
    resultSummary: row.result_summary,
    resultJson: (row.result_json as Record<string, unknown> | null) ?? null,
    signalImpact: (row.signal_impact as Record<string, unknown> | null) ?? null,
    createdAt: row.created_at,
  };
}

export function mapPatternMatchRow(row: DbPatternMatchRow): PatternMatchRecord {
  return {
    id: row.id,
    caseId: row.case_id,
    patternId: row.pattern_id,
    patternVersionId: row.pattern_version_id,
    matchScore: row.match_score,
    matchedSignals: row.matched_signals,
    createdAt: row.created_at,
  };
}

export function mapFeedbackRow(row: DbFeedbackRow): FeedbackRecord {
  return {
    id: row.id,
    caseId: row.case_id,
    helpful: row.helpful,
    falseAlarm: row.false_alarm,
    comment: row.comment,
    createdAt: row.created_at,
  };
}
