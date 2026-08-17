import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { slidingWindowRateLimit } from "@/lib/rate-limit";

/**
 * Rate limiting (C4) aplicado pelo proxy.ts nos fluxos de auth.
 *
 * Extraído em módulo próprio (sem importar NextAuth) para ser testável
 * isoladamente no vitest — o proxy.ts importa NextAuth, cujo bundle
 * interno importa `next/server` de forma que o vitest não resolve.
 */

// C4 — Paths de auth sujeitos a rate limit (proteção contra força bruta).
// O proxy tem matcher amplo, então a checagem é por path AQUI dentro
// (não bloqueia dashboard/admin/etc).
export const RATE_LIMITED_PATHS = [
  "/login",
  "/signup",
  "/esqueci-senha",
  "/reset-password",
  "/verificar-email",
  "/api/auth/callback/credentials",
  "/api/auth/signup",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/resend-verification",
] as const;

export const RATE_LIMIT = 10; // tentativas por janela
export const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minuto

const RATE_LIMIT_ERROR_MESSAGE = "Muitas tentativas. Tente novamente em instantes.";

/**
 * Aplica rate limit por IP se o path estiver na lista de auth.
 *
 * @returns NextResponse 429 + Retry-After quando bloqueado, ou null para seguir.
 */
export function applyRateLimit(req: NextRequest): NextResponse | null {
  const { pathname } = req.nextUrl;

  const isRateLimitedPath = RATE_LIMITED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (!isRateLimitedPath) {
    return null;
  }

  // Vercel seta `x-forwarded-for` com o IP real do cliente como PRIMEIRO
  // valor. Nunca confiar no header sozinho (spoofável) — em produção a
  // cadeia vem do proxy da Vercel; sem header, cai em "unknown".
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown";

  const { allowed, retryAfterSeconds } = slidingWindowRateLimit(
    ip,
    RATE_LIMIT,
    RATE_LIMIT_WINDOW_MS
  );

  if (!allowed) {
    return NextResponse.json(
      { error: RATE_LIMIT_ERROR_MESSAGE },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSeconds) },
      }
    );
  }

  return null;
}