import type { FollowupQuestion, NormalizedSignal } from "@/types/analysis";

function pushUnique(questions: FollowupQuestion[], question: FollowupQuestion) {
  if (!questions.some((item) => item.id === question.id)) {
    questions.push(question);
  }
}

export function buildFollowupQuestions(input: {
  caseType: string | null;
  signals: Array<Pick<NormalizedSignal, "code">>;
  uncertainties: string[];
  suggestedFollowupQuestion?: string | null;
}) {
  const codes = new Set(input.signals.map((signal) => signal.code));
  const questions: FollowupQuestion[] = [];

  if (input.caseType === "online_purchase" && !codes.has("off_platform_payment")) {
    pushUnique(questions, {
      id: "paid_off_platform",
      label: "Te pidieron pagar o seguir la charla por fuera de la plataforma original?",
      type: "yes_no",
      reason: "Eso puede cambiar mucho el riesgo en compras online.",
    });
  }

  if ((input.caseType === "bank_support" || codes.has("bank_impersonation")) && !codes.has("asks_for_otp")) {
    pushUnique(questions, {
      id: "asked_for_code",
      label: "Te pidieron un codigo de SMS, WhatsApp, mail, token o app bancaria?",
      type: "yes_no",
      reason: "Los pedidos de codigos son una senal critica.",
    });
  }

  if (input.caseType === "family_money" && !codes.has("family_impersonation")) {
    pushUnique(questions, {
      id: "known_previous_number",
      label: "Pudiste confirmar por otro numero que era realmente esa persona?",
      type: "yes_no",
      reason: "Confirmar por un canal previo ayuda a bajar incertidumbre.",
    });
  }

  if (
    (input.caseType === "authority_extortion" || codes.has("authority_impersonation")) &&
    !codes.has("threatens_arrest")
  ) {
    pushUnique(questions, {
      id: "threatened_legal_consequence",
      label: "Te amenazaron con arresto, denuncia, allanamiento o una causa si no pagabas?",
      type: "yes_no",
      reason: "Las amenazas legales con pedido de pago cambian el piso de riesgo.",
    });
  }

  if (!codes.has("transfer_request") && !codes.has("deposit_request") && !codes.has("advance_payment_request")) {
    pushUnique(questions, {
      id: "requested_money",
      label: "Te pidieron transferir, pagar una sena o enviar dinero de alguna forma?",
      type: "yes_no",
      reason: "El pedido de dinero ayuda a distinguir riesgo bajo, medio y alto.",
    });
  }

  if (input.suggestedFollowupQuestion) {
    pushUnique(questions, {
      id: "llm_suggested_context",
      label: input.suggestedFollowupQuestion,
      type: "short_text",
      reason: "Ese dato puede aclarar una incertidumbre del analisis.",
    });
  }

  if (input.uncertainties.length > 0 && questions.length < 3) {
    pushUnique(questions, {
      id: "missing_context",
      label: "Hay algun dato clave que no pegaste, como alias, link, monto, usuario o telefono?",
      type: "short_text",
      reason: "Mas contexto puede mejorar la explicacion sin guardar datos sensibles innecesarios.",
    });
  }

  return questions.slice(0, 3);
}
