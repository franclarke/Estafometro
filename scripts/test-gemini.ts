import { callGeminiForExtraction } from "@/server/extraction/gemini-client";
import { buildExtractionPrompt } from "@/server/extraction/prompts/extraction.v1";
import { extractionSchema } from "@/server/extraction/schema";
import { runGeminiExtraction } from "@/server/extraction/run-extraction";

async function main() {
  const text = "Me llamaron del banco pidiendo un código que me llegó por SMS.";
  console.log("GEMINI_MODEL:", process.env.GEMINI_MODEL);
  console.log("Has GEMINI_API_KEY:", Boolean(process.env.GEMINI_API_KEY));

  console.log("\n--- Direct Gemini call (to see real error) ---");
  try {
    const prompt = buildExtractionPrompt({
      mergedCaseText: text,
      evidenceContext: "No hay imágenes, URLs ni teléfonos extra.",
    });
    const response = await callGeminiForExtraction({ prompt });
    console.log("Raw text:", response.text);
    const parsed = extractionSchema.parse(JSON.parse(response.text));
    console.log("Parsed OK:", JSON.stringify(parsed, null, 2));
  } catch (err) {
    console.error("Direct call failed:");
    console.error(err);
    if (err && typeof err === "object" && "details" in err) {
      console.error("Details:", (err as { details?: unknown }).details);
    }
  }

  console.log("\n--- runGeminiExtraction result ---");
  const result = await runGeminiExtraction({
    mergedCaseText: text,
    preprocessedEvidence: [],
  });
  console.log("usedFallback:", result.usedFallback);
  console.log("extraction:", JSON.stringify(result.extraction, null, 2));
  if (result.usedFallback) {
    process.exitCode = 1;
  }
}

void main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
