"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Logo } from "@/components/brand/logo";
import { RiskGauge } from "@/components/result/risk-gauge";
import { Button } from "@/components/ui/button";

const STEP_MESSAGES = [
  "Preparando tu caso…",
  "Leyendo capturas y extrayendo texto…",
  "Revisando señales de riesgo…",
  "Cruzando con patrones conocidos…",
  "Armando la orientación…",
];

export function AnalysisProgress({ publicId }: { publicId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((current) =>
        current < STEP_MESSAGES.length - 1 ? current + 1 : current,
      );
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function analyze() {
      try {
        const response = await fetch(`/api/cases/${publicId}/analyze`, {
          method: "POST",
        });
        const payload = (await response.json()) as {
          ok: boolean;
          error?: { message: string; code?: string };
        };

        if (!payload.ok) {
          throw new Error(payload.error?.message ?? "No se pudo analizar el caso.");
        }

        if (!cancelled) {
          router.replace(`/caso/${publicId}/resultado`);
        }
      } catch (analysisError) {
        if (!cancelled) {
          setError(
            analysisError instanceof Error
              ? analysisError.message
              : "El análisis falló.",
          );
        }
      }
    }

    void analyze();

    return () => {
      cancelled = true;
    };
  }, [publicId, router]);

  return (
    <div className="flex min-h-dvh flex-col px-4 py-6 sm:px-6">
      <header className="mb-6">
        <Logo />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
        <RiskGauge variant="scanning" className="animate-[fade-up_400ms_ease-out]" />

        <div className="flex flex-col items-center gap-2" aria-live="polite">
          <p className="text-xl font-semibold leading-tight text-[var(--ink)]">
            Estamos revisando tu caso
          </p>
          <p className="min-h-6 text-sm leading-6 text-[var(--muted)]">
            {STEP_MESSAGES[stepIndex]}
          </p>
        </div>

        {error ? (
          <div
            role="alert"
            className="w-full max-w-md space-y-3 rounded-lg border border-[#d88a83] bg-[#fff1ef] p-4 text-sm leading-6 text-[var(--danger)]"
          >
            <p>{error}</p>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.refresh()}
            >
              Reintentar
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
