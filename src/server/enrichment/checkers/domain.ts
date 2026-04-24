import type { EnrichmentFinding, ExtractedEntity, ExtractedSignal } from "@/types/analysis";

const suspiciousTlds = [".xyz", ".top", ".click", ".live", ".icu", ".shop", ".site"];
const freeHostFragments = ["blogspot.", "wixsite.", "web.app", "pages.dev", "netlify.app", "github.io"];

function isIpLikeDomain(hostname: string) {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname);
}

function normalizeToken(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function extractRelevantBrandTokens(entities: ExtractedEntity[]) {
  return entities
    .filter((entity) =>
      ["bank", "business_name", "authority", "marketplace", "platform"].includes(entity.type),
    )
    .flatMap((entity) => normalizeToken(entity.value).split(/\s+/))
    .filter((token) => token.length >= 4);
}

async function lookupDomainAge(hostname: string) {
  try {
    const response = await fetch(`https://rdap.org/domain/${hostname}`, {
      signal: AbortSignal.timeout(2500),
      headers: {
        Accept: "application/rdap+json, application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const json = (await response.json()) as {
      events?: Array<{ eventAction?: string; eventDate?: string }>;
    };

    const registrationDate = json.events
      ?.find((event) => ["registration", "registered", "creation"].includes((event.eventAction ?? "").toLowerCase()))
      ?.eventDate;

    if (!registrationDate) {
      return null;
    }

    const createdAt = new Date(registrationDate);
    if (Number.isNaN(createdAt.getTime())) {
      return null;
    }

    const ageDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    return {
      registrationDate,
      ageDays,
      isRecent: ageDays >= 0 && ageDays <= 120,
    };
  } catch {
    return null;
  }
}

export async function runDomainChecker(input: { entities: ExtractedEntity[] }): Promise<EnrichmentFinding> {
  const urlEntity = input.entities.find((entity) => entity.type === "url");
  const domainEntity = input.entities.find((entity) => entity.type === "domain");
  const raw = urlEntity?.value ?? domainEntity?.value;

  if (!raw) {
    return {
      checkType: "domain",
      status: "skipped",
      summary: "No había dominio o URL para revisar.",
      result: {},
      derivedSignals: [],
    };
  }

  let hostname = raw;
  try {
    hostname = new URL(raw).hostname;
  } catch {
    hostname = raw;
  }

  const normalizedHostname = normalizeToken(hostname).replace(/\s+/g, "");
  const suspiciousTld = suspiciousTlds.some((tld) => hostname.endsWith(tld));
  const freeHost = freeHostFragments.some((fragment) => hostname.includes(fragment));
  const ipLike = isIpLikeDomain(hostname);
  const punycode = hostname.includes("xn--");
  const unicodeHost = /[^\u0000-\u007f]/.test(hostname);
  const excessiveSubdomains = hostname.split(".").length >= 4;
  const urgentKeywordHost = /(login|secure|seguro|verifica|valida|support|soporte|account|cuenta)/i.test(hostname);
  const brandTokens = extractRelevantBrandTokens(input.entities);
  const brandMismatch =
    brandTokens.length > 0 && !brandTokens.some((token) => normalizedHostname.includes(token));
  const domainAge = await lookupDomainAge(hostname);

  const derivedSignals: ExtractedSignal[] = [];
  if (punycode || unicodeHost) {
    derivedSignals.push({ code: "punycode_domain", confidence: 0.9 });
  }
  if (brandMismatch && urgentKeywordHost) {
    derivedSignals.push({ code: "brand_domain_mismatch", confidence: 0.84 });
  }
  if (suspiciousTld || freeHost || ipLike || excessiveSubdomains) {
    derivedSignals.push({ code: "phishing_domain_characteristics", confidence: 0.82 });
  }
  if (domainAge?.isRecent) {
    derivedSignals.push({ code: "domain_recently_created", confidence: 0.78 });
  }

  const warning = derivedSignals.length > 0;

  return {
    checkType: "domain",
    status: warning ? "warning" : "success",
    summary: warning
      ? "El dominio compartido muestra características compatibles con phishing o suplantación."
      : "El dominio no mostró señales obvias de phishing en el check liviano.",
    result: {
      hostname,
      suspiciousTld,
      freeHost,
      ipLike,
      punycode,
      unicodeHost,
      excessiveSubdomains,
      urgentKeywordHost,
      brandTokens,
      brandMismatch,
      domainAge,
    },
    derivedSignals,
  };
}
