import { riskLabels } from "@/lib/copy/es-ar";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types/domain";

const toneMap: Record<RiskLevel, string> = {
  low: "border-[#7a9f76] bg-[#eef4e8] text-[#23472b]",
  medium: "border-[#d09b4b] bg-[#fff3d8] text-[#70460b]",
  high: "border-[#c77734] bg-[#fff0df] text-[#81390f]",
  very_high: "border-[#d88a83] bg-[#fff1ef] text-[#8c1d18]",
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span className={cn("inline-flex rounded-lg border px-3 py-1 text-sm font-semibold", toneMap[level])}>
      {riskLabels[level]}
    </span>
  );
}
