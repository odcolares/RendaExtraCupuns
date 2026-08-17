import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const SALT_ROUNDS = 10;

export type TokenPurpose = "reset" | "verify";

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export async function hashToken(raw: string): Promise<string> {
  return bcrypt.hash(raw, SALT_ROUNDS);
}

export async function verifyTokenHash(
  raw: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(raw, hash);
}

/**
 * Cria um token de verificação no banco, armazenado HASHED (bcrypt).
 * O `identifier` composto `"<purpose>:<userId>"` (ex: `reset:cm...`,
 * `verify:cm...`) discrimina os fluxos de reset e de verificação de e-mail
 * (C2 × C3), evitando colisão de tokens entre eles.
 *
 * @returns o token RAW (a ser enviado por e-mail) — o hash é que fica no banco.
 */
export async function createVerificationToken(
  userId: string,
  purpose: TokenPurpose,
  expiresInMs = 3_600_000
): Promise<string> {
  const raw = generateToken();
  const tokenHash = await hashToken(raw);

  await prisma.verificationToken.create({
    data: {
      identifier: `${purpose}:${userId}`,
      token: tokenHash,
      expires: new Date(Date.now() + expiresInMs),
    },
  });

  return raw;
}

export interface VerificationTokenInfo {
  userId: string;
  expires: Date;
}

/**
 * Busca um token RAW e valida: purpose, userId (se fornecido) e expiração.
 *
 * NOTA: bcrypt é salgado — re-hash do raw NUNCA reproduz o hash armazenado;
 * por isso a busca é por prefixo do identifier (purpose) + bcrypt.compare.
 */
export async function findVerificationToken(
  purpose: TokenPurpose,
  userIdOrNull: string | null,
  rawToken: string
): Promise<VerificationTokenInfo | null> {
  const prefix = `${purpose}:`;
  const records = await prisma.verificationToken.findMany({
    where: { identifier: { startsWith: prefix } },
  });

  for (const record of records) {
    if (!record.identifier.startsWith(prefix)) continue;
    const userId = record.identifier.slice(prefix.length);
    if (userIdOrNull !== null && userId !== userIdOrNull) continue;
    if (record.expires.getTime() <= Date.now()) continue;
    if (await verifyTokenHash(rawToken, record.token)) {
      return { userId, expires: record.expires };
    }
  }

  return null;
}