import { expect, test } from "@playwright/test";

test("landing to intake to result demo flow", async ({ page }) => {
  await page.route("**/api/cases", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        data: {
          caseId: "demo-case-id",
          publicId: "demo-public-id",
          status: "received",
        },
      }),
    });
  });

  await page.route("**/api/cases/demo-public-id/analyze", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        data: {
          caseId: "demo-case-id",
          publicId: "demo-public-id",
          status: "partial",
          analysisRunId: "demo-analysis-id",
        },
      }),
    });
  });

  await page.route("**/api/cases/demo-public-id/feedback", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        data: {
          feedbackId: "feedback-demo-id",
        },
      }),
    });
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "¿Tenés dudas sobre un mensaje?" })).toBeVisible();
  await expect(page.getByLabel("Mensaje o situación sospechosa")).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(1);
  await expect(page.getByText("No pegues claves, códigos de verificación, DNI completo ni datos de tarjeta.")).toBeVisible();

  await page
    .getByLabel("Mensaje o situación sospechosa")
    .fill("Me pidieron una transferencia urgente por WhatsApp desde un número nuevo y me mandaron un link.");
  await page.getByRole("button", { name: "Revisar riesgo" }).click();

  await page.waitForURL("**/caso/demo-public-id/resultado");
  await expect(page.getByRole("heading", { name: "Orientación del caso" })).toBeVisible();
  await expect(page.getByText("El caso muestra señales de apuro y conviene frenar antes de transferir o compartir datos.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Qué hacer ahora" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Qué no hacer" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copiar resultado" })).toBeVisible();

  await page.getByText("Contar si esta orientación ayudó").click();
  await page.getByRole("button", { name: "Sí, me ayudó" }).click();
  await expect(page.getByText("Gracias por el feedback.")).toBeVisible();
});
