import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";

// Mock do Prisma (override do setup.ts — inclui os métodos usados pela rota)
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    verificationToken: {
      create: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

// Token fake — a rota só precisa do raw para montar o link do e-mail
vi.mock("@/lib/tokens", () => ({
  createVerificationToken: vi.fn().mockResolvedValue("raw-token-abc"),
}));

// E-mail mockado — nenhum teste envia e-mail real
vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn().mockResolvedValue({ ok: true }),
}));

import { POST } from "../route";
import { createVerificationToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/email";

function post(body: unknown): Promise<Response> {
  return POST(
    new Request("http://localhost/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

const EXISTING_USER = {
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

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
  });

  it("email existente → 200 genérico + token criado + sendEmail com link /reset-password?token=", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(EXISTING_USER);

    const res = await post({ email: "teste@example.com" });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.error).toBeNull();
    expect(body.message).toContain("Se o email existir");

    expect(createVerificationToken).toHaveBeenCalledWith("user_1", "reset");
    expect(sendEmail).toHaveBeenCalledTimes(1);
    const emailCall = vi.mocked(sendEmail).mock.calls[0][0];
    expect(emailCall.to).toBe("teste@example.com");
    expect(emailCall.html).toContain("/reset-password?token=raw-token-abc");
  });

  it("email inexistente → 200 genérico SEM token e SEM sendEmail (nunca 404)", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const res = await post({ email: "nao-existe@example.com" });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.error).toBeNull();
    expect(body.message).toContain("Se o email existir");

    expect(createVerificationToken).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("email ausente → 200 genérico (anti-enumeração, nunca 404)", async () => {
    const res = await post({});

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toContain("Se o email existir");
    expect(createVerificationToken).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("falha no envio de e-mail NÃO falha a resposta (200 genérico)", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(EXISTING_USER);
    vi.mocked(sendEmail).mockRejectedValueOnce(new Error("resend down"));

    const res = await post({ email: "teste@example.com" });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toContain("Se o email existir");
  });
});