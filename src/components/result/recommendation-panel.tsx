import type { AnalysisResultPayload } from "@/types/analysis";

export function RecommendationPanel({ result }: { result: AnalysisResultPayload }) {
  return (
    <section className="rounded-lg border border-l-4 border-[var(--line)] border-l-[var(--action)] bg-[var(--surface-raised)] p-5 sm:p-6">
      <h2 className="text-sm font-semibold uppercase text-[var(--action)]">Qué hacer ahora</h2>
      <ul className="mt-5 space-y-4 text-lg leading-8 text-[var(--ink)]">
        {result.recommendations.map((item) => (
          <li className="flex gap-3" key={item}>
            <span aria-hidden="true" className="mt-3 h-2 w-2 shrink-0 rounded-full bg-[var(--action)]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {result.suggestedFollowupQuestion ? (
        <p className="mt-5 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm leading-6 text-[var(--muted)]">
          Si vas a revisar un poco más: {result.suggestedFollowupQuestion}
        </p>
      ) : null}
    </section>
  );
}
