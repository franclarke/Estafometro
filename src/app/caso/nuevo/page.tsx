import Link from "next/link";

import { CaseIntakeForm } from "@/components/case-intake/case-intake-form";

export default function NewCasePage() {
  return (
    <main className="min-h-dvh bg-[var(--surface)] px-4 py-5 text-[var(--ink)] sm:px-6">
      <div className="mx-auto flex min-h-[calc(100dvh-2.5rem)] w-full max-w-[820px] flex-col justify-center gap-7">
        <header className="space-y-5">
          <Link className="text-sm font-semibold text-[var(--action)] underline-offset-4 hover:underline" href="/">
            Estafómetro
          </Link>
          <div className="space-y-4">
            <h1 className="max-w-[14ch] text-4xl font-semibold leading-tight text-[var(--ink)] sm:text-5xl">
              ¿Tenés dudas sobre un mensaje?
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[var(--muted)]">
              Pegalo acá y Estafómetro revisa señales de riesgo antes de que pagues, respondas o compartas datos.
            </p>
          </div>
        </header>

        <section aria-label="Revisar riesgo" className="rounded-lg border border-[var(--line)] bg-[var(--surface-raised)] p-4 sm:p-6">
          <CaseIntakeForm />
        </section>
      </div>
    </main>
  );
}
