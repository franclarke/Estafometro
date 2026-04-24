import { loadPatternsFromDisk } from "@/server/patterns/load-from-disk";

async function main() {
  const patterns = await loadPatternsFromDisk();
  console.log(`Validated ${patterns.length} pattern files.`);
}

void main();
