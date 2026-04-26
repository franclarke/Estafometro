import { beforeEach, describe, expect, it, vi } from "vitest";

const fromMock = vi.fn();

vi.mock("@/server/db/client", () => ({
  createServerSupabaseClient: () => ({
    from: fromMock,
  }),
}));

describe("candidate pattern ops", () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it("lists candidates sorted with open items first and linked case counts", async () => {
    const candidateQuery = {
      data: [
        {
          id: "promoted-1",
          fingerprint: "hash-b",
          signature_components: { actor: "seller" },
          occurrence_count: 9,
          first_seen_at: "2026-04-20T00:00:00Z",
          last_seen_at: "2026-04-20T00:00:00Z",
          status: "promoted",
        },
        {
          id: "open-1",
          fingerprint: "hash-a",
          signature_components: { actor: "bank" },
          occurrence_count: 2,
          first_seen_at: "2026-04-21T00:00:00Z",
          last_seen_at: "2026-04-22T00:00:00Z",
          status: "open",
        },
      ],
      error: null,
      order: vi.fn(),
    };
    candidateQuery.order.mockReturnValue(candidateQuery);

    const linkQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: [
          { candidate_pattern_id: "open-1" },
          { candidate_pattern_id: "open-1" },
          { candidate_pattern_id: "promoted-1" },
        ],
        error: null,
      }),
    };

    fromMock.mockImplementation((table: string) => {
      if (table === "candidate_patterns") {
        return {
          select: vi.fn().mockReturnValue(candidateQuery),
        };
      }
      return linkQuery;
    });

    const { listCandidatePatternSummaries } = await import("@/server/candidate-patterns/repository");
    const result = await listCandidatePatternSummaries();

    expect(result[0]?.id).toBe("open-1");
    expect(result[0]?.linkedCaseCount).toBe(2);
    expect(result[1]?.linkedCaseCount).toBe(1);
  });
});
