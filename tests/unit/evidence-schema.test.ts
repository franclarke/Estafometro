import { describe, expect, it } from "vitest";

import { evidenceRequestSchema } from "@/lib/validation/evidence";

describe("evidenceRequestSchema", () => {
  it("accepts screenshot preparation payloads", () => {
    const result = evidenceRequestSchema.parse({
      type: "screenshot",
      fileName: "captura.png",
      contentType: "image/png",
      fileSize: 1024,
    });

    expect(result.type).toBe("screenshot");
    expect("storagePath" in result).toBe(false);
  });

  it("accepts screenshot attachment payloads", () => {
    const result = evidenceRequestSchema.parse({
      type: "screenshot",
      storagePath: "case-123/captura.png",
      fileName: "captura.png",
      contentType: "image/png",
      fileSize: 1024,
    });

    expect(result.type).toBe("screenshot");
    expect("storagePath" in result && result.storagePath).toBe("case-123/captura.png");
  });
});
