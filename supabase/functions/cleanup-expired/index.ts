// deno-lint-ignore-file no-explicit-any
import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

Deno.serve(async () => {
  const now = new Date().toISOString();
  const bucket = Deno.env.get("EVIDENCE_BUCKET") ?? "case-evidence";

  const { data } = await supabase
    .from("case_evidence")
    .select("storage_path")
    .lt("expires_at", now)
    .not("storage_path", "is", null);

  const paths = (data ?? []).map((item: any) => item.storage_path).filter(Boolean);
  if (paths.length) {
    await supabase.storage.from(bucket).remove(paths);
  }

  await supabase.from("case_evidence").delete().lt("expires_at", now);
  await supabase.from("cases").update({ status: "expired" }).lt("expires_at", now);

  return new Response(JSON.stringify({ ok: true, removed: paths.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
