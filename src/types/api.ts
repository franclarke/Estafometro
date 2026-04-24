import type { AnalysisResultPayload } from "@/types/analysis";
import type { CaseStatus, EvidenceType } from "@/types/domain";

export interface ApiErrorPayload {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface ApiSuccessPayload<T> {
  ok: true;
  data: T;
}

export type ApiResponse<T> = ApiSuccessPayload<T> | ApiErrorPayload;

export interface CreateCaseResponse {
  caseId: string;
  publicId: string;
  status: CaseStatus;
}

export interface CreateEvidenceResponse {
  type: EvidenceType;
  status: "prepared" | "attached";
  evidenceId?: string;
  storagePath?: string;
  signedUploadUrl?: string;
  uploadToken?: string;
}

export interface AnalyzeCaseResponse {
  caseId: string;
  publicId: string;
  status: CaseStatus;
  analysisRunId: string | null;
}

export type GetResultResponse = AnalysisResultPayload;

export interface FeedbackResponse {
  feedbackId: string;
}
