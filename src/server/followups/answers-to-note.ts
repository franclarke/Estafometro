const yesNoLabels: Record<string, string> = {
  yes: "si",
  no: "no",
  unknown: "no se",
};

const positiveContext: Record<string, string> = {
  paid_off_platform:
    "El usuario aclaro que si le pidieron pagar o seguir la conversacion por fuera de la plataforma original.",
  asked_for_code:
    "El usuario aclaro que si le pidieron un codigo de SMS, WhatsApp, mail, token o app bancaria.",
  known_previous_number:
    "El usuario aclaro que si pudo verificar la identidad por otro numero o canal previo.",
  threatened_legal_consequence:
    "El usuario aclaro que si lo amenazaron con arresto, denuncia, allanamiento o una causa si no pagaba.",
  requested_money:
    "El usuario aclaro que si le pidieron transferir, pagar una sena o enviar dinero.",
};

const negativeContext: Record<string, string> = {
  paid_off_platform:
    "El usuario aclaro que no le pidieron pagar ni seguir la conversacion por fuera de la plataforma original.",
  asked_for_code:
    "El usuario aclaro que no le pidieron codigos de SMS, WhatsApp, mail, token ni app bancaria.",
  known_previous_number:
    "El usuario aclaro que no pudo verificar la identidad por otro numero o canal previo.",
  threatened_legal_consequence:
    "El usuario aclaro que no lo amenazaron con arresto, denuncia, allanamiento ni una causa.",
  requested_money:
    "El usuario aclaro que no le pidieron transferir, pagar una sena ni enviar dinero.",
};

export interface FollowupAnswerInput {
  questionId: string;
  answer: string;
}

export function buildFollowupEvidenceNote(answers: FollowupAnswerInput[]) {
  return answers
    .map((item) => {
      const answer = item.answer.trim();
      if (answer === "yes" && positiveContext[item.questionId]) {
        return positiveContext[item.questionId];
      }
      if (answer === "no" && negativeContext[item.questionId]) {
        return negativeContext[item.questionId];
      }
      if (answer === "unknown") {
        return `El usuario no sabe responder la repregunta ${item.questionId}.`;
      }

      const label = yesNoLabels[answer] ?? answer;
      return `Respuesta del usuario a ${item.questionId}: ${label}`;
    })
    .join("\n");
}
