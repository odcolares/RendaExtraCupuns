import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// next/link exige contexto do App Router — renderiza como <a> simples no teste
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => React.createElement("a", { href, ...rest }, children),
}));

import PrivacidadePage from "../page";

describe("Página /privacidade", () => {
  it("renderiza sem erro e contém o conteúdo LGPD esperado", () => {
    const html = renderToStaticMarkup(React.createElement(PrivacidadePage));

    expect(html).toContain("Política de Privacidade");
    expect(html).toContain("Lei nº 13.709/2018");
    expect(html).toContain("art. 18");
    expect(html).toContain("Stripe");
    expect(html).toContain("Resend");
    expect(html).toContain("Vercel");
    expect(html).toContain("Turso");
    expect(html).toContain("30 dias");
    expect(html).toContain("href=\"/termos\"");
    expect(html).toContain("href=\"/\"");
  });
});