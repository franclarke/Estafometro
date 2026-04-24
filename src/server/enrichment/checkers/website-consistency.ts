import type { EnrichmentFinding, ExtractedEntity } from "@/types/analysis";

async function fetchWithTimeout(url: string, timeoutMs = 4_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal, redirect: "follow" });
  } finally {
    clearTimeout(timer);
  }
}

function extractTitle(html: string) {
  const match = html.match(/<title[^>]*>(.*?)<\/title>/i);
  return match?.[1]?.replace(/\s+/g, " ").trim() ?? "";
}

export async function runWebsiteConsistencyChecker(input: {
  entities: ExtractedEntity[];
}): Promise<EnrichmentFinding> {
  const urlEntity = input.entities.find((entity) => entity.type === "url");

  if (!urlEntity) {
    return {
      checkType: "website_consistency",
      status: "skipped",
      summary: "No había sitio web para revisar.",
      result: {},
      derivedSignals: [],
    };
  }

  try {
    const response = await fetchWithTimeout(urlEntity.value);
    if (!response.ok) {
      return {
        checkType: "website_consistency",
        status: "warning",
        summary: "El sitio no respondió de forma confiable durante la revisión.",
        result: { status: response.status },
        derivedSignals: [{ code: "website_unreachable", confidence: 0.78 }],
      };
    }

    const html = await response.text();
    const title = extractTitle(html);
    const hostname = new URL(response.url).hostname.replace(/^www\./, "");
    const genericTitle = !title || /index of|default page|coming soon/i.test(title);
    const titleMismatch = title ? !title.toLowerCase().includes(hostname.split(".")[0] ?? "") : true;

    if (genericTitle || titleMismatch) {
      return {
        checkType: "website_consistency",
        status: "warning",
        summary: "El sitio existe, pero su contenido visible no parece consistente o es demasiado genérico.",
        result: { title, hostname, genericTitle, titleMismatch },
        derivedSignals: [{ code: "external_presence_inconsistent", confidence: 0.76 }],
      };
    }

    return {
      checkType: "website_consistency",
      status: "success",
      summary: "El sitio respondió y mostró señales básicas de consistencia.",
      result: { title, hostname },
      derivedSignals: [{ code: "verified_identity_signal", confidence: 0.62 }],
    };
  } catch {
    return {
      checkType: "website_consistency",
      status: "failed",
      summary: "No se pudo completar la revisión del sitio en este momento.",
      result: {},
      derivedSignals: [{ code: "website_unreachable", confidence: 0.68 }],
    };
  }
}
