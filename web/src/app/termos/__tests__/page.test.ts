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

import TermosPage from "../page";

describe("Página /termos", () => {
  it("renderiza sem erro e contém o conteúdo LGPD esperado", () => {
    const html = renderToStaticMarkup(React.createElement(TermosPage));

    expect(html).toContain("Termos de Uso");
    expect(html).toContain("Lei Geral de Proteção de Dados");
    expect(html).toContain("Lei nº 13.709/2018");
    expect(html).toContain("href=\"/privacidade\"");
    expect(html).toContain("href=\"/\"");
  });
});