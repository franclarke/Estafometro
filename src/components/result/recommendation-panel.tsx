import type { AnalysisResultPayload } from "@/types/analysis";

export function RecommendationPanel({ result }: { result: AnalysisResultPayload }) {
  const plan = result.actionPlan;

  return (
    <section className="rounded-lg border border-l-4 border-[var(--line)] border-l-[var(--action)] bg-[var(--surface-raised)] p-5 sm:p-6">
      <h2 className="text-sm font-semibold uppercase text-[var(--action)]">Que hacer ahora</h2>
      <p className="mt-4 text-xl font-semibold leading-8 text-[var(--ink)]">{plan.primaryAction}</p>

      <ol className="mt-5 space-y-4 text-base leading-7 text-[var(--ink)]">
        {plan.steps.map((item, index) => (
          <li className="flex gap-3" key={item}>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--action)] text-sm font-semibold text-white">
              {index + 1}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ol>

      {plan.verification.length ? (
        <div className="mt-6 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-4">
          <h3 className="text-sm font-semibold text-[var(--ink)]">Como verificar</h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--muted)]">
            {plan.verification.map((item) => (
              <li className="flex gap-2" key={item}>
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--action)]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {plan.escalation.length ? (
        <div className="mt-4 rounded-lg border border-[var(--caution-line)] bg-[var(--caution-bg)] px-4 py-3 text-sm leading-6 text-[var(--caution-text)]">
          {plan.escalation[0]}
        </div>
      ) : null}
    </section>
  );
}
