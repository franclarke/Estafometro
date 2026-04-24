import type { AnalysisResultPayload } from "@/types/analysis";

export function SignalList({ signals }: { signals: AnalysisResultPayload["signals"] }) {
  return (
    <ul className="space-y-3">
      {signals.length ? (
        signals.map((signal) => (
          <li key={signal.code} className="rounded-lg border border-[var(--line)] bg-[var(--surface-raised)] px-4 py-3">
            <p className="font-semibold text-[var(--ink)]">{signal.userLabel}</p>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{signal.description}</p>
          </li>
        ))
      ) : (
        <li className="text-base leading-7 text-[var(--muted)]">
          No encontramos señales claras con la información disponible. Aun así, verificá por un canal oficial antes de avanzar.
        </li>
      )}
    </ul>
  );
}
