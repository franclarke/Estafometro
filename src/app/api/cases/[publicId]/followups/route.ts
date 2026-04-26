import { NextRequest } from "next/server";

import { apiError, apiOk } from "@/lib/validation/api";
import { followupAnswerSchema } from "@/lib/validation/case";
import { getLatestAnalysisRun } from "@/server/analysis-runs/repository";
import { analyticsEvents } from "@/server/analytics/events";
import { trackEvent } from "@/server/analytics/track-event";
import { getCaseByPublicId } from "@/server/cases/repository";
import { createTextEvidence } from "@/server/evidence/repository";
import { buildFollowupEvidenceNote } from "@/server/followups/answers-to-note";
import { runCaseAnalysis } from "@/server/pipeline/run-analysis";
import { getIpHash } from "@/server/request-context";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ publicId: string }> },
) {
  try {
    const { publicId } = await params;
    const payload = followupAnswerSchema.parse(await request.json());
    const caseRecord = await getCaseByPublicId(publicId);
    const ipHash = getIpHash(request);

    await createTextEvidence({
      caseId: caseRecord.id,
      evidenceType: "note",
      rawText: buildFollowupEvidenceNote(payload.answers),
      parsedMetadata: {
        source: "followup_questions",
        answers: payload.answers,
      },
    });

    await trackEvent({
      eventType: analyticsEvents.followupAnswered,
      caseId: caseRecord.id,
      ipHash,
      properties: {
        answerCount: payload.answers.length,
        questionIds: payload.answers.map((item) => item.questionId),
      },
    });

    const result = await runCaseAnalysis(publicId, { force: true });
    const latestRun = await getLatestAnalysisRun(caseRecord.id);

    await trackEvent({
      eventType: analyticsEvents.reanalysisCompleted,
      caseId: caseRecord.id,
      ipHash,
      properties: {
        status: result.status,
        riskLevel: result.risk.level,
      },
    });

    return apiOk({
      caseId: caseRecord.id,
      publicId,
      status: result.status,
      analysisRunId: (latestRun?.id as string | null) ?? null,
    });
  } catch (error) {
    return apiError(error);
  }
}
