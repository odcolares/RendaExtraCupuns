import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";

// Mock do Prisma (override do setup.ts para incluir os métodos usados pela rota)
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
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

// bcrypt é lento — hash fake suficiente para a rota
vi.mock("@/lib/password", () => ({
  hashPassword: vi.fn().mockResolvedValue("hashed-password"),
}));

// E-mail mockado — nenhum teste envia e-mail real
vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn().mockResolvedValue({ ok: true }),
}));

import { POST } from "../route";
import { sendEmail } from "@/lib/email";

function post(body: unknown): Promise<Response> {
  return POST(
    new Request("http://localhost/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: "user_1",
      name: "Teste",
      email: "teste@example.com",
      password: "hashed-password",
      role: "client",
      emailVerified: null,
      consentAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      tenantId: "tenant_1",
    });
  });

  it("rejeita signup SEM consentimento → 400 e NÃO cria usuário", async () => {
    const res = await post({
      name: "Teste",
      email: "teste@example.com",
      password: "123456",
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("aceitar os termos");
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("rejeita consent: false → 400", async () => {
    const res = await post({
      name: "Teste",
      email: "teste@example.com",
      password: "123456",
      consent: false,
    });

    expect(res.status).toBe(400);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("rejeita consent como string \"true\" → 400 (exige boolean)", async () => {
    const res = await post({
      name: "Teste",
      email: "teste@example.com",
      password: "123456",
      consent: "true",
    });

    expect(res.status).toBe(400);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("aceita consent: true → 201 e grava consentAt no create", async () => {
    const res = await post({
      name: "Teste",
      email: "teste@example.com",
      password: "123456",
      consent: true,
    });

    expect(res.status).toBe(201);
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Teste",
          email: "teste@example.com",
          consentAt: expect.any(Date),
        }),
      })
    );
  });

  it("mantém validação de senha curta → 400 mesmo com consent: true", async () => {
    const res = await post({
      name: "Teste",
      email: "teste@example.com",
      password: "12345",
      consent: true,
    });

    expect(res.status).toBe(400);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("após criar o usuário, gera token de verificação e envia e-mail com link", async () => {
    const res = await post({
      name: "Teste",
      email: "teste@example.com",
      password: "123456",
      consent: true,
    });

    expect(res.status).toBe(201);
    expect(prisma.verificationToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        identifier: "verify:user_1",
      }),
    });
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "teste@example.com",
        html: expect.stringContaining("/verificar-email?token="),
      })
    );
  });

  it("falha no envio de e-mail NÃO bloqueia o signup (usuário já criado)", async () => {
    vi.mocked(sendEmail).mockRejectedValueOnce(new Error("resend down"));

    const res = await post({
      name: "Teste",
      email: "teste@example.com",
      password: "123456",
      consent: true,
    });

    expect(res.status).toBe(201);
    expect(prisma.user.create).toHaveBeenCalled();
  });
});
