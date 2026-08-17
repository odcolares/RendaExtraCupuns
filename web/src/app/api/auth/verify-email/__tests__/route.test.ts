import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";

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

import { POST } from "../route";

function post(body: unknown): Promise<Response> {
  return POST(
    new Request("http://localhost/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

describe("POST /api/auth/verify-email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.user.update).mockResolvedValue({
      id: "user_1",
      email: "teste@example.com",
      emailVerified: new Date(),
    } as never);
  });

  it("token válido → 200, emailVerified setado e token deletado", async () => {
    const raw = "raw-verify-token";
    const hash = await hashToken(raw);
    vi.mocked(prisma.verificationToken.findMany).mockResolvedValue([
      {
        identifier: "verify:user_1",
        token: hash,
        expires: new Date(Date.now() + 60_000),
      },
    ]);

    const res = await post({ token: raw });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toContain("Email verificado");

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: { emailVerified: expect.any(Date) },
    });
    expect(prisma.verificationToken.deleteMany).toHaveBeenCalledWith({
      where: { identifier: "verify:user_1" },
    });
  });

  it("token inválido → 400 com mensagem genérica", async () => {
    const hash = await hashToken("other-token");
    vi.mocked(prisma.verificationToken.findMany).mockResolvedValue([
      {
        identifier: "verify:user_1",
        token: hash,
        expires: new Date(Date.now() + 60_000),
      },
    ]);

    const res = await post({ token: "wrong-token" });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Link inválido ou expirado");
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("token expirado → 400 e NÃO seta emailVerified", async () => {
    const raw = "raw-verify-token";
    const hash = await hashToken(raw);
    vi.mocked(prisma.verificationToken.findMany).mockResolvedValue([
      {
        identifier: "verify:user_1",
        token: hash,
        expires: new Date(Date.now() - 1_000),
      },
    ]);

    const res = await post({ token: raw });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Link inválido ou expirado");
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.verificationToken.deleteMany).not.toHaveBeenCalled();
  });

  it("sem token no body → 400", async () => {
    const res = await post({});

    expect(res.status).toBe(400);
    expect(prisma.verificationToken.findMany).not.toHaveBeenCalled();
  });
});