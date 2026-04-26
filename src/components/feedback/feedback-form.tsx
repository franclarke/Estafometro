"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

const outcomeOptions = [
  { value: "paused", label: "Frene antes de actuar" },
  { value: "verified", label: "Verifique por otro canal" },
  { value: "ignored", label: "Segui sin cambios" },
  { value: "already_paid", label: "Ya habia pagado o respondido" },
  { value: "reported", label: "Lo reporte o pedi ayuda" },
  { value: "other", label: "Otra cosa" },
];

const actionOptions = [
  { value: "did_not_pay", label: "No pague" },
  { value: "called_official_channel", label: "Llame o escribi al canal oficial" },
  { value: "asked_family", label: "Consulte con alguien de confianza" },
  { value: "blocked_contact", label: "Bloquee el contacto" },
  { value: "saved_evidence", label: "Guarde evidencia" },
  { value: "other", label: "Otra accion" },
];

const reasonTags = [
  { value: "clear_steps", label: "Pasos claros" },
  { value: "risk_explained", label: "Entendi el riesgo" },
  { value: "missing_context", label: "Falto contexto" },
  { value: "too_generic", label: "Muy generico" },
  { value: "wrong_signal", label: "Alguna senal no coincidio" },
];

export function FeedbackForm({ publicId }: { publicId: string }) {
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [comment, setComment] = useState("");
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [outcome, setOutcome] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [clarityScore, setClarityScore] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  function toggleTag(tag: string) {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag],
    );
  }

  async function send(nextHelpful = helpful) {
    if (nextHelpful === null) {
      setStatus("error");
      return;
    }

    setStatus("idle");
    const response = await fetch(`/api/cases/${publicId}/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        helpful: nextHelpful,
        false_alarm: !nextHelpful,
        comment: comment || undefined,
        outcome: outcome || undefined,
        action_taken: actionTaken || undefined,
        clarity_score: clarityScore ?? undefined,
        reason_tags: selectedTags,
      }),
    });

    setStatus(response.ok ? "saved" : "error");
  }

  return (
    <section className="border-t border-[var(--line)] pt-6">
      <details className="group">
        <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--action)] underline-offset-4 hover:underline">
          Contar si esta orientacion ayudo
        </summary>
        <div className="mt-4 space-y-5">
          <div>
            <p className="text-sm font-semibold text-[var(--ink)]">Te ayudo a decidir que hacer?</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Button
                type="button"
                variant={helpful === true ? "primary" : "secondary"}
                onClick={() => setHelpful(true)}
              >
                Si, me ayudo
              </Button>
              <Button
                type="button"
                variant={helpful === false ? "primary" : "secondary"}
                onClick={() => setHelpful(false)}
              >
                No del todo
              </Button>
            </div>
          </div>

          <label className="block text-sm font-semibold text-[var(--ink)]" htmlFor="feedback-outcome">
            Que hiciste despues?
          </label>
          <select
            id="feedback-outcome"
            value={outcome}
            onChange={(event) => setOutcome(event.target.value)}
            className="w-full rounded-lg border border-[var(--line-strong)] bg-[var(--surface-raised)] px-4 py-3 text-base text-[var(--ink)] outline-none focus:border-[var(--action)] focus:ring-4 focus:ring-[var(--focus-ring)]"
          >
            <option value="">Prefiero no decir</option>
            {outcomeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <label className="block text-sm font-semibold text-[var(--ink)]" htmlFor="feedback-action">
            Accion concreta que tomaste
          </label>
          <select
            id="feedback-action"
            value={actionTaken}
            onChange={(event) => setActionTaken(event.target.value)}
            className="w-full rounded-lg border border-[var(--line-strong)] bg-[var(--surface-raised)] px-4 py-3 text-base text-[var(--ink)] outline-none focus:border-[var(--action)] focus:ring-4 focus:ring-[var(--focus-ring)]"
          >
            <option value="">Prefiero no decir</option>
            {actionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div>
            <p className="text-sm font-semibold text-[var(--ink)]">Claridad del resultado</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  type="button"
                  key={score}
                  onClick={() => setClarityScore(score)}
                  className={`h-9 w-9 rounded-full border text-sm font-semibold ${
                    clarityScore === score
                      ? "border-[var(--action)] bg-[var(--action)] text-white"
                      : "border-[var(--line-strong)] bg-[var(--surface-raised)] text-[var(--ink)]"
                  }`}
                >
                  {score}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-[var(--ink)]">Que influyo?</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {reasonTags.map((tag) => (
                <button
                  type="button"
                  key={tag.value}
                  onClick={() => toggleTag(tag.value)}
                  className={`rounded-full border px-3 py-1.5 text-sm ${
                    selectedTags.includes(tag.value)
                      ? "border-[var(--action)] bg-[var(--focus-ring)] text-[var(--action)]"
                      : "border-[var(--line)] bg-[var(--surface-raised)] text-[var(--muted)]"
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block text-sm font-semibold text-[var(--ink)]" htmlFor="feedback-comment">
            Comentario opcional
          </label>
          <textarea
            id="feedback-comment"
            rows={4}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            className="w-full rounded-lg border border-[var(--line-strong)] bg-[var(--surface-raised)] px-4 py-3 text-base leading-7 text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--muted-soft)] focus:border-[var(--action)] focus:ring-4 focus:ring-[var(--focus-ring)]"
            placeholder="Si queres, deja un comentario corto para mejorar la herramienta."
          />

          <Button type="button" onClick={() => void send()}>
            Enviar feedback
          </Button>

          <div aria-live="polite">
            {status === "saved" ? <p className="text-sm text-[var(--success)]">Gracias por el feedback.</p> : null}
            {status === "error" ? (
              <p className="text-sm text-[var(--danger)]">No pudimos guardar el feedback. Revisa si marcaste si ayudo.</p>
            ) : null}
          </div>
        </div>
      </details>
    </section>
  );
}
