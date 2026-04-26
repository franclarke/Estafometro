import { getV2AnalyticsSummary } from "@/server/analytics/repository";

async function main() {
  const summary = await getV2AnalyticsSummary();

  console.log("\nFunnel diario");
  console.table(summary.funnelDaily);

  console.log("\nFeedback de calidad");
  console.table(summary.feedbackQuality);

  console.log("\nDistribucion de riesgo");
  console.table(summary.riskDistribution);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
