import { z } from "zod";

export const privacyModeSchema = z.enum(["minimal_retention", "no_store_raw"]);

export const createCaseSchema = z
  .object({
    narrative_text: z.string().trim().max(10_000).optional(),
    privacy_mode: privacyModeSchema.optional().default("minimal_retention"),
  });

export const analyzeCaseSchema = z.object({
  force: z.boolean().optional().default(false),
});

export const resultEventSchema = z.object({
  eventType: z.enum(["result_copied", "result_shared"]),
});

export const feedbackOutcomeSchema = z.enum(["paused", "verified", "ignored", "already_paid", "reported", "other"]);
export const feedbackActionTakenSchema = z.enum([
  "did_not_pay",
  "called_official_channel",
  "asked_family",
  "blocked_contact",
  "saved_evidence",
  "other",
]);

export const feedbackSchema = z.object({
  helpful: z.boolean(),
  false_alarm: z.boolean().optional().default(false),
  comment: z.string().trim().max(1_500).optional(),
  outcome: feedbackOutcomeSchema.optional(),
  action_taken: feedbackActionTakenSchema.optional(),
  clarity_score: z.number().int().min(1).max(5).optional(),
  reason_tags: z.array(z.string().trim().min(1).max(40)).max(8).optional().default([]),
});

export const followupAnswerSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().trim().min(1).max(80),
        answer: z.union([z.enum(["yes", "no", "unknown"]), z.string().trim().min(1).max(1_000)]),
      }),
    )
    .min(1)
    .max(3),
});
