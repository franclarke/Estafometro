import { NextRequest } from "next/server";
import { z } from "zod";

import { apiError, apiOk } from "@/lib/validation/api";
import { analyticsEvents } from "@/server/analytics/events";
import { trackEvent } from "@/server/analytics/track-event";
import { dismissCandidatePattern } from "@/server/candidate-patterns/repository";
import { assertInternalSecret } from "@/server/request-context";

const payloadSchema = z.object({
  candidatePatternId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    assertInternalSecret(request);
    const payload = payloadSchema.parse(await request.json());
    const candidatePatternId = await dismissCandidatePattern(payload.candidatePatternId);

    await trackEvent({
      eventType: analyticsEvents.candidatePatternDismissed,
      properties: { candidatePatternId },
    });

    return apiOk({ candidatePatternId });
  } catch (error) {
    return apiError(error);
  }
}
