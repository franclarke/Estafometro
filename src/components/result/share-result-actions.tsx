"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { riskLabels } from "@/lib/copy/es-ar";
import type { AnalysisResultPayload } from "@/types/analysis";

function buildShareText(result: AnalysisResultPayload) {
  const steps = result.actionPlan.steps.slice(0, 3).map((item) => `- ${item}`).join("\n");

  return [
    `Estafometro: ${riskLabels[result.risk.level]}`,
    result.summary,
    `\nAccion principal:\n${result.actionPlan.primaryAction}`,
    steps ? `\nPasos sugeridos:\n${steps}` : "",
    "\nEs una evaluacion orientativa: verifica siempre por canales oficiales antes de pagar o compartir datos.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function ShareResultActions({ result }: { result: AnalysisResultPayload }) {
  const [status, setStatus] = useState<"idle" | "copied" | "shared" | "error">("idle");
  const shareText = useMemo(() => buildShareText(result), [result]);

  async function trackResultAction(eventType: "result_copied" | "result_shared") {
    await fetch(`/api/cases/${result.publicId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType }),
    }).catch(() => undefined);
  }

  async function copyResult() {
    try {
      await navigator.clipboard.writeText(shareText);
      await trackResultAction("result_copied");
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
        title: "Resultado de Estafometro",
        text: shareText,
      });
      await trackResultAction("result_shared");
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
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        Podes copiar esta orientacion para revisarla con un familiar o persona de confianza.
      </p>
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
