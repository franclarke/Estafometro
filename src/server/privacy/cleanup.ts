import { createServerSupabaseClient } from "@/server/db/client";
import { getServerEnv } from "@/lib/config/env";

export async function cleanupExpiredArtifacts() {
  const supabase = createServerSupabaseClient();
  const { EVIDENCE_BUCKET } = getServerEnv();

  const now = new Date().toISOString();
  const { data: expiredEvidence } = await supabase
    .from("case_evidence")
    .select("id, storage_path")
    .lt("expires_at", now)
    .not("storage_path", "is", null);

  const paths = (expiredEvidence ?? [])
    .map((item) => item.storage_path as string | null)
    .filter((item): item is string => Boolean(item));

  if (paths.length) {
    await supabase.storage.from(EVIDENCE_BUCKET).remove(paths);
  }

  await supabase.from("case_evidence").delete().lt("expires_at", now);
  await supabase.from("cases").update({ status: "expired" }).lt("expires_at", now);
}
