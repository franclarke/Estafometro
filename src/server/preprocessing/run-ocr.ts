import sharp from "sharp";
import Tesseract from "tesseract.js";

import { AppError } from "@/lib/errors";
import { normalizeText } from "@/server/preprocessing/normalize-text";

export async function runOCR(buffer: Buffer) {
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    const resized =
      metadata.width && metadata.width > 1800
        ? await image.resize({ width: 1800 }).png().toBuffer()
        : await image.png().toBuffer();

    const result = await Tesseract.recognize(resized, "spa+eng");
    return normalizeText(result.data.text);
  } catch (error) {
    throw new AppError("No se pudo procesar el OCR de la captura.", {
      code: "OCR_ERROR",
      details: error,
    });
  }
}
