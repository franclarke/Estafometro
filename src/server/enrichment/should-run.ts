import type { ExtractedEntity } from "@/types/analysis";

export function shouldRunExternalChecks(input: {
  caseType: string;
  entities: ExtractedEntity[];
}) {
  const hasUrl = input.entities.some((entity) => entity.type === "url" || entity.type === "domain");
  const hasPhone = input.entities.some((entity) => entity.type === "phone");
  return hasUrl || hasPhone || input.caseType === "online_purchase" || input.caseType === "bank_support";
}
