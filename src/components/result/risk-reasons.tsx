import type { AnalysisResultPayload } from "@/types/analysis";

export function RiskReasons({ result }: { result: AnalysisResultPayload }) {
  const factors = result.risk.topFactors.slice(0, 5);

  return (
    <section className="rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-5 sm:p-6">
      <h2 className="text-base font-semibold text-[var(--ink)] sm:text-lg">Por que dio este nivel</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{result.risk.explanationSummary}</p>

      {factors.length ? (
        <ul className="mt-4 space-y-3">
          {factors.map((factor) => (
            <li key={factor.code} className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
              <p className="font-semibold text-[var(--ink)]">{factor.label}</p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{factor.description}</p>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-4 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm leading-6 text-[var(--muted)]">
        {result.risk.confidenceReason}
      </p>
    </section>
  );
}
