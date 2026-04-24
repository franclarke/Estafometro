"use client";

import type { FormEvent } from "react";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type ApiPayload<T> = {
  ok: boolean;
  data?: T;
  error?: { message?: string };
};

async function readApiPayload<T>(response: Response, fallbackMessage: string): Promise<T> {
  const payload = (await response.json().catch(() => null)) as ApiPayload<T> | null;

  if (!response.ok || !payload?.ok || !payload.data) {
    throw new Error(payload?.error?.message ?? fallbackMessage);
  }

  return payload.data;
}

export function CaseIntakeForm() {
  const router = useRouter();
  const [narrative, setNarrative] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatusMessage(null);

    const trimmedNarrative = narrative.trim();
    if (!trimmedNarrative) {
      setError("Pegá el mensaje o contá brevemente qué pasó para poder revisar el caso.");
      return;
    }

    setIsSubmitting(true);

    try {
      setStatusMessage("Estamos revisando señales. Puede tardar unos segundos.");
      const createResponse = await fetch("/api/cases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          narrative_text: trimmedNarrative,
          privacy_mode: "minimal_retention",
        }),
      });
      const created = await readApiPayload<{ publicId: string }>(createResponse, "No pudimos iniciar la revisión.");

      startTransition(() => {
        router.push(`/caso/${created.publicId}`);
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No pudimos iniciar la revisión.");
      setStatusMessage(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      <div className="space-y-3">
        <label className="block text-base font-semibold text-[var(--ink)]" htmlFor="narrative_text">
          Mensaje o situación sospechosa
        </label>
        <textarea
          id="narrative_text"
          aria-describedby="safety-note"
          rows={7}
          value={narrative}
          onChange={(event) => setNarrative(event.target.value)}
          className="min-h-48 w-full resize-y rounded-lg border border-[var(--line-strong)] bg-[var(--surface-raised)] px-4 py-4 text-lg leading-8 text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--muted-soft)] focus:border-[var(--action)] focus:ring-4 focus:ring-[var(--focus-ring)] sm:min-h-64"
          placeholder="Ejemplo: “Me escribieron diciendo que eran del banco y me pidieron un código para desbloquear la cuenta...”"
        />
        <p id="safety-note" className="rounded-lg border border-[var(--caution-line)] bg-[var(--caution-bg)] px-4 py-3 text-sm leading-6 text-[var(--caution-text)]">
          No pegues claves, códigos de verificación, DNI completo ni datos de tarjeta.
        </p>
      </div>

      <div aria-live="polite" className="min-h-6">
        {statusMessage ? <p className="text-sm font-medium text-[var(--muted)]">{statusMessage}</p> : null}
        {error ? <p className="text-sm font-semibold text-[var(--danger)]">{error}</p> : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" disabled={isSubmitting} className="w-full px-6 sm:w-auto">
          {isSubmitting ? "Revisando..." : "Revisar riesgo"}
        </Button>
        <p className="text-sm leading-6 text-[var(--muted)]">
          Detectamos links, teléfonos o usuarios dentro del texto. No tenés que separarlos.
        </p>
      </div>
    </form>
  );
}
