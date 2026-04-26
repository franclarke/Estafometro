import { describe, expect, it } from "vitest";

import { buildActionPlan } from "@/server/explanations/build-action-plan";
import { buildFollowupQuestions } from "@/server/explanations/build-followup-questions";
import type { NormalizedSignal } from "@/types/analysis";

function signal(code: string, severity: NormalizedSignal["severity"] = "medium") {
  return { code, severity };
}

describe("buildActionPlan", () => {
  it("creates a hard-stop action for very high risk", () => {
    const plan = buildActionPlan({
      riskLevel: "very_high",
      caseType: "authority_extortion",
      signals: [signal("threatens_arrest", "critical"), signal("transfer_request")],
    });

    expect(plan.primaryAction).toContain("no pagues");
    expect(plan.steps.join(" ")).toContain("No negocies bajo amenaza");
    expect(plan.avoid.join(" ")).toContain("No pagues multas");
  });

  it("adds OTP-specific steps for credential risks", () => {
    const plan = buildActionPlan({
      riskLevel: "high",
      caseType: "bank_support",
      signals: [signal("asks_for_otp", "critical")],
    });

    expect(plan.steps[0]).toContain("No compartas");
    expect(plan.verification.join(" ")).toContain("cambia credenciales");
  });

  it("never presents low risk as safe", () => {
    const plan = buildActionPlan({
      riskLevel: "low",
      caseType: "mixed",
      signals: [],
    });

    expect(plan.primaryAction.toLowerCase()).not.toContain("seguro");
    expect(plan.primaryAction).toContain("verificar");
  });
});

describe("buildFollowupQuestions", () => {
  it("caps deterministic follow-up questions at three", () => {
    const questions = buildFollowupQuestions({
      caseType: "online_purchase",
      signals: [],
      uncertainties: ["No se confirmo identidad.", "Falta link."],
      suggestedFollowupQuestion: "Tenes el alias o link?",
    });

    expect(questions).toHaveLength(3);
    expect(questions[0]?.id).toBe("paid_off_platform");
  });
});
