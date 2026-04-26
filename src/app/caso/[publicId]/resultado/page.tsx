import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/brand/logo";
import { FeedbackForm } from "@/components/feedback/feedback-form";
import { ExternalFindings } from "@/components/result/external-findings";
import { FollowupQuestions } from "@/components/result/followup-questions";
import { RecommendationPanel } from "@/components/result/recommendation-panel";
import { RiskGauge } from "@/components/result/risk-gauge";
import { RiskReasons } from "@/components/result/risk-reasons";
import { ShareResultActions } from "@/components/result/share-result-actions";
import { SignalList } from "@/components/result/signal-list";
import { riskTone } from "@/lib/copy/es-ar";
import { getCaseResult } from "@/server/cases/result";

function ResultBlock({
  title,
  children,
  subtle = false,
}: {
  title: string;
  children: ReactNode;
  subtle?: boolean;
}) {
  return (
    <section
      className={
        subtle
          ? "space-y-3"
          : "space-y-4 rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-5 sm:p-6"
      }
    >
      <h2
        className={
          subtle
            ? "text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]"
            : "text-base font-semibold text-[var(--ink)] sm:text-lg"
        }
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function ResultPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const result = await getCaseResult(publicId);
  const riskSignals = result.signals.filter((signal) => signal.groupName !== "trust_builder");
  const trustSignals = result.signals.filter((signal) => signal.groupName === "trust_builder");

  return (
    <main className="min-h-dvh bg-[var(--surface)] px-4 py-6 text-[var(--ink)] sm:px-6 md:py-8">
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6">
        <header className="flex items-center justify-between">
          <Logo />
          <Link
            className="text-xs font-medium text-[var(--muted)] underline-offset-4 hover:text-[var(--ink)] hover:underline"
            href="/"
          >
            Otro analisis
          </Link>
        </header>

        <section className="flex flex-col items-center gap-6 rounded-2xl border border-[var(--line)] bg-[var(--surface-raised)] px-4 py-8 text-center sm:px-8 sm:py-10">
          <RiskGauge score={result.risk.score} level={result.risk.level} />
          <div className="space-y-3">
            {result.status === "partial" ? (
              <span className="inline-flex items-center rounded-full border border-[var(--caution-line)] bg-[var(--caution-bg)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--caution-text)]">
                Analisis parcial
              </span>
            ) : null}
            <p className="mx-auto max-w-[38ch] text-lg leading-7 font-medium text-[var(--ink)] sm:text-xl sm:leading-8">
              {riskTone[result.risk.level]}
            </p>
            {result.summary ? (
              <p className="mx-auto max-w-[52ch] text-sm leading-6 text-[var(--muted)] sm:text-base sm:leading-7">
                {result.summary}
              </p>
            ) : null}
          </div>
        </section>

        <RecommendationPanel result={result} />
        <RiskReasons result={result} />

        <div className="grid gap-4 md:grid-cols-2">
          <ResultBlock title="Senales detectadas">
            <SignalList signals={riskSignals} />
          </ResultBlock>

          <ResultBlock title="Que no hacer">
            <ul className="space-y-3 text-sm leading-6 text-[var(--ink)]">
              {result.actionPlan.avoid.map((item) => (
                <li className="flex gap-3" key={item}>
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--danger)]"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </ResultBlock>
        </div>

        {trustSignals.length ? (
          <ResultBlock title="Datos que reducen incertidumbre">
            <SignalList signals={trustSignals} />
          </ResultBlock>
        ) : null}

        {result.externalFindings.length ? (
          <ResultBlock title="Tambien revisamos">
            <ExternalFindings findings={result.externalFindings} />
          </ResultBlock>
        ) : null}

        {result.uncertainties.length ? (
          <ResultBlock title="Lo que no pudimos confirmar" subtle>
            <ul className="space-y-2 text-sm leading-6 text-[var(--muted)]">
              {result.uncertainties.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </ResultBlock>
        ) : null}

        <ShareResultActions result={result} />
        <FollowupQuestions publicId={publicId} questions={result.followupQuestions} />
        <FeedbackForm publicId={publicId} />

        <p className="border-t border-[var(--line)] pt-4 text-center text-xs leading-5 text-[var(--muted)]">
          {result.limitsNotice}
        </p>
      </div>
    </main>
  );
}
