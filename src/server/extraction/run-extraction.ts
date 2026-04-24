import { logger } from "@/lib/logger";
import { updateEvidenceRecord } from "@/server/evidence/repository";
import { enforceBehavioralVectorFloors, inferBehavioralVectors } from "@/server/extraction/behavioral-heuristics";
import { callGeminiForExtraction } from "@/server/extraction/gemini-client";
import { buildExtractionPrompt, EXTRACTION_PROMPT_VERSION } from "@/server/extraction/prompts/extraction.v1";
import { extractionSchema, type RawExtractionPayload } from "@/server/extraction/schema";
import { runOCR } from "@/server/preprocessing/run-ocr";
import { detectRuleSignals } from "@/server/signals/detectors/rule-signals";
import type { ExtractedEntity, ExtractionResult, PreprocessedEvidence } from "@/types/analysis";

function mapExtraction(raw: RawExtractionPayload): ExtractionResult {
  return {
    caseType: raw.case_type,
    summary: raw.summary,
    requestedAction: raw.requested_action,
    narrativeTheme: raw.narrative_theme,
    actor: raw.actor,
    threat: raw.threat,
    paymentReason: raw.payment_reason,
    urgency: raw.urgency,
    entities: raw.entities.filter((entity): entity is ExtractedEntity => Boolean(entity.type && entity.value)),
    signals: raw.signals,
    uncertainties: raw.uncertainties,
    probablePattern: raw.probable_pattern,
    suggestedFollowupQuestion: raw.suggested_followup_question,
    behavioralVectors: {
      asymmetricRiskDemand: raw.behavioral_vectors.asymmetric_risk_demand,
      artificialTimePressure: raw.behavioral_vectors.artificial_time_pressure,
      trustManipulationExcuse: raw.behavioral_vectors.trust_manipulation_excuse,
      standardProcessBypass: raw.behavioral_vectors.standard_process_bypass,
      credentialPhishingDisguise: raw.behavioral_vectors.credential_phishing_disguise,
      justificationCoherence: raw.behavioral_vectors.justification_coherence,
      reasoning: raw.behavioral_vectors.reasoning,
    },
  };
}

function inferCaseType(text: string, ruleSignals: string[]) {
  const lower = text.toLowerCase();

  if (ruleSignals.includes("bank_impersonation") || ruleSignals.includes("asks_for_otp")) {
    return "bank_support";
  }

  if (ruleSignals.includes("authority_impersonation") || ruleSignals.includes("threatens_arrest")) {
    return "authority_extortion";
  }

  if (
    ruleSignals.includes("platform_bypass") ||
    lower.includes("mercado libre") ||
    lower.includes("vendedor") ||
    /\b(vendo|vend[oé]|comprar|comprador|seña|producto|entregame|entreg[oá])\b/i.test(lower)
  ) {
    return "online_purchase";
  }

  if (ruleSignals.includes("family_impersonation") || ruleSignals.includes("new_number_claim")) {
    return "family_money";
  }

  return "mixed";
}

function inferRequestedAction(ruleSignals: string[]) {
  if (ruleSignals.includes("asks_for_otp")) {
    return "share_otp";
  }

  if (ruleSignals.includes("asks_for_credentials")) {
    return "share_credentials";
  }

  if (ruleSignals.includes("transfer_request")) {
    return "transfer_money";
  }

  if (ruleSignals.includes("deposit_request")) {
    return "pay_deposit";
  }

  if (ruleSignals.includes("suspicious_link")) {
    return "follow_link";
  }

  return "unknown";
}

function buildEvidenceContext(preprocessedEvidence: PreprocessedEvidence[]) {
  const screenshots = preprocessedEvidence.filter((item) => item.evidenceType === "screenshot");
  const urls = preprocessedEvidence
    .filter((item) => item.evidenceType === "url")
    .map((item) => item.rawText)
    .filter((value): value is string => Boolean(value));
  const phones = preprocessedEvidence
    .filter((item) => item.evidenceType === "phone")
    .map((item) => item.rawText)
    .filter((value): value is string => Boolean(value));

  return [
    `Capturas adjuntas: ${screenshots.length}.`,
    urls.length ? `URLs provistas por el usuario: ${urls.join(" | ")}` : "No hay URLs explícitas provistas por el usuario.",
    phones.length ? `Teléfonos provistos por el usuario: ${phones.join(" | ")}` : "No hay teléfonos explícitos provistos por el usuario.",
    screenshots.length
      ? "Si las capturas muestran chats, perfiles, barras de navegador, comprobantes o branding, incorporá esa evidencia al análisis."
      : "No hay imágenes para inspección visual.",
  ].join("\n");
}

async function buildFallbackMergedText(
  mergedCaseText: string,
  preprocessedEvidence: PreprocessedEvidence[],
) {
  const chunks = [mergedCaseText];

  for (const evidence of preprocessedEvidence) {
    if (evidence.evidenceType !== "screenshot" || !evidence.binaryContent) {
      continue;
    }

    if (evidence.normalizedText) {
      chunks.push(evidence.normalizedText);
      continue;
    }

    try {
      const ocrText = await runOCR(evidence.binaryContent);
      if (ocrText) {
        evidence.normalizedText = ocrText;
        chunks.push(ocrText);
        await updateEvidenceRecord(evidence.sourceId, { ocr_text: ocrText });
      }
    } catch (error) {
      logger.warn({ err: error, evidenceId: evidence.sourceId }, "OCR fallback failed for screenshot evidence");
    }
  }

  return chunks.filter(Boolean).join("\n\n").trim() || mergedCaseText;
}

function fallbackExtraction(mergedCaseText: string): ExtractionResult {
  const ruleSignals = detectRuleSignals(mergedCaseText).map((signal) => signal.code);
  const caseType = inferCaseType(mergedCaseText, ruleSignals);
  const requestedAction = inferRequestedAction(ruleSignals);
  const behavioralVectors = inferBehavioralVectors({
    text: mergedCaseText,
    signalCodes: ruleSignals,
    requestedAction,
  });

  return {
    caseType,
    summary:
      mergedCaseText.length > 220
        ? `${mergedCaseText.slice(0, 217).trim()}...`
        : mergedCaseText || "No hubo suficiente texto para extraer un resumen más claro.",
    requestedAction,
    narrativeTheme:
      caseType === "online_purchase"
        ? "marketplace_bypass"
        : caseType === "bank_support"
          ? "bank_support"
          : caseType === "family_money"
            ? "family_urgency"
            : caseType === "authority_extortion"
              ? "authority_pressure"
              : "unknown",
    actor:
      caseType === "bank_support"
        ? "bank"
        : caseType === "authority_extortion"
          ? "authority"
          : caseType === "family_money"
            ? "family"
            : caseType === "online_purchase"
              ? "seller"
              : "unknown",
    threat: ruleSignals.includes("threatens_arrest")
      ? "arrest_or_search"
      : ruleSignals.includes("bank_impersonation")
        ? "account_block"
        : ruleSignals.includes("price_too_good") ||
            behavioralVectors.asymmetricRiskDemand === "high" ||
            behavioralVectors.standardProcessBypass === "high"
          ? "product_loss"
          : ruleSignals.includes("family_impersonation")
            ? "family_emergency"
            : "none",
    paymentReason: ruleSignals.includes("bribery_request")
      ? "avoid_consequences"
      : ruleSignals.includes("deposit_request")
        ? "reserve_product"
        : "unknown",
    urgency:
      ruleSignals.includes("urgent_transfer") ||
      ruleSignals.includes("urgency_language") ||
      behavioralVectors.artificialTimePressure === "high"
        ? "high"
        : "medium",
    entities: [],
    signals: ruleSignals.map((code) => ({ code, confidence: 0.72 })),
    uncertainties: ["No se pudo usar extracción estructurada avanzada; el análisis se apoya más en reglas."],
    probablePattern: null,
    suggestedFollowupQuestion:
      caseType === "online_purchase"
        ? "¿Te pidieron pagar por fuera de la plataforma?"
        : caseType === "family_money"
          ? "¿Ya conocías ese número?"
          : caseType === "bank_support"
            ? "¿Te pidieron un código de verificación?"
            : null,
    behavioralVectors,
  };
}

export async function runGeminiExtraction(input: {
  mergedCaseText: string;
  preprocessedEvidence: PreprocessedEvidence[];
}) {
  if (!process.env.GEMINI_API_KEY) {
    const fallbackText = await buildFallbackMergedText(input.mergedCaseText, input.preprocessedEvidence);
    return {
      extraction: fallbackExtraction(fallbackText),
      rawResponse: null,
      promptVersion: EXTRACTION_PROMPT_VERSION,
      usedFallback: true,
    };
  }

  try {
    const prompt = buildExtractionPrompt({
      mergedCaseText: input.mergedCaseText,
      evidenceContext: buildEvidenceContext(input.preprocessedEvidence),
    });
    const response = await callGeminiForExtraction({
      prompt,
      images: input.preprocessedEvidence
        .filter((evidence) => evidence.evidenceType === "screenshot" && evidence.binaryContent)
        .map((evidence) => ({
          mimeType: evidence.contentType ?? "image/png",
          dataBase64: evidence.binaryContent!.toString("base64"),
        })),
    });
    const parsed = extractionSchema.parse(JSON.parse(response.text));
    const mapped = mapExtraction(parsed);
    const signalCodes = [
      ...mapped.signals.map((signal) => signal.code),
      ...detectRuleSignals(input.mergedCaseText).map((signal) => signal.code),
    ];
    mapped.behavioralVectors = enforceBehavioralVectorFloors({
      detected: mapped.behavioralVectors,
      text: input.mergedCaseText,
      signalCodes,
      requestedAction: mapped.requestedAction,
    });

    return {
      extraction: mapped,
      rawResponse: response.rawResponse,
      promptVersion: EXTRACTION_PROMPT_VERSION,
      usedFallback: false,
    };
  } catch (error) {
    logger.warn({ err: error }, "Gemini extraction failed, using deterministic fallback");
    const fallbackText = await buildFallbackMergedText(input.mergedCaseText, input.preprocessedEvidence);
    return {
      extraction: fallbackExtraction(fallbackText),
      rawResponse: null,
      promptVersion: EXTRACTION_PROMPT_VERSION,
      usedFallback: true,
    };
  }
}
