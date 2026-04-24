"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function AnalysisProgress({ publicId }: { publicId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

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
          setError(analysisError instanceof Error ? analysisError.message : "El análisis falló.");
        }
      }
    }

    void analyze();

    return () => {
      cancelled = true;
    };
  }, [publicId, router]);

  return (
    <div className="space-y-5">
      <div className="space-y-4 rounded-lg border border-[var(--line)] bg-[var(--surface-raised)] p-5 sm:p-6" aria-live="polite">
        <p className="text-sm font-semibold uppercase text-[var(--action)]">Estafómetro</p>
        <h1 className="text-3xl font-semibold leading-tight text-[var(--ink)]">Estamos revisando señales.</h1>
        <p className="text-base leading-7 text-[var(--muted)]">Puede tardar unos segundos. Estamos preparando una orientación simple y prudente.</p>
        <div className="h-2 overflow-hidden rounded-lg bg-[var(--line)]">
          <div className="h-full w-2/3 animate-pulse rounded-lg bg-[var(--action)]" />
        </div>
      </div>
      {error ? (
        <div className="space-y-3 rounded-lg border border-[#d88a83] bg-[#fff1ef] p-5 text-sm leading-6 text-[var(--danger)]" aria-live="assertive">
          <p>{error}</p>
          <Button type="button" variant="secondary" onClick={() => router.refresh()}>
            Reintentar
          </Button>
        </div>
      ) : null}
    </div>
  );
}
