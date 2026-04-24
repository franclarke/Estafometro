import Link from "next/link";
import type { ReactNode } from "react";

import { FeedbackForm } from "@/components/feedback/feedback-form";
import { ExternalFindings } from "@/components/result/external-findings";
import { RecommendationPanel } from "@/components/result/recommendation-panel";
import { RiskBadge } from "@/components/result/risk-badge";
import { ShareResultActions } from "@/components/result/share-result-actions";
import { SignalList } from "@/components/result/signal-list";
import { riskTone } from "@/lib/copy/es-ar";
import { getCaseResult } from "@/server/cases/result";
import type { AnalysisResultPayload } from "@/types/analysis";
import type { RiskLevel } from "@/types/domain";

function buildAvoidActions(result: AnalysisResultPayload) {
  const codes = new Set(result.signals.map((signal) => signal.code));
  const actions = [
    "No compartas claves, códigos de verificación, token ni fotos de tarjetas.",
    "No transfieras dinero hasta verificar por un canal oficial o independiente.",
  ];

  if (codes.has("suspicious_link") || codes.has("phishing_domain_characteristics") || codes.has("brand_domain_mismatch")) {
    actions.push("No abras links ni completes formularios enviados por esa conversación.");
  }

  if (codes.has("platform_bypass") || codes.has("off_platform_payment")) {
    actions.push("No pagues por fuera de la plataforma donde empezó la operación.");
  }

  if (codes.has("threatens_arrest") || codes.has("authority_impersonation")) {
    actions.push("No negocies bajo amenaza: cortá y consultá por canales oficiales.");
  }

  return Array.from(new Set(actions)).slice(0, 4);
}

function riskBorderClass(level: RiskLevel) {
  const toneMap: Record<RiskLevel, string> = {
    low: "border-l-[#3f7d4a]",
    medium: "border-l-[#b45309]",
    high: "border-l-[#c45b12]",
    very_high: "border-l-[var(--danger)]",
  };

  return toneMap[level];
}

function ResultSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-[var(--line)] pt-6">
      <h2 className="text-xl font-semibold text-[var(--ink)]">{title}</h2>
      <div className="mt-4">{children}</div>
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
  const avoidActions = buildAvoidActions(result);

  return (
    <main className="min-h-dvh bg-[var(--surface)] px-4 py-5 text-[var(--ink)] sm:px-6 md:py-8">
      <div className="mx-auto flex w-full max-w-[820px] flex-col gap-7">
        <header className="flex flex-col gap-4 border-b border-[var(--line)] pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase text-[var(--action)]">Estafómetro</p>
            <h1 className="text-4xl font-semibold leading-tight text-[var(--ink)]">Orientación del caso</h1>
            <p className="max-w-2xl text-base leading-7 text-[var(--muted)]">
              Esto orienta con señales visibles. No confirma identidades ni reemplaza canales oficiales.
            </p>
          </div>
          <Link className="text-sm font-semibold text-[var(--action)] underline-offset-4 hover:underline" href="/caso/nuevo">
            Hacer otro análisis
          </Link>
        </header>

        <section className={`rounded-lg border border-l-4 border-[var(--line)] ${riskBorderClass(result.risk.level)} bg-[var(--surface-raised)] p-5 sm:p-6`}>
          <div className="flex flex-wrap items-center gap-3">
            <RiskBadge level={result.risk.level} />
            {result.status === "partial" ? (
              <span className="rounded-lg border border-[var(--caution-line)] bg-[var(--caution-bg)] px-3 py-1 text-sm font-semibold text-[var(--caution-text)]">
                Análisis parcial
              </span>
            ) : null}
          </div>
          <p className="mt-5 text-xl font-semibold leading-8 text-[var(--ink)]">{riskTone[result.risk.level]}</p>
          <p className="mt-4 text-base leading-7 text-[var(--muted)]">{result.summary}</p>
        </section>

        <RecommendationPanel result={result} />

        <ResultSection title="Señales detectadas">
          <SignalList signals={result.signals} />
        </ResultSection>

        <ResultSection title="Qué no hacer">
          <ul className="space-y-3 text-base leading-7 text-[var(--ink)]">
            {avoidActions.map((item) => (
              <li className="flex gap-3" key={item}>
                <span aria-hidden="true" className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--danger)]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </ResultSection>

        {result.externalFindings.length ? (
          <ResultSection title="También revisamos">
            <ExternalFindings findings={result.externalFindings} />
          </ResultSection>
        ) : null}

        <ResultSection title="Lo que no pudimos confirmar">
          <ul className="space-y-3 text-base leading-7 text-[var(--muted)]">
            {result.uncertainties.length ? (
              result.uncertainties.map((item) => <li key={item}>{item}</li>)
            ) : (
              <li>No quedaron faltantes importantes registrados. Igual conviene verificar por un canal oficial antes de avanzar.</li>
            )}
          </ul>
        </ResultSection>

        <ResultSection title="Límites de la herramienta">
          <p className="text-base leading-7 text-[var(--muted)]">{result.limitsNotice}</p>
        </ResultSection>

        <ShareResultActions result={result} />
        <FeedbackForm publicId={publicId} />
      </div>
    </main>
  );
}
