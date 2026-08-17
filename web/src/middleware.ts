import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { slidingWindowRateLimit } from "@/lib/rate-limit";

/**
 * Rate limiting (C4) — proteção contra força bruta nos fluxos de auth.
 *
 * Edge runtime: este arquivo roda na borda (Vercel Edge) e NÃO pode usar
 * APIs Node (fs, process, etc.) — apenas NextRequest/NextResponse.
 *
 * LIMITAÇÃO (multi-instância): na Vercel serverless cada instância tem seu
 * próprio Map em memória — o limite é por-instância, aceitável para o beta.
 * Upgrade para Upstash/Redis (rate limit global) fica como TODO futuro,
 * fora do escopo.
 *
 * Nota Next.js 16: `middleware.ts` está deprecated em favor de `proxy.ts`,
 * mas o runtime `edge` NÃO é suportado em proxy (proxy roda em nodejs).
 * Como este rate limit depende de um Map em memória na borda, mantemos
 * `middleware.ts` (funcional, apenas deprecated).
 */

const RATE_LIMIT = 10; // tentativas por janela
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minuto

export function middleware(request: NextRequest) {
  // Vercel seta `x-forwarded-for` com o IP real do cliente como PRIMEIRO
  // valor. Nunca confiar no header sozinho (spoofável) — em produção a
  // cadeia vem do proxy da Vercel; sem header, cai em "unknown".
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown";

  const { allowed, retryAfterSeconds } = slidingWindowRateLimit(
    ip,
    RATE_LIMIT,
    RATE_LIMIT_WINDOW_MS
  );

  if (!allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente em instantes." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSeconds) },
      }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
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
  ],
};