import { getServerEnv } from "@/lib/config/env";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { extractionJsonSchema } from "@/server/extraction/schema";

export async function callGeminiForExtraction(input: {
  prompt: string;
  images?: Array<{
    mimeType: string;
    dataBase64: string;
  }>;
}) {
  const env = getServerEnv();
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: input.prompt },
            ...(input.images ?? []).map((image) => ({
              inline_data: {
                mime_type: image.mimeType,
                data: image.dataBase64,
              },
            })),
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseJsonSchema: extractionJsonSchema,
        temperature: 0.2,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    logger.error({ status: response.status, body }, "Gemini extraction request failed");
    throw new AppError("El proveedor de extracción devolvió un error.", {
      code: "GEMINI_REQUEST_ERROR",
      details: body,
    });
  }

  const json = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new AppError("Gemini no devolvió texto estructurado.", {
      code: "GEMINI_EMPTY_RESPONSE",
      details: json,
    });
  }

  return { rawResponse: json as Record<string, unknown>, text };
}
