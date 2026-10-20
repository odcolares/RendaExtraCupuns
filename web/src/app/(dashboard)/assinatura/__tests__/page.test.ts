import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Sessão de admin super-admin SEM tenant (cenário admin@teste.com)
vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: {
      id: "user-admin-1",
      name: "Admin",
      email: "admin@teste.com",
      role: "admin",
      tenantId: null,
    },
    expires: "2099-01-01T00:00:00.000Z",
  }),
}));

// getSubscriptionAction retorna null quando não há tenant (comportamento real)
vi.mock("@/actions/assinatura", () => ({
  getSubscriptionAction: vi.fn().mockResolvedValue(null),
  createCheckoutAction: vi.fn().mockResolvedValue({ url: "/assinatura" }),
  cancelSubscriptionAction: vi.fn().mockResolvedValue({ success: true }),
}));

import AssinaturaPage from "../page";

describe("Página /assinatura — usuário sem tenant", () => {
  it("não lança erro (regressão do HTTP 500) e mostra plano Free", async () => {
    const jsx = await AssinaturaPage();
    const html = renderToStaticMarkup(jsx);

    // Estado Free como fallback — sem throw "Sem tenant"
    expect(html).toContain("Plano Atual");
    expect(html).toContain("Free");
    expect(html).toContain("Grátis");

    // Upgrade continua disponível
    expect(html).toContain("Mudar de Plano");
  });
});
