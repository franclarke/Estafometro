import type { AnalysisResultPayload } from "@/types/analysis";

const findingLabels: Record<AnalysisResultPayload["externalFindings"][number]["type"], string> = {
  platform_bypass: "Uso de plataforma",
  domain: "Link o dominio",
  phone: "Teléfono",
  website_consistency: "Sitio web",
  public_business_presence: "Presencia pública",
  social_profile: "Perfil social",
};

export function ExternalFindings({ findings }: { findings: AnalysisResultPayload["externalFindings"] }) {
  if (!findings.length) {
    return <p className="text-base leading-7 text-[var(--muted)]">No hizo falta sumar una revisión externa para orientar este caso.</p>;
  }

  return (
    <ul className="space-y-3">
      {findings.map((finding) => (
        <li key={`${finding.type}-${finding.summary}`} className="rounded-lg border border-[var(--line)] bg-[var(--surface-raised)] px-4 py-3">
          <p className="font-semibold text-[var(--ink)]">{findingLabels[finding.type] ?? "Hallazgo"}</p>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{finding.summary}</p>
        </li>
      ))}
    </ul>
  );
}
