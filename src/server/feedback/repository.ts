import { createServerSupabaseClient } from "@/server/db/client";
import { mapFeedbackRow } from "@/server/db/mappers";
import type { DbFeedbackRow } from "@/server/db/types";

export async function upsertFeedback(input: {
  caseId: string;
  helpful: boolean;
  falseAlarm: boolean;
  comment?: string | null;
}) {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("feedback")
    .upsert(
      {
        case_id: input.caseId,
        helpful: input.helpful,
        false_alarm: input.falseAlarm,
        comment: input.comment ?? null,
      },
      {
        onConflict: "case_id",
      },
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapFeedbackRow(data as DbFeedbackRow);
}
