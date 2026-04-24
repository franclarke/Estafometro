import type { EnrichmentFinding, ExtractedEntity, ExtractedSignal } from "@/types/analysis";

function normalizePhone(value: string) {
  const cleaned = value.replace(/[^\d+]/g, "");
  return cleaned.startsWith("+") ? `+${cleaned.slice(1).replace(/\D/g, "")}` : cleaned.replace(/\D/g, "");
}

function inferCountryCode(phone: string) {
  if (phone.startsWith("+54") || phone.startsWith("54")) {
    return "AR";
  }

  if (phone.startsWith("+1") || phone.startsWith("1")) {
    return "NANP";
  }

  if (phone.startsWith("+34") || phone.startsWith("34")) {
    return "ES";
  }

  if (phone.startsWith("+44") || phone.startsWith("44")) {
    return "UK";
  }

  return "unknown";
}

export async function runPhoneChecker(input: {
  caseType: string;
  entities: ExtractedEntity[];
}): Promise<EnrichmentFinding> {
  const phones = input.entities.filter((entity) => entity.type === "phone");
  const primaryPhone = phones[0];

  if (!primaryPhone) {
    return {
      checkType: "phone",
      status: "skipped",
      summary: "No habia telefono para revisar.",
      result: {},
      derivedSignals: [],
    };
  }

  const normalized = normalizePhone(primaryPhone.value);
  const country = inferCountryCode(normalized);
  const localClaimSensitiveCase = ["bank_support", "authority_extortion"].includes(input.caseType);
  const serviceStyleNumber = /^(0800|0810|\+?540800|\+?540810)/.test(normalized);
  const suspiciousLength = normalized.replace(/^\+/, "").length < 10 || normalized.replace(/^\+/, "").length > 15;
  const foreignForLocalInstitution = localClaimSensitiveCase && country !== "AR" && country !== "unknown";
  const possibleVoip = country !== "AR" || serviceStyleNumber || /^(?:\+?1|\+?44)/.test(normalized);

  const derivedSignals: ExtractedSignal[] = [];
  if (possibleVoip) {
    derivedSignals.push({ code: "phone_possible_voip", confidence: 0.74 });
  }
  if (foreignForLocalInstitution) {
    derivedSignals.push({ code: "phone_prefix_mismatch", confidence: 0.82 });
  }
  if (suspiciousLength || serviceStyleNumber) {
    derivedSignals.push({ code: "suspicious_phone_pattern", confidence: 0.76 });
  }

  return {
    checkType: "phone",
    status: derivedSignals.length > 0 ? "warning" : "success",
    summary:
      derivedSignals.length > 0
        ? "El telefono tiene caracteristicas poco consistentes con un contacto institucional normal."
        : "El telefono no mostro inconsistencias obvias en el check basico.",
    result: {
      original: primaryPhone.value,
      normalized,
      country,
      serviceStyleNumber,
      suspiciousLength,
      foreignForLocalInstitution,
      possibleVoip,
    },
    derivedSignals,
  };
}
