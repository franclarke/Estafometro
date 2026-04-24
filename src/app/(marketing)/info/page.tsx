import Link from "next/link";

import { Card } from "@/components/ui/card";

export default function InfoPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-10 md:px-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--teal-700)]">Información y límites</p>
          <h1 className="mt-3 text-4xl font-semibold text-[var(--ink)]">Qué hace Estafometro y qué no hace</h1>
        </div>
        <Link href="/" className="text-sm font-semibold text-[var(--teal-700)]">
          Volver
        </Link>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <h2 className="text-xl font-semibold text-[var(--ink)]">Qué hace</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
            <li>Analiza señales visibles en mensajes, capturas, links y datos aportados.</li>
            <li>Devuelve bandas de riesgo, incertidumbres y una acción prudente siguiente.</li>
            <li>Puede sumar checks complementarios cuando hay contexto suficiente.</li>
          </ul>
        </Card>
        <Card>
          <h2 className="text-xl font-semibold text-[var(--ink)]">Qué no hace</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
            <li>No confirma que algo sea seguro.</li>
            <li>No reemplaza canales oficiales, bancos, autoridades ni asesoramiento legal.</li>
            <li>No recupera dinero ni denuncia automáticamente.</li>
          </ul>
        </Card>
      </div>
    </main>
  );
}
