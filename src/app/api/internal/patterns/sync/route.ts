import { NextRequest } from "next/server";

import { apiError, apiOk } from "@/lib/validation/api";
import { assertInternalSecret } from "@/server/request-context";
import { syncPatternsToDatabase } from "@/server/patterns/sync-to-db";

export async function POST(request: NextRequest) {
  try {
    assertInternalSecret(request);
    const result = await syncPatternsToDatabase();
    return apiOk(result);
  } catch (error) {
    return apiError(error);
  }
}
