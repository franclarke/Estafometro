import { getServerEnv } from "@/lib/config/env";
import { AppError } from "@/lib/errors";
import { createServerSupabaseClient } from "@/server/db/client";

export async function createSignedEvidenceUpload(path: string) {
  const supabase = createServerSupabaseClient();
  const { EVIDENCE_BUCKET } = getServerEnv();

  const { data, error } = await supabase.storage.from(EVIDENCE_BUCKET).createSignedUploadUrl(path);
  if (error) {
    throw new AppError("No se pudo generar la URL de subida.", {
      code: "STORAGE_UPLOAD_URL_ERROR",
      details: error,
    });
  }

  return data;
}

export async function createSignedEvidenceDownload(path: string) {
  const supabase = createServerSupabaseClient();
  const { EVIDENCE_BUCKET, SIGNED_URL_TTL_SECONDS } = getServerEnv();

  const { data, error } = await supabase.storage.from(EVIDENCE_BUCKET).createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) {
    throw new AppError("No se pudo generar la URL de lectura.", {
      code: "STORAGE_DOWNLOAD_URL_ERROR",
      details: error,
    });
  }

  return data.signedUrl;
}

export async function downloadEvidenceBuffer(path: string) {
  const supabase = createServerSupabaseClient();
  const { EVIDENCE_BUCKET } = getServerEnv();

  const { data, error } = await supabase.storage.from(EVIDENCE_BUCKET).download(path);
  if (error) {
    throw new AppError("No se pudo descargar la evidencia.", {
      code: "STORAGE_DOWNLOAD_ERROR",
      details: error,
    });
  }

  return Buffer.from(await data.arrayBuffer());
}
