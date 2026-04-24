import { runDomainChecker } from "@/server/enrichment/checkers/domain";
import { runPhoneChecker } from "@/server/enrichment/checkers/phone";
import { runPlatformBypassChecker } from "@/server/enrichment/checkers/platform-bypass";
import { runPublicBusinessChecker } from "@/server/enrichment/checkers/public-business";
import { runWebsiteConsistencyChecker } from "@/server/enrichment/checkers/website-consistency";
import { mapFindingsToSignals } from "@/server/enrichment/findings-to-signals";
import { shouldRunExternalChecks } from "@/server/enrichment/should-run";
import type { EnrichmentFinding, ExtractedEntity } from "@/types/analysis";

export async function runExternalChecks(input: {
  caseType: string;
  entities: ExtractedEntity[];
  signalCodes: string[];
}) {
  if (!shouldRunExternalChecks({ caseType: input.caseType, entities: input.entities })) {
    return {
      findings: [] as EnrichmentFinding[],
      derivedSignals: [],
    };
  }

  const settled = await Promise.allSettled([
    runPlatformBypassChecker(input),
    runDomainChecker({ entities: input.entities }),
    runPhoneChecker({ caseType: input.caseType, entities: input.entities }),
    runWebsiteConsistencyChecker({ entities: input.entities }),
    runPublicBusinessChecker({ entities: input.entities }),
  ]);

  const findings = settled.flatMap((item) => (item.status === "fulfilled" ? [item.value] : []));

  return {
    findings,
    derivedSignals: mapFindingsToSignals(findings),
  };
}
