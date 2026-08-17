import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("sendEmail", () => {
  let logSpy: ReturnType<typeof vi.spyOn> | undefined;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM;
    // Restaura SOMENTE o spy do console — NÃO usar vi.restoreAllMocks(), que
    // resetaria a implementação do vi.fn() compartilhado do mock de "resend".
    logSpy?.mockRestore();
    logSpy = undefined;
  });

  it("logs the content and resolves ok when RESEND_API_KEY is missing", async () => {
    delete process.env.RESEND_API_KEY;
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const { sendEmail } = await import("@/lib/email");
    const result = await sendEmail({
      to: "user@example.com",
      subject: "Teste",
      html: "<p>oi</p>",
    });

    expect(result.ok).toBe(true);
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("user@example.com")
    );
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Teste"));
  });

  it("calls resend.emails.send with the default from when key is present", async () => {
    process.env.RESEND_API_KEY = "re_test_key";

    const { sendEmail, resend } = await import("@/lib/email");
    const result = await sendEmail({
      to: "user@example.com",
      subject: "Teste",
      html: "<p>oi</p>",
    });

    expect(result.ok).toBe(true);
    expect(vi.mocked(resend.emails.send)).toHaveBeenCalledWith({
      from: "RendaExtraCupuns <onboarding@resend.dev>",
      to: "user@example.com",
      subject: "Teste",
      html: "<p>oi</p>",
    });
  });

  it("uses RESEND_FROM when set", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.RESEND_FROM = "contato@rendaextra.app";

    const { sendEmail, resend } = await import("@/lib/email");
    await sendEmail({ to: "user@example.com", subject: "S", html: "<p>x</p>" });

    expect(vi.mocked(resend.emails.send)).toHaveBeenCalledWith(
      expect.objectContaining({ from: "contato@rendaextra.app" })
    );
  });
});