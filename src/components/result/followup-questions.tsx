"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import type { FollowupQuestion } from "@/types/analysis";

export function FollowupQuestions({
  publicId,
  questions,
}: {
  publicId: string;
  questions: FollowupQuestion[];
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");

  if (!questions.length) {
    return null;
  }

  function setAnswer(questionId: string, answer: string) {
    setAnswers((current) => ({ ...current, [questionId]: answer }));
  }

  async function submit() {
    const payload = questions
      .map((question) => ({
        questionId: question.id,
        answer: answers[question.id]?.trim() || "unknown",
      }))
      .filter((item) => item.answer !== "unknown");

    if (!payload.length) {
      setStatus("error");
      return;
    }

    setStatus("submitting");
    const response = await fetch(`/api/cases/${publicId}/followups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: payload }),
    });

    if (!response.ok) {
      setStatus("error");
      return;
    }

    router.refresh();
    setStatus("idle");
  }

  return (
    <section className="rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-5 sm:p-6">
      <h2 className="text-base font-semibold text-[var(--ink)] sm:text-lg">Completar con 1 dato mas</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        Si respondes alguna pregunta, volvemos a revisar el caso con ese contexto.
      </p>

      <div className="mt-5 space-y-5">
        {questions.map((question) => (
          <div key={question.id} className="space-y-3">
            <div>
              <p className="font-semibold leading-6 text-[var(--ink)]">{question.label}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{question.reason}</p>
            </div>

            {question.type === "yes_no" ? (
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["yes", "Si"],
                    ["no", "No"],
                    ["unknown", "No se"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAnswer(question.id, value)}
                    className={`rounded-full border px-3 py-1.5 text-sm ${
                      answers[question.id] === value
                        ? "border-[var(--action)] bg-[var(--focus-ring)] text-[var(--action)]"
                        : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : (
              <textarea
                rows={3}
                value={answers[question.id] ?? ""}
                onChange={(event) => setAnswer(question.id, event.target.value)}
                className="w-full rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-4 py-3 text-sm leading-6 text-[var(--ink)] outline-none focus:border-[var(--action)] focus:ring-4 focus:ring-[var(--focus-ring)]"
                placeholder="Agrega solo el dato necesario. No pegues claves ni codigos."
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="button" onClick={() => void submit()} disabled={status === "submitting"}>
          {status === "submitting" ? "Revisando..." : "Revisar con este dato"}
        </Button>
        <div aria-live="polite">
          {status === "error" ? (
            <p className="text-sm text-[var(--danger)]">No pudimos usar esa respuesta. Proba de nuevo.</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
