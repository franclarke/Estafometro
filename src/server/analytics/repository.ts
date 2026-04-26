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

export async function getV2AnalyticsSummary() {
  const supabase = createServerSupabaseClient();
  const [funnel, feedback, risk] = await Promise.all([
    supabase.from("funnel_daily").select("*").limit(14),
    supabase.from("feedback_quality").select("*").limit(30),
    supabase.from("risk_distribution").select("*"),
  ]);

  if (funnel.error) {
    throw funnel.error;
  }
  if (feedback.error) {
    throw feedback.error;
  }
  if (risk.error) {
    throw risk.error;
  }

  return {
    funnelDaily: funnel.data ?? [],
    feedbackQuality: feedback.data ?? [],
    riskDistribution: risk.data ?? [],
  };
}
