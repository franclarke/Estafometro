import type { RiskLevel } from "@/types/domain";

export const limitsNotice =
  "Esto orienta con señales visibles. No confirma identidades ni reemplaza canales oficiales.";

export const riskLabels: Record<RiskLevel, string> = {
  low: "Riesgo bajo",
  medium: "Riesgo medio",
  high: "Riesgo alto",
  very_high: "Riesgo muy alto",
};

export const riskTone: Record<RiskLevel, string> = {
  low: "No aparecen señales críticas claras, pero conviene verificar antes de seguir.",
  medium: "Tiene señales de riesgo. Conviene frenar y revisar antes de actuar.",
  high: "Tiene señales importantes de riesgo. No avances sin verificar por un canal oficial.",
  very_high: "Tiene señales muy preocupantes. Cortá la interacción y no envíes dinero ni datos.",
};

export const defaultRecommendations = {
  low: [
    "Verificá el pedido por un canal independiente antes de avanzar.",
    "No compartas datos sensibles hasta confirmar identidad y contexto.",
  ],
  medium: [
    "No transfieras ni pagues todavía.",
    "Verificá la situación por otro canal independiente.",
    "Guardá la evidencia por si necesitás revisarla después.",
  ],
  high: [
    "No transfieras dinero ni compartas códigos.",
    "Cortá la conversación y verificá por un canal oficial o independiente.",
    "Conservá capturas, links y datos clave del contacto.",
  ],
  very_high: [
    "No pagues, no transfieras y no envíes datos o códigos.",
    "Cortá la comunicación y usá un canal oficial para verificar.",
    "Guardá evidencia y, si corresponde, buscá ayuda en la entidad o autoridad real.",
  ],
} as const;
