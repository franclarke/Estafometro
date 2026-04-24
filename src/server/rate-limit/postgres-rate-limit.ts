import { createServerSupabaseClient } from "@/server/db/client";
import { AppError } from "@/lib/errors";

function currentWindowStart() {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  return date.toISOString();
}

export async function enforceRateLimit(input: {
  ipHash: string;
  bucketKey: string;
  maxHits: number;
}) {
  const supabase = createServerSupabaseClient();
  const windowStart = currentWindowStart();

  const { data: existing, error: existingError } = await supabase
    .from("rate_limit_hits")
    .select("id, count")
    .eq("ip_hash", input.ipHash)
    .eq("bucket_key", input.bucketKey)
    .eq("window_start", windowStart)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  const nextCount = Number(existing?.count ?? 0) + 1;
  if (nextCount > input.maxHits) {
    throw new AppError("Se alcanzó el límite de uso temporal. Probá de nuevo más tarde.", {
      code: "RATE_LIMITED",
      statusCode: 429,
    });
  }

  const { error } = await supabase.from("rate_limit_hits").upsert(
    {
      ...(existing?.id ? { id: existing.id } : {}),
      ip_hash: input.ipHash,
      bucket_key: input.bucketKey,
      window_start: windowStart,
      count: nextCount,
    },
    { onConflict: "ip_hash,bucket_key,window_start" },
  );

  if (error) {
    throw error;
  }
}
