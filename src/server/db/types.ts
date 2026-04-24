export type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue | undefined }
  | JsonValue[];

export interface DbCaseRow {
  id: string;
  public_id: string;
  status: string;
  privacy_mode: string;
  narrative_text: string | null;
  merged_case_text: string | null;
  case_type: string | null;
  summary: string | null;
  final_risk_score: number | null;
  final_risk_level: string | null;
  confidence: number | null;
  expires_at: string | null;
  analyzed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbEvidenceRow {
  id: string;
  case_id: string;
  evidence_type: string;
  raw_text: string | null;
  storage_path: string | null;
  ocr_text: string | null;
  parsed_metadata: JsonValue | null;
  expires_at: string | null;
  created_at: string;
}

export interface DbEntityRow {
  id: string;
  case_id: string;
  entity_type: string;
  value: string;
  normalized_value: string;
  confidence: number;
  source: string;
  created_at: string;
}

export interface DbSignalRow {
  id: string;
  case_id: string;
  signal_code: string;
  confidence: number;
  weight: number;
  sources: string[];
  evidence_ref_id: string | null;
  created_at: string;
}

export interface DbExternalCheckRow {
  id: string;
  case_id: string;
  check_type: string;
  status: string;
  result_summary: string;
  result_json: JsonValue | null;
  signal_impact: JsonValue | null;
  created_at: string;
}

export interface DbPatternMatchRow {
  id: string;
  case_id: string;
  pattern_id: string;
  pattern_version_id: string;
  match_score: number;
  matched_signals: string[];
  created_at: string;
}

export interface DbFeedbackRow {
  id: string;
  case_id: string;
  helpful: boolean;
  false_alarm: boolean;
  comment: string | null;
  created_at: string;
}
