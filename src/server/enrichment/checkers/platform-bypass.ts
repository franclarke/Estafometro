import type { EnrichmentFinding, ExtractedEntity } from "@/types/analysis";

export async function runPlatformBypassChecker(input: {
  caseType: string;
  signalCodes: string[];
  entities: ExtractedEntity[];
}): Promise<EnrichmentFinding> {
  const offPlatform = input.signalCodes.includes("off_platform_payment") || input.signalCodes.includes("channel_shift");
  const externalHandle = input.entities.some(
    (entity) => entity.type === "instagram_handle" || entity.type === "phone" || entity.type === "url",
  );

  if (input.caseType !== "online_purchase" && !offPlatform) {
    return {
      checkType: "platform_bypass",
      status: "skipped",
      summary: "No había señales suficientes para revisar desvío fuera de plataforma.",
      result: {},
      derivedSignals: [],
    };
  }

  if (offPlatform && externalHandle) {
    return {
      checkType: "platform_bypass",
      status: "warning",
      summary: "La conversación parece derivarse a un canal externo junto con un pedido de cierre por fuera de la plataforma.",
      result: { offPlatform, externalHandle },
      derivedSignals: [{ code: "platform_bypass", confidence: 0.94 }],
    };
  }

  return {
    checkType: "platform_bypass",
    status: "success",
    summary: "No aparecieron señales nuevas de desvío fuera de plataforma en el check complementario.",
    result: { offPlatform, externalHandle },
    derivedSignals: [],
  };
}
