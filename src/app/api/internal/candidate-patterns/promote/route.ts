import { NextRequest } from "next/server";
import { z } from "zod";

import { apiError, apiOk } from "@/lib/validation/api";
import { promoteCandidatePattern } from "@/server/candidate-patterns/promote";
import { assertInternalSecret } from "@/server/request-context";

const payloadSchema = z.object({
  candidatePatternId: z.string().uuid(),
  newPatternCode: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    assertInternalSecret(request);
    const payload = payloadSchema.parse(await request.json());
    const patternId = await promoteCandidatePattern(payload);
    return apiOk({ patternId });
  } catch (error) {
    return apiError(error);
  }
}
