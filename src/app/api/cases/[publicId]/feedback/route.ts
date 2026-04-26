import { NextRequest } from "next/server";

import { apiError, apiOk } from "@/lib/validation/api";
import { feedbackSchema } from "@/lib/validation/case";
import { getCaseByPublicId } from "@/server/cases/repository";
import { upsertFeedback } from "@/server/feedback/repository";
import { analyticsEvents } from "@/server/analytics/events";
import { trackEvent } from "@/server/analytics/track-event";
import { getIpHash } from "@/server/request-context";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ publicId: string }> },
) {
  try {
    const { publicId } = await params;
    const payload = feedbackSchema.parse(await request.json());
    const caseRecord = await getCaseByPublicId(publicId);
    const feedback = await upsertFeedback({
      caseId: caseRecord.id,
      helpful: payload.helpful,
      falseAlarm: payload.false_alarm,
      comment: payload.comment ?? null,
      outcome: payload.outcome ?? null,
      actionTaken: payload.action_taken ?? null,
      clarityScore: payload.clarity_score ?? null,
      reasonTags: payload.reason_tags,
    });

    await trackEvent({
      eventType: analyticsEvents.feedbackSubmittedV2,
      caseId: caseRecord.id,
      ipHash: getIpHash(request),
      properties: {
        helpful: payload.helpful,
        falseAlarm: payload.false_alarm,
        outcome: payload.outcome ?? null,
        actionTaken: payload.action_taken ?? null,
        clarityScore: payload.clarity_score ?? null,
        reasonTags: payload.reason_tags,
      },
    });

    return apiOk({ feedbackId: feedback.id }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
