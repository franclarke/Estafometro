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

  await page.route("**/api/cases/demo-public-id/events", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        data: {
          tracked: true,
        },
      }),
    });
  });

  await page.route("**/api/cases/demo-public-id/followups", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        data: {
          caseId: "demo-case-id",
          publicId: "demo-public-id",
          status: "partial",
          analysisRunId: "demo-reanalysis-id",
        },
      }),
    });
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /dudas sobre un mensaje/i })).toBeVisible();
  await expect(page.getByLabel(/Mensaje o situaci/i)).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(1);
  await expect(page.getByText(/No pegues claves/i)).toBeVisible();

  await page
    .getByLabel(/Mensaje o situaci/i)
    .fill("Me pidieron una transferencia urgente por WhatsApp desde un numero nuevo y me mandaron un link.");
  await page.getByRole("button", { name: "Revisar riesgo" }).click();

  await page.waitForURL("**/caso/demo-public-id/resultado");
  await expect(page.getByText(/El caso muestra/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Que hacer ahora" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Que no hacer" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copiar resultado" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Completar con 1 dato mas" })).toBeVisible();
  await page.getByRole("button", { name: "Si" }).first().click();
  await page.getByRole("button", { name: "Revisar con este dato" }).click();

  await page.getByText("Contar si esta orientacion ayudo").click();
  await page.getByRole("button", { name: "Si, me ayudo" }).click();
  await page.getByRole("button", { name: "Enviar feedback" }).click();
  await expect(page.getByText("Gracias por el feedback.")).toBeVisible();
});
