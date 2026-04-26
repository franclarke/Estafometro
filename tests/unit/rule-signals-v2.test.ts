import { describe, expect, it } from "vitest";

import { detectRuleSignals } from "@/server/signals/detectors/rule-signals";

function codes(text: string) {
  return detectRuleSignals(text).map((signal) => signal.code);
}

describe("rule signal detector V2 calibration", () => {
  it("detects deposit variants", () => {
    expect(codes("Mandame una sena y te lo guardo hasta la tarde.")).toEqual(
      expect.arrayContaining(["deposit_request", "scarcity_pressure"]),
    );
  });

  it("detects safe payment flows", () => {
    expect(codes("Nos vemos en una plaza y pago al retirar.")).toContain("payment_on_delivery_available");
  });

  it("detects official platform interaction", () => {
    expect(codes("Hacemos la compra dentro de la plataforma con checkout oficial.")).toContain(
      "official_platform_interaction",
    );
  });

  it("does not flag generic bank delay as bank impersonation", () => {
    const detected = codes("Te mande comprobante, el banco demora pero entregame igual.");

    expect(detected).not.toContain("bank_impersonation");
    expect(detected).toContain("unconfirmed_payment_pressure");
  });

  it("suppresses generic pay wording when payment is on pickup", () => {
    const detected = codes("El vendedor acepta vernos y pagar al retirar.");

    expect(detected).toContain("payment_on_delivery_available");
    expect(detected).not.toContain("transfer_request");
  });
});
