import { z } from "zod";

export const patternSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  summary: z.string().min(1),
  core_signals: z.array(z.string()).min(1),
  high_weight_signals: z.array(z.string()).default([]),
  hard_rules: z
    .array(
      z.object({
        when: z.array(z.string()).min(1),
        floor: z.enum(["low", "medium", "high", "very_high"]),
      }),
    )
    .default([]),
  counter_signals: z.array(z.string()).default([]),
  variant_examples: z.array(z.string()).default([]),
  recommended_actions: z.array(z.string()).min(1),
  minimum_risk_level: z.enum(["low", "medium", "high", "very_high"]),
});

export type RawPatternSchema = z.infer<typeof patternSchema>;
