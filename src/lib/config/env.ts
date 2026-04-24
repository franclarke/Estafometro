import { z } from "zod";

import { ConfigAppError } from "@/lib/errors";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_PROJECT_ID: z.string().min(1).optional(),
  GEMINI_API_KEY: z.string().optional().default(""),
  GEMINI_MODEL: z.string().min(1).default("gemini-2.5-flash"),
  PATTERNS_SYNC_SECRET: z.string().optional().default(""),
  TURNSTILE_SITE_KEY: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  TURNSTILE_ENABLED: z.coerce.boolean().default(false),
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENABLED: z.coerce.boolean().default(false),
  RATE_LIMIT_CASES_PER_HOUR: z.coerce.number().int().positive().default(10),
  RATE_LIMIT_ANALYZE_PER_HOUR: z.coerce.number().int().positive().default(20),
  EVIDENCE_BUCKET: z.string().min(1).default("case-evidence"),
  SIGNED_URL_TTL_SECONDS: z.coerce.number().int().positive().default(600),
});

export function getPublicEnv() {
  const parsed = publicEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new ConfigAppError("Faltan variables públicas obligatorias.", parsed.error.flatten());
  }

  return parsed.data;
}

export function getServerEnv() {
  const parsed = publicEnvSchema.merge(serverEnvSchema).safeParse(process.env);
  if (!parsed.success) {
    throw new ConfigAppError("Faltan variables de entorno del servidor.", parsed.error.flatten());
  }

  return parsed.data;
}
