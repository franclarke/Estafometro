import type { EnrichmentFinding, ExtractedEntity } from "@/types/analysis";

export async function runPublicBusinessChecker(input: {
  entities: ExtractedEntity[];
}): Promise<EnrichmentFinding> {
  const hasBusinessName = input.entities.some((entity) => entity.type === "business_name");
  const hasUrl = input.entities.some((entity) => entity.type === "url" || entity.type === "domain");

  if (!hasBusinessName && !hasUrl) {
    return {
      checkType: "public_business_presence",
      status: "skipped",
      summary: "No había datos suficientes para revisar presencia pública.",
      result: {},
      derivedSignals: [],
    };
  }

  if (hasUrl) {
    return {
      checkType: "public_business_presence",
      status: "success",
      summary: "Se encontró al menos una referencia pública asociada a la operación.",
      result: { hasBusinessName, hasUrl },
      derivedSignals: [{ code: "verified_identity_signal", confidence: 0.55 }],
    };
  }

  return {
    checkType: "public_business_presence",
    status: "warning",
    summary: "No se encontró una referencia pública clara para validar el negocio o la persona.",
    result: { hasBusinessName, hasUrl },
    derivedSignals: [{ code: "external_presence_inconsistent", confidence: 0.61 }],
  };
}
