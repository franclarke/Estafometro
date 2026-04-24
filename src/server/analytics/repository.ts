import { createServerSupabaseClient } from "@/server/db/client";
import type { Json } from "@/server/db/generated.types";

export async function trackAnalyticsEvent(input: {
  eventType: string;
  caseId?: string | null;
  properties?: Record<string, unknown>;
  ipHash?: string | null;
}) {
  const supabase = createServerSupabaseClient();

  const { error } = await supabase.from("analytics_events").insert({
    event_type: input.eventType,
    case_id: input.caseId ?? null,
    properties: (input.properties as Json) ?? ({} as Json),
    ip_hash: input.ipHash ?? null,
  });

  if (error) {
    throw error;
  }
}
