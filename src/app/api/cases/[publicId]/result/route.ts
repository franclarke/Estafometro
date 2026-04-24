import { apiError, apiOk } from "@/lib/validation/api";
import { getCaseResult } from "@/server/cases/result";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ publicId: string }> },
) {
  try {
    const { publicId } = await params;
    const result = await getCaseResult(publicId);
    return apiOk(result);
  } catch (error) {
    return apiError(error);
  }
}
