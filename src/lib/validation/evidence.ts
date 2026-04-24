import { z } from "zod";

export const evidenceTypeSchema = z.enum([
  "narrative",
  "pasted_chat",
  "screenshot",
  "url",
  "username",
  "alias",
  "phone",
  "note",
]);

const screenshotEvidenceSchema = z.object({
  type: z.literal("screenshot"),
  fileName: z.string().min(1).max(255),
  contentType: z.enum(["image/png", "image/jpeg", "image/webp"]),
  fileSize: z.number().int().positive().max(10 * 1024 * 1024),
});

const screenshotAttachEvidenceSchema = screenshotEvidenceSchema.extend({
  storagePath: z.string().trim().min(1).max(512),
});

const textEvidenceSchema = z.object({
  type: z.enum(["pasted_chat", "url", "username", "alias", "phone", "note"]),
  value: z.string().trim().min(1).max(10_000),
});

export const evidenceRequestSchema = z.union([
  screenshotAttachEvidenceSchema,
  screenshotEvidenceSchema,
  textEvidenceSchema,
]);
