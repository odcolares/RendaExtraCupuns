import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";

// Mock do Prisma (override do setup.ts — inclui os métodos usados pela rota)
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      update: vi.fn(),
    },
    verificationToken: {
      create: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

// bcrypt é lento — hash fake suficiente para a rota
vi.mock("@/lib/password", () => ({
  hashPassword: vi.fn().mockResolvedValue("hashed-password"),
  verifyPassword: vi.fn().mockResolvedValue(true),
}));

// findVerificationToken mockado — a validação de hash/expiração é coberta
// pelos testes de web/src/lib/__tests__/tokens.test.ts
vi.mock("@/lib/tokens", () => ({
  findVerificationToken: vi.fn(),
}));

import { POST } from "../route";
import { findVerificationToken } from "@/lib/tokens";
import { hashPassword, verifyPassword } from "@/lib/password";

function post(body: unknown): Promise<Response> {
  return POST(
    new Request("http://localhost/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

const UPDATED_USER = {
  id: "user_1",
  name: "Teste",
  email: "teste@example.com",
  password: "hashed-password",
  role: "client" as const,
  emailVerified: null,
  consentAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  tenantId: "tenant_1",
};

const VALID_TOKEN_INFO = {
  userId: "user_1",
  expires: new Date(Date.now() + 60_000),
};

describe("POST /api/auth/reset-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(findVerificationToken).mockResolvedValue(VALID_TOKEN_INFO);
    vi.mocked(prisma.user.update).mockResolvedValue(UPDATED_USER);
  });

  it("token válido → 200, senha atualizada com hash novo e token deletado (uso único)", async () => {
    const res = await post({ token: "raw-token-abc", password: "nova-senha-123" });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toContain("Senha atualizada");

    expect(hashPassword).toHaveBeenCalledWith("nova-senha-123");
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: { password: "hashed-password" },
    });
    expect(prisma.verificationToken.deleteMany).toHaveBeenCalledWith({
      where: { identifier: "reset:user_1" },
    });

    // A nova senha confere contra o hash armazenado (mock)
    expect(await verifyPassword("nova-senha-123", "hashed-password")).toBe(true);
  });

  it("token inválido → 400 genérico, NÃO atualiza senha e NÃO deleta token", async () => {
    vi.mocked(findVerificationToken).mockResolvedValue(null);

    const res = await post({ token: "token-invalido", password: "nova-senha-123" });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Link inválido ou expirado");

    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.verificationToken.deleteMany).not.toHaveBeenCalled();
  });

  it("senha com 5 caracteres → 400 mesmo com token válido", async () => {
    const res = await post({ token: "raw-token-abc", password: "12345" });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("pelo menos 6 caracteres");

    expect(findVerificationToken).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.verificationToken.deleteMany).not.toHaveBeenCalled();
  });

  it("token ausente → 400 genérico", async () => {
    const res = await post({ password: "nova-senha-123" });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Link inválido ou expirado");
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});