import { NextRequest } from "next/server";

import { apiError, apiOk } from "@/lib/validation/api";
import { resultEventSchema } from "@/lib/validation/case";
import { analyticsEvents } from "@/server/analytics/events";
import { trackEvent } from "@/server/analytics/track-event";
import { getCaseByPublicId } from "@/server/cases/repository";
import { getIpHash } from "@/server/request-context";

const allowedEvents = {
  result_copied: analyticsEvents.resultCopied,
  result_shared: analyticsEvents.resultShared,
} as const;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ publicId: string }> },
) {
  try {
    const { publicId } = await params;
    const payload = resultEventSchema.parse(await request.json());
    const caseRecord = await getCaseByPublicId(publicId);

    await trackEvent({
      eventType: allowedEvents[payload.eventType],
      caseId: caseRecord.id,
      ipHash: getIpHash(request),
    });

    return apiOk({ tracked: true });
  } catch (error) {
    return apiError(error);
  }
}
