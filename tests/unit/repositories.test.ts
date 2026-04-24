import { describe, expect, it } from "vitest";

/**
 * Unit tests that verify the repository module shapes, mapper correctness,
 * and type contracts — without hitting a real database.
 *
 * Integration tests against the live Supabase instance should be run
 * separately with env vars configured.
 */

import {
  mapCaseRow,
  mapEvidenceRow,
  mapEntityRow,
  mapSignalRow,
  mapExternalCheckRow,
  mapPatternMatchRow,
  mapFeedbackRow,
} from "@/server/db/mappers";
import type {
  DbCaseRow,
  DbEvidenceRow,
  DbEntityRow,
  DbSignalRow,
  DbExternalCheckRow,
  DbPatternMatchRow,
  DbFeedbackRow,
} from "@/server/db/types";

describe("mapCaseRow", () => {
  it("maps snake_case DB row to camelCase domain record", () => {
    const row: DbCaseRow = {
      id: "uuid-1",
      public_id: "abc123xyz456",
      status: "received",
      privacy_mode: "minimal_retention",
      narrative_text: "Me contactaron por WhatsApp",
      merged_case_text: null,
      case_type: null,
      summary: null,
      final_risk_score: null,
      final_risk_level: null,
      confidence: null,
      expires_at: "2026-05-01T00:00:00Z",
      analyzed_at: null,
      created_at: "2026-04-21T00:00:00Z",
      updated_at: "2026-04-21T00:00:00Z",
    };

    const result = mapCaseRow(row);

    expect(result.id).toBe("uuid-1");
    expect(result.publicId).toBe("abc123xyz456");
    expect(result.status).toBe("received");
    expect(result.privacyMode).toBe("minimal_retention");
    expect(result.narrativeText).toBe("Me contactaron por WhatsApp");
    expect(result.mergedCaseText).toBeNull();
    expect(result.caseType).toBeNull();
    expect(result.finalRiskScore).toBeNull();
    expect(result.finalRiskLevel).toBeNull();
    expect(result.confidence).toBeNull();
    expect(result.createdAt).toBe("2026-04-21T00:00:00Z");
  });
});

describe("mapEvidenceRow", () => {
  it("maps evidence row preserving all fields", () => {
    const row: DbEvidenceRow = {
      id: "ev-1",
      case_id: "uuid-1",
      evidence_type: "screenshot",
      raw_text: null,
      storage_path: "cases/uuid-1/evidence/img.png",
      ocr_text: "texto extraído",
      parsed_metadata: null,
      expires_at: "2026-04-24T00:00:00Z",
      created_at: "2026-04-21T00:00:00Z",
    };

    const result = mapEvidenceRow(row);

    expect(result.id).toBe("ev-1");
    expect(result.caseId).toBe("uuid-1");
    expect(result.evidenceType).toBe("screenshot");
    expect(result.storagePath).toBe("cases/uuid-1/evidence/img.png");
    expect(result.ocrText).toBe("texto extraído");
    expect(result.expiresAt).toBe("2026-04-24T00:00:00Z");
  });
});

describe("mapEntityRow", () => {
  it("maps entity row with correct type narrowing", () => {
    const row: DbEntityRow = {
      id: "ent-1",
      case_id: "uuid-1",
      entity_type: "phone",
      value: "+5411-1234-5678",
      normalized_value: "+541112345678",
      confidence: 0.95,
      source: "regex",
      created_at: "2026-04-21T00:00:00Z",
    };

    const result = mapEntityRow(row);

    expect(result.entityType).toBe("phone");
    expect(result.normalizedValue).toBe("+541112345678");
    expect(result.confidence).toBe(0.95);
    expect(result.source).toBe("regex");
  });
});

describe("mapSignalRow", () => {
  it("maps signal row with sources array", () => {
    const row: DbSignalRow = {
      id: "sig-1",
      case_id: "uuid-1",
      signal_code: "asks_for_otp",
      confidence: 0.92,
      weight: 22,
      sources: ["regex", "llm"],
      evidence_ref_id: null,
      created_at: "2026-04-21T00:00:00Z",
    };

    const result = mapSignalRow(row);

    expect(result.signalCode).toBe("asks_for_otp");
    expect(result.weight).toBe(22);
    expect(result.sources).toEqual(["regex", "llm"]);
  });
});

describe("mapExternalCheckRow", () => {
  it("maps external check row", () => {
    const row: DbExternalCheckRow = {
      id: "chk-1",
      case_id: "uuid-1",
      check_type: "domain",
      status: "success",
      result_summary: "Dominio creado hace 2 días",
      result_json: { age_days: 2 },
      signal_impact: { domain_recently_created: true },
      created_at: "2026-04-21T00:00:00Z",
    };

    const result = mapExternalCheckRow(row);

    expect(result.checkType).toBe("domain");
    expect(result.status).toBe("success");
    expect(result.resultSummary).toBe("Dominio creado hace 2 días");
  });
});

describe("mapPatternMatchRow", () => {
  it("maps pattern match row", () => {
    const row: DbPatternMatchRow = {
      id: "pm-1",
      case_id: "uuid-1",
      pattern_id: "pat-1",
      pattern_version_id: "pv-1",
      match_score: 0.85,
      matched_signals: ["bank_impersonation", "asks_for_otp"],
      created_at: "2026-04-21T00:00:00Z",
    };

    const result = mapPatternMatchRow(row);

    expect(result.matchScore).toBe(0.85);
    expect(result.matchedSignals).toEqual(["bank_impersonation", "asks_for_otp"]);
    expect(result.patternId).toBe("pat-1");
  });
});

describe("mapFeedbackRow", () => {
  it("maps feedback row", () => {
    const row: DbFeedbackRow = {
      id: "fb-1",
      case_id: "uuid-1",
      helpful: true,
      false_alarm: false,
      comment: "Me ayudó mucho",
      created_at: "2026-04-21T00:00:00Z",
    };

    const result = mapFeedbackRow(row);

    expect(result.helpful).toBe(true);
    expect(result.falseAlarm).toBe(false);
    expect(result.comment).toBe("Me ayudó mucho");
  });
});
