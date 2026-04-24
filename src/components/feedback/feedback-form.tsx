"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function FeedbackForm({ publicId }: { publicId: string }) {
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [comment, setComment] = useState("");

  async function send(helpful: boolean) {
    setStatus("idle");
    const response = await fetch(`/api/cases/${publicId}/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        helpful,
        false_alarm: !helpful,
        comment: comment || undefined,
      }),
    });

    setStatus(response.ok ? "saved" : "error");
  }

  return (
    <section className="border-t border-[var(--line)] pt-6">
      <details className="group">
        <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--action)] underline-offset-4 hover:underline">
          Contar si esta orientación ayudó
        </summary>
        <div className="mt-4 space-y-4">
          <label className="block text-sm font-semibold text-[var(--ink)]" htmlFor="feedback-comment">
            Comentario opcional
          </label>
          <textarea
            id="feedback-comment"
            rows={4}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            className="w-full rounded-lg border border-[var(--line-strong)] bg-[var(--surface-raised)] px-4 py-3 text-base leading-7 text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--muted-soft)] focus:border-[var(--action)] focus:ring-4 focus:ring-[var(--focus-ring)]"
            placeholder="Si querés, dejá un comentario corto para mejorar la herramienta."
          />
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={() => void send(true)}>
              Sí, me ayudó
            </Button>
            <Button type="button" variant="secondary" onClick={() => void send(false)}>
              No del todo
            </Button>
          </div>
          <div aria-live="polite">
            {status === "saved" ? <p className="text-sm text-[var(--success)]">Gracias por el feedback.</p> : null}
            {status === "error" ? <p className="text-sm text-[var(--danger)]">No pudimos guardar el feedback.</p> : null}
          </div>
        </div>
      </details>
    </section>
  );
}
