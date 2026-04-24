import { randomUUID } from "node:crypto";

import { NextRequest } from "next/server";

import { ValidationAppError } from "@/lib/errors";
import { apiError, apiOk } from "@/lib/validation/api";
import { evidenceRequestSchema } from "@/lib/validation/evidence";
import { analyticsEvents } from "@/server/analytics/events";
import { trackEvent } from "@/server/analytics/track-event";
import { getCaseByPublicId } from "@/server/cases/repository";
import { createScreenshotEvidence, createTextEvidence } from "@/server/evidence/repository";
import { getIpHash } from "@/server/request-context";
import { createSignedEvidenceUpload } from "@/server/storage/supabase-storage";

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

async function trackEvidenceUploaded(request: NextRequest, caseId: string, type: string) {
  try {
    await trackEvent({
      eventType: analyticsEvents.evidenceUploaded,
      caseId,
      ipHash: getIpHash(request),
      properties: { type },
    });
  } catch {
    // Analytics should not block evidence persistence.
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ publicId: string }> },
) {
  try {
    const { publicId } = await params;
    const payload = evidenceRequestSchema.parse(await request.json());
    const caseRecord = await getCaseByPublicId(publicId);

    if (payload.type === "screenshot") {
      if ("storagePath" in payload) {
        if (!payload.storagePath.startsWith(`${caseRecord.publicId}/`)) {
          throw new ValidationAppError("La ruta de la captura no coincide con el caso.");
        }

        const evidence = await createScreenshotEvidence({
          caseId: caseRecord.id,
          storagePath: payload.storagePath,
          parsedMetadata: {
            fileName: payload.fileName,
            contentType: payload.contentType,
            fileSize: payload.fileSize,
          },
        });

        await trackEvidenceUploaded(request, caseRecord.id, payload.type);

        return apiOk(
          {
            evidenceId: evidence.id,
            type: evidence.evidenceType,
            status: "attached",
          },
          { status: 201 },
        );
      }

      const storagePath = `${caseRecord.publicId}/${randomUUID()}-${sanitizeFileName(payload.fileName)}`;
      const upload = await createSignedEvidenceUpload(storagePath);

      return apiOk(
        {
          type: payload.type,
          status: "prepared",
          storagePath: upload.path,
          signedUploadUrl: upload.signedUrl,
          uploadToken: upload.token,
        },
        { status: 201 },
      );
    }

    const evidence = await createTextEvidence({
      caseId: caseRecord.id,
      evidenceType: payload.type,
      rawText: payload.value,
    });

    await trackEvidenceUploaded(request, caseRecord.id, payload.type);

    return apiOk(
      {
        evidenceId: evidence.id,
        type: evidence.evidenceType,
        status: "attached",
      },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
