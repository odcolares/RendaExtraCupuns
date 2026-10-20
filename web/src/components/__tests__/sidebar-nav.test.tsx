import { describe, expect, it, vi, beforeEach } from "vitest";
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

// usePathname exige contexto do App Router — mock controlável por teste
const pathnameMock = vi.fn(() => "/dashboard");
vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
}));

// Stub dos componentes da sidebar (Radix) — o teste valida links/labels, não estilos
vi.mock("@/components/ui/sidebar", () => ({
  SidebarMenu: ({ children }: { children: React.ReactNode }) => (
    <nav>{children}</nav>
  ),
  SidebarMenuItem: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SidebarMenuButton: ({
    render,
    className,
  }: {
    render: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
    className?: string;
  }) => React.cloneElement(render, { className }),
}));

import { SidebarNav } from "../sidebar-nav";

function renderNav(userRole: string, hasTenant: boolean): string {
  return renderToStaticMarkup(
    React.createElement(SidebarNav, { userRole, hasTenant })
  );
}

describe("SidebarNav — matriz de acesso por perfil", () => {
  beforeEach(() => {
    pathnameMock.mockReturnValue("/dashboard");
  });

  it("client com tenant: vê Operação + Conta, sem Admin", () => {
    const html = renderNav("client", true);

    // Home + universais
    expect(html).toContain('href="/dashboard"');
    expect(html).toContain('href="/conta"');
    expect(html).toContain('href="/suporte"');

    // Operação (tenant-scoped)
    expect(html).toContain("Operação");
    expect(html).toContain('href="/ofertas"');
    expect(html).toContain('href="/afiliados"');
    expect(html).toContain('href="/fontes"');
    expect(html).toContain('href="/onboarding"');
    expect(html).toContain('href="/analytics"');
    expect(html).toContain('href="/assinatura"');

    // Nada de Admin
    expect(html).not.toContain('href="/admin"');
    expect(html).not.toContain("Faturamento");
    expect(html).not.toContain("Ofertas Globais");
  });

  it("admin sem tenant: vê Dashboard + Admin + Conta, sem Operação", () => {
    const html = renderNav("admin", false);

    // Home + universais + Admin
    expect(html).toContain('href="/dashboard"');
    expect(html).toContain('href="/conta"');
    expect(html).toContain('href="/suporte"');
    expect(html).toContain("Admin");
    expect(html).toContain('href="/admin"');
    expect(html).toContain('href="/admin/ofertas"');
    expect(html).toContain('href="/admin/faturamento"');
    expect(html).toContain("Faturamento");

    // Sem seção Operação (sem tenant não há dados tenant-scoped)
    expect(html).not.toContain("Operação");
    expect(html).not.toContain('href="/ofertas"');
    expect(html).not.toContain('href="/assinatura"');
    expect(html).not.toContain('href="/analytics"');
  });

  it("admin com tenant: vê todas as seções (Operação + Admin + Conta)", () => {
    const html = renderNav("admin", true);

    expect(html).toContain("Operação");
    expect(html).toContain('href="/ofertas"');
    expect(html).toContain('href="/assinatura"');
    expect(html).toContain("Admin");
    expect(html).toContain('href="/admin"');
    expect(html).toContain('href="/admin/faturamento"');
    expect(html).toContain("Conta");
    expect(html).toContain('href="/conta"');
  });

  it("marca o item ativo baseado no pathname", () => {
    pathnameMock.mockReturnValue("/ofertas");
    const html = renderNav("client", true);

    // Item ativo ganha a classe de destaque
    expect(html).toContain("bg-brand-primary/15");
  });
});
