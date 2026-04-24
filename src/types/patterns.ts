import type { RiskLevel } from "@/types/domain";

export interface PatternDefinition {
  code: string;
  name: string;
  category: string;
  summary: string;
  coreSignals: string[];
  highWeightSignals: string[];
  hardRules: Array<{
    when: string[];
    floor: RiskLevel;
  }>;
  counterSignals: string[];
  variantExamples: string[];
  recommendedActions: string[];
  minimumRiskLevel: RiskLevel;
}

export interface PatternFileRecord extends PatternDefinition {
  sourcePath: string;
}
