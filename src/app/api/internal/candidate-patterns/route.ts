import { NextRequest } from "next/server";

import { apiError, apiOk } from "@/lib/validation/api";
import { listCandidatePatternSummaries } from "@/server/candidate-patterns/repository";
import { assertInternalSecret } from "@/server/request-context";

export async function GET(request: NextRequest) {
  try {
    assertInternalSecret(request);
    const candidates = await listCandidatePatternSummaries();
    return apiOk({ candidates });
  } catch (error) {
    return apiError(error);
  }
}
