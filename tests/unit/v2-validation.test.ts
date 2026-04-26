import { describe, expect, it } from "vitest";

import { feedbackSchema, followupAnswerSchema, resultEventSchema } from "@/lib/validation/case";

describe("V2 validation schemas", () => {
  it("accepts enriched feedback fields", () => {
    const parsed = feedbackSchema.parse({
      helpful: true,
      outcome: "paused",
      action_taken: "did_not_pay",
      clarity_score: 5,
      reason_tags: ["clear_steps"],
      comment: "Me ayudo a frenar.",
    });

    expect(parsed.outcome).toBe("paused");
    expect(parsed.action_taken).toBe("did_not_pay");
    expect(parsed.clarity_score).toBe(5);
    expect(parsed.reason_tags).toEqual(["clear_steps"]);
  });

  it("rejects invalid clarity scores", () => {
    expect(() =>
      feedbackSchema.parse({
        helpful: true,
        clarity_score: 6,
      }),
    ).toThrow();
  });

  it("accepts up to three follow-up answers", () => {
    const parsed = followupAnswerSchema.parse({
      answers: [
        { questionId: "asked_for_code", answer: "yes" },
        { questionId: "requested_money", answer: "no" },
      ],
    });

    expect(parsed.answers).toHaveLength(2);
  });

  it("only accepts known result events", () => {
    expect(resultEventSchema.parse({ eventType: "result_copied" }).eventType).toBe("result_copied");
    expect(() => resultEventSchema.parse({ eventType: "unknown" })).toThrow();
  });
});
