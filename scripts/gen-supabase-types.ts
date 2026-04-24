import { execSync } from "node:child_process";

const projectId = process.env.SUPABASE_PROJECT_ID;

if (!projectId) {
  console.error("Set SUPABASE_PROJECT_ID in .env.local before running this script.");
  process.exit(1);
}

const outputPath = "src/server/db/generated.types.ts";
const command = `npx supabase gen types typescript --project-id ${projectId} --schema public`;

console.log(`Running: ${command}`);
console.log(`Output:  ${outputPath}`);

const stdout = execSync(command, { encoding: "utf-8" });

const { writeFileSync } = await import("node:fs");
writeFileSync(outputPath, stdout, "utf-8");

console.log("Done — generated types written.");
