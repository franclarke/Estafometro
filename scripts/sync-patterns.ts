import { syncPatternsToDatabase } from "@/server/patterns/sync-to-db";

async function main() {
  const result = await syncPatternsToDatabase();
  console.log(JSON.stringify(result, null, 2));
}

void main();
