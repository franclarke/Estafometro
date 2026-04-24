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

export const feedbackSchema = z.object({
  helpful: z.boolean(),
  false_alarm: z.boolean().optional().default(false),
  comment: z.string().trim().max(1_500).optional(),
});
