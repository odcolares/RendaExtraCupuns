import { vi } from "vitest";

// Mock do SDK Resend — nenhum teste envia e-mail real.
// O `send` compartilhado permite aos testes inspecionar as chamadas.
vi.mock("resend", () => {
  const send = vi.fn().mockResolvedValue({ data: { id: "mock-email-id" }, error: null });
  class ResendMock {
    emails = { send };
  }
  return { Resend: ResendMock };
});

// Mock do Prisma — nenhum teste toca o Turso real.
vi.mock("@/lib/prisma", () => ({
  prisma: {
    verificationToken: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
  },
}));