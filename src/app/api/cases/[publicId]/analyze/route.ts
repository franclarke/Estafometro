import { NextRequest } from "next/server";

import { apiError, apiOk } from "@/lib/validation/api";
import { analyzeCaseSchema } from "@/lib/validation/case";
import { getServerEnv } from "@/lib/config/env";
import { getCaseByPublicId } from "@/server/cases/repository";
import { runCaseAnalysis } from "@/server/pipeline/run-analysis";
import { getLatestAnalysisRun } from "@/server/analysis-runs/repository";
import { enforceRateLimit } from "@/server/rate-limit/postgres-rate-limit";
import { getIpHash } from "@/server/request-context";

export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ publicId: string }> },
) {
  try {
    const { publicId } = await params;
    const payload = analyzeCaseSchema.parse((await request.json().catch(() => ({}))) as unknown);

    await enforceRateLimit({
      ipHash: getIpHash(request),
      bucketKey: "analyze-case",
      maxHits: getServerEnv().RATE_LIMIT_ANALYZE_PER_HOUR,
    });

    const result = await runCaseAnalysis(publicId, { force: payload.force });
    const caseRecord = await getCaseByPublicId(publicId);
    const latestRun = await getLatestAnalysisRun(caseRecord.id);

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
