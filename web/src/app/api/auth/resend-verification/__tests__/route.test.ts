import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

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

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn().mockResolvedValue({ ok: true }),
}));

import { POST } from "../route";

function post(body: unknown): Promise<Response> {
  return POST(
    new Request("http://localhost/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

describe("POST /api/auth/resend-verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("usuário não verificado → 200 e envia novo e-mail com link", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user_1",
      email: "teste@example.com",
      emailVerified: null,
    } as never);

    const res = await post({ email: "teste@example.com" });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toContain("Se o email existir");

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

  it("usuário já verificado → 200 sem enviar e-mail", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user_1",
      email: "teste@example.com",
      emailVerified: new Date(),
    } as never);

    const res = await post({ email: "teste@example.com" });

    expect(res.status).toBe(200);
    expect(sendEmail).not.toHaveBeenCalled();
    expect(prisma.verificationToken.create).not.toHaveBeenCalled();
  });

  it("email desconhecido → 200 sem enviar e-mail (anti-enumeração)", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const res = await post({ email: "nao-existe@example.com" });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toContain("Se o email existir");
    expect(sendEmail).not.toHaveBeenCalled();
    expect(prisma.verificationToken.create).not.toHaveBeenCalled();
  });

  it("sem email no body → 200 genérico sem enviar e-mail", async () => {
    const res = await post({});

    expect(res.status).toBe(200);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });
});