"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { riskLabels } from "@/lib/copy/es-ar";
import type { AnalysisResultPayload } from "@/types/analysis";

function buildShareText(result: AnalysisResultPayload) {
  const recommendations = result.recommendations.slice(0, 3).map((item) => `- ${item}`).join("\n");

  return [
    `Estafómetro: ${riskLabels[result.risk.level]}`,
    result.summary,
    recommendations ? `\nQué conviene hacer:\n${recommendations}` : "",
    "\nEs una evaluación orientativa: verificá siempre por canales oficiales antes de pagar o compartir datos.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function ShareResultActions({ result }: { result: AnalysisResultPayload }) {
  const [status, setStatus] = useState<"idle" | "copied" | "shared" | "error">("idle");
  const shareText = useMemo(() => buildShareText(result), [result]);

  async function copyResult() {
    try {
      await navigator.clipboard.writeText(shareText);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
  }

  async function shareResult() {
    if (!navigator.share) {
      await copyResult();
      return;
    }

    try {
      await navigator.share({
        title: "Resultado de Estafómetro",
        text: shareText,
      });
      setStatus("shared");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setStatus("error");
    }
  }

  return (
    <section className="border-t border-[var(--line)] pt-6">
      <p className="text-xl font-semibold text-[var(--ink)]">Compartir con alguien de confianza</p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Podés copiar esta orientación para revisarla con un familiar o persona de confianza.</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Button type="button" variant="secondary" onClick={() => void copyResult()}>
          Copiar resultado
        </Button>
        <Button type="button" variant="secondary" onClick={() => void shareResult()}>
          Compartir
        </Button>
      </div>
      <div aria-live="polite" className="mt-3 min-h-5">
        {status === "copied" ? <p className="text-sm text-[var(--success)]">Resultado copiado.</p> : null}
        {status === "shared" ? <p className="text-sm text-[var(--success)]">Resultado compartido.</p> : null}
        {status === "error" ? <p className="text-sm text-[var(--danger)]">No pudimos copiar el resultado.</p> : null}
      </div>
    </section>
  );
}
