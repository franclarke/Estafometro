import { NextRequest } from "next/server";

import { apiError, apiOk } from "@/lib/validation/api";
import { getV2AnalyticsSummary } from "@/server/analytics/repository";
import { assertInternalSecret } from "@/server/request-context";

export async function GET(request: NextRequest) {
  try {
    assertInternalSecret(request);
    const summary = await getV2AnalyticsSummary();
    return apiOk(summary);
  } catch (error) {
    return apiError(error);
  }
}
