import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { CaseIntakeForm } from "@/components/case-intake/case-intake-form";

export default function Page() {
  return (
    <main className="min-h-dvh bg-[var(--surface)] px-4 py-6 text-[var(--ink)] sm:px-6">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-[640px] flex-col gap-8">
        <header className="flex items-center justify-between">
          <Logo />
          <Link
            href="/info"
            className="text-xs font-medium text-[var(--muted)] underline-offset-4 hover:text-[var(--ink)] hover:underline"
          >
            Límites y privacidad
          </Link>
        </header>

        <section className="flex flex-1 flex-col justify-center gap-6">
          <h1 className="max-w-[14ch] text-4xl font-semibold leading-[1.05] tracking-tight text-[var(--ink)] sm:text-5xl">
            ¿Tenés dudas sobre un mensaje?
          </h1>

          <CaseIntakeForm />
        </section>

        <footer className="pt-4 text-xs leading-5 text-[var(--muted)]">
          Gratis · sin cuenta · orientativo. No reemplaza canales oficiales.
        </footer>
      </div>
    </main>
  );
}
