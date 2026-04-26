import { listCandidatePatternSummaries } from "@/server/candidate-patterns/repository";

function formatSignature(signature: Record<string, unknown>) {
  return Object.entries(signature)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join("; ");
}

async function main() {
  const candidates = await listCandidatePatternSummaries();

  if (!candidates.length) {
    console.log("No candidate patterns found.");
    return;
  }

  console.table(
    candidates.map((candidate) => ({
      id: candidate.id,
      status: candidate.status,
      occurrences: candidate.occurrenceCount,
      linkedCases: candidate.linkedCaseCount,
      lastSeenAt: candidate.lastSeenAt,
      fingerprint: candidate.fingerprint,
      signature: formatSignature(candidate.signatureComponents),
    })),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
