import { NextRequest } from "next/server";

import { apiError, apiOk } from "@/lib/validation/api";
import { createCaseSchema } from "@/lib/validation/case";
import { createCaseRecord } from "@/server/cases/repository";
import { trackEvent } from "@/server/analytics/track-event";
import { analyticsEvents } from "@/server/analytics/events";
import { getServerEnv } from "@/lib/config/env";
import { enforceRateLimit } from "@/server/rate-limit/postgres-rate-limit";
import { getIpHash, getUserAgentHash } from "@/server/request-context";

export async function POST(request: NextRequest) {
  try {
    const payload = createCaseSchema.parse(await request.json());
    const ipHash = getIpHash(request);

    await enforceRateLimit({
      ipHash,
      bucketKey: "create-case",
      maxHits: getServerEnv().RATE_LIMIT_CASES_PER_HOUR,
    });

    const caseRecord = await createCaseRecord({
      narrativeText: payload.narrative_text?.trim() || null,
      privacyMode: payload.privacy_mode ?? "minimal_retention",
      ipHash,
      userAgentHash: getUserAgentHash(request),
    });

    await trackEvent({
      eventType: analyticsEvents.caseStarted,
      caseId: caseRecord.id,
      ipHash,
      properties: {
        privacyMode: caseRecord.privacyMode,
      },
    });

    return apiOk(
      {
        caseId: caseRecord.id,
        publicId: caseRecord.publicId,
        status: caseRecord.status,
      },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
