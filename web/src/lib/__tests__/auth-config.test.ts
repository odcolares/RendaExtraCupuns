import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    verificationToken: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/password", () => ({
  verifyPassword: vi.fn().mockResolvedValue(true),
}));

import { authConfig, EMAIL_NOT_VERIFIED_MESSAGE } from "@/lib/auth.config";
import { verifyPassword } from "@/lib/password";

// O provider Credentials expõe o authorize real em `options` (o parseProviders
// do Auth.js faz merge de `options` no provider em runtime).
const provider = authConfig.providers[0] as unknown as {
  options: {
    authorize: (credentials: Record<string, string>) => Promise<unknown>;
  };
};
const authorize = provider.options.authorize;

const verifiedUser = {
  id: "user_1",
  email: "teste@example.com",
  name: "Teste",
  password: "hashed",
  role: "client",
  emailVerified: new Date(),
  tenantId: "tenant_1",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("auth.config authorize (C3 — bloqueio de login por e-mail não verificado)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyPassword).mockResolvedValue(true);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(verifiedUser as never);
  });

  it("usuário verificado → retorna o usuário", async () => {
    const user = await authorize({ email: "teste@example.com", password: "123456" });

    expect(user).toEqual(
      expect.objectContaining({
        id: "user_1",
        email: "teste@example.com",
        name: "Teste",
        role: "client",
        tenantId: "tenant_1",
      })
    );
  });

  it("usuário com emailVerified null → lança a mensagem de verificação", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...verifiedUser,
      emailVerified: null,
    } as never);

    await expect(
      authorize({ email: "teste@example.com", password: "123456" })
    ).rejects.toThrow(EMAIL_NOT_VERIFIED_MESSAGE);
  });

  it("senha incorreta → lança Credenciais inválidas (antes da checagem de verificação)", async () => {
    vi.mocked(verifyPassword).mockResolvedValue(false);

    await expect(
      authorize({ email: "teste@example.com", password: "errada" })
    ).rejects.toThrow("Credenciais inválidas.");
  });

  it("sem credenciais → lança erro de obrigatoriedade", async () => {
    await expect(authorize({} as Record<string, string>)).rejects.toThrow(
      "Email e senha são obrigatórios."
    );
  });
});