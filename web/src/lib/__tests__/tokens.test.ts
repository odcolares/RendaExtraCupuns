import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createVerificationToken,
  findVerificationToken,
  generateToken,
  hashToken,
  verifyTokenHash,
} from "@/lib/tokens";

describe("tokens", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generateToken returns a 64-char hex string, unique per call", () => {
    const token = generateToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(generateToken()).not.toBe(token);
  });

  it("hashToken/verifyTokenHash roundtrip", async () => {
    const raw = generateToken();
    const hash = await hashToken(raw);

    expect(hash).not.toBe(raw);
    expect(await verifyTokenHash(raw, hash)).toBe(true);
    expect(await verifyTokenHash("wrong-token", hash)).toBe(false);
  });

  it("createVerificationToken stores a HASHED token with composite identifier", async () => {
    const raw = await createVerificationToken("cm-user-1", "reset");

    expect(raw).toMatch(/^[0-9a-f]{64}$/);
    expect(prisma.verificationToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        identifier: "reset:cm-user-1",
        // o token armazenado NUNCA é o raw (bcrypt hash, não hex de 64 chars)
        token: expect.not.stringMatching(/^[0-9a-f]{64}$/),
        expires: expect.any(Date),
      }),
    });
  });

  it("createVerificationToken honors custom expiry", async () => {
    await createVerificationToken("cm-user-2", "verify", 60_000);

    const call = vi.mocked(prisma.verificationToken.create).mock.calls[0][0];
    const expires = call.data.expires as Date;
    const remaining = expires.getTime() - Date.now();
    expect(remaining).toBeGreaterThan(50_000);
    expect(remaining).toBeLessThanOrEqual(60_000);
  });

  it("findVerificationToken returns userId+expires for a valid token", async () => {
    const raw = "raw-token-abc";
    const hash = await hashToken(raw);
    const expires = new Date(Date.now() + 60_000);

    vi.mocked(prisma.verificationToken.findMany).mockResolvedValue([
      { identifier: "reset:cm-user-1", token: hash, expires },
    ]);

    const result = await findVerificationToken("reset", "cm-user-1", raw);
    expect(result).toEqual({ userId: "cm-user-1", expires });
  });

  it("findVerificationToken returns null when purpose does not match", async () => {
    const raw = "raw-token-abc";
    const hash = await hashToken(raw);

    vi.mocked(prisma.verificationToken.findMany).mockResolvedValue([
      {
        identifier: "verify:cm-user-1",
        token: hash,
        expires: new Date(Date.now() + 60_000),
      },
    ]);

    const result = await findVerificationToken("reset", "cm-user-1", raw);
    expect(result).toBeNull();
  });

  it("findVerificationToken returns null when userId does not match", async () => {
    const raw = "raw-token-abc";
    const hash = await hashToken(raw);

    vi.mocked(prisma.verificationToken.findMany).mockResolvedValue([
      {
        identifier: "reset:cm-user-1",
        token: hash,
        expires: new Date(Date.now() + 60_000),
      },
    ]);

    const result = await findVerificationToken("reset", "cm-user-9", raw);
    expect(result).toBeNull();
  });

  it("findVerificationToken returns null for an expired token", async () => {
    const raw = "raw-token-abc";
    const hash = await hashToken(raw);

    vi.mocked(prisma.verificationToken.findMany).mockResolvedValue([
      {
        identifier: "reset:cm-user-1",
        token: hash,
        expires: new Date(Date.now() - 1_000),
      },
    ]);

    const result = await findVerificationToken("reset", "cm-user-1", raw);
    expect(result).toBeNull();
  });

  it("findVerificationToken returns null for a wrong raw token", async () => {
    const hash = await hashToken("other-token");

    vi.mocked(prisma.verificationToken.findMany).mockResolvedValue([
      {
        identifier: "reset:cm-user-1",
        token: hash,
        expires: new Date(Date.now() + 60_000),
      },
    ]);

    const result = await findVerificationToken("reset", "cm-user-1", "raw-token-abc");
    expect(result).toBeNull();
  });
});