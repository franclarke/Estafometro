"use client";

import type { FormEvent } from "react";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  EvidenceUpload,
  type EvidenceFile,
} from "@/components/case-intake/evidence-upload";

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

type PreparedUpload = {
  storagePath: string;
  signedUploadUrl: string;
  uploadToken: string;
};

async function attachEvidenceFile(publicId: string, file: File): Promise<void> {
  const prepareResponse = await fetch(`/api/cases/${publicId}/evidence`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "screenshot",
      fileName: file.name,
      contentType: file.type,
      fileSize: file.size,
    }),
  });
  const prepared = await readApiPayload<PreparedUpload>(
    prepareResponse,
    `No pudimos preparar ${file.name}.`,
  );

  const uploadResponse = await fetch(prepared.signedUploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
      "x-upsert": "true",
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error(`Falló la subida de ${file.name}.`);
  }

  const attachResponse = await fetch(`/api/cases/${publicId}/evidence`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "screenshot",
      fileName: file.name,
      contentType: file.type,
      fileSize: file.size,
      storagePath: prepared.storagePath,
    }),
  });
  await readApiPayload<{ evidenceId: string }>(
    attachResponse,
    `No pudimos adjuntar ${file.name}.`,
  );
}

export function CaseIntakeForm() {
  const router = useRouter();
  const [narrative, setNarrative] = useState("");
  const [files, setFiles] = useState<EvidenceFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatusMessage(null);

    const trimmedNarrative = narrative.trim();
    if (!trimmedNarrative && files.length === 0) {
      setError("Pegá el mensaje, contá brevemente qué pasó o adjuntá una captura.");
      return;
    }

    setIsSubmitting(true);

    try {
      setStatusMessage(
        files.length
          ? "Preparando tu caso y subiendo capturas…"
          : "Preparando tu caso…",
      );
      const createResponse = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          narrative_text: trimmedNarrative || undefined,
          privacy_mode: "minimal_retention",
        }),
      });
      const created = await readApiPayload<{ publicId: string }>(
        createResponse,
        "No pudimos iniciar la revisión.",
      );

      if (files.length) {
        for (const [index, item] of files.entries()) {
          setStatusMessage(
            `Subiendo captura ${index + 1} de ${files.length}…`,
          );
          await attachEvidenceFile(created.publicId, item.file);
        }
      }

      setStatusMessage("Estamos revisando señales…");
      startTransition(() => {
        router.push(`/caso/${created.publicId}`);
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No pudimos iniciar la revisión.",
      );
      setStatusMessage(null);
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={submit} noValidate>
      <div className="rounded-xl border border-[var(--line-strong)] bg-[var(--surface-raised)] p-3 focus-within:border-[var(--brand)] focus-within:ring-4 focus-within:ring-[var(--focus-ring)]">
        <textarea
          id="narrative_text"
          aria-label="Mensaje o situación sospechosa"
          rows={6}
          value={narrative}
          onChange={(event) => setNarrative(event.target.value)}
          disabled={isSubmitting}
          className="block min-h-40 w-full resize-y border-0 bg-transparent px-2 py-2 text-lg leading-8 text-[var(--ink)] outline-none placeholder:text-[var(--muted-soft)]"
          placeholder="Pegá acá el mensaje sospechoso o contá brevemente qué pasó…"
        />
        <div className="mt-2 border-t border-[var(--line)] px-2 pt-3">
          <EvidenceUpload
            files={files}
            onChange={setFiles}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <p className="flex items-start gap-2 text-sm leading-6 text-[var(--caution-text)]">
        <span aria-hidden="true" className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--caution-line)]" />
        <span>No pegues claves, códigos de verificación, DNI completo ni datos de tarjeta.</span>
      </p>

      <div aria-live="polite" className="min-h-5 text-sm">
        {statusMessage ? (
          <p className="font-medium text-[var(--muted)]">{statusMessage}</p>
        ) : null}
        {error ? (
          <p className="font-semibold text-[var(--danger)]">{error}</p>
        ) : null}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Revisando…" : "Revisar riesgo"}
      </Button>
    </form>
  );
}
