import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { applyRateLimit } from "@/lib/proxy-rate-limit";
import { clearRateLimitWindows } from "@/lib/rate-limit";

/**
 * Testes do rate limiting do proxy (C4).
 *
 * NOTA anti-poluição: o Map do rate-limit é compartilhado dentro deste
 * arquivo de teste — cada teste usa um IP próprio e `clearRateLimitWindows`
 * roda antes de cada teste para garantir isolamento total.
 *
 * NOTA: testamos `applyRateLimit` (módulo próprio sem NextAuth) — o proxy.ts
 * o chama no início do handler. O NextAuth não é resolvível no vitest
 * (`next-auth/lib/env.js` importa `next/server` sem extensão).
 */

function makeRequest(path: string, ip: string): NextRequest {
  return new NextRequest(`https://example.com${path}`, {
    headers: { "x-forwarded-for": ip },
  });
}

describe("rate limiting no proxy", () => {
  beforeEach(() => {
    clearRateLimitWindows();
  });

  it("bloqueia o 11º request do mesmo IP em /login com 429 + Retry-After", async () => {
    const ip = "ip-test-1";

    for (let i = 0; i < 10; i++) {
      const res = await applyRateLimit(makeRequest("/login", ip));
      expect(res).toBeNull();
    }

    const eleventh = await applyRateLimit(makeRequest("/login", ip));
    expect(eleventh).not.toBeNull();
    expect(eleventh!.status).toBe(429);
    expect(eleventh!.headers.get("Retry-After")).toBeTruthy();
  });

  it("não bloqueia /dashboard (fora da lista de paths de auth)", async () => {
    const res = await applyRateLimit(makeRequest("/dashboard", "ip-test-2"));
    expect(res).toBeNull();
  });

  it("não bloqueia /api/webhooks (fora da lista de paths de auth)", async () => {
    const res = await applyRateLimit(
      makeRequest("/api/webhooks/stripe", "ip-test-4")
    );
    expect(res).toBeNull();
  });

  it("inclui o header Retry-After como inteiro positivo no 429", async () => {
    const ip = "ip-test-3";

    for (let i = 0; i < 10; i++) {
      await applyRateLimit(makeRequest("/login", ip));
    }

    const res = await applyRateLimit(makeRequest("/login", ip));
    expect(res).not.toBeNull();
    expect(res!.status).toBe(429);

    const retryAfter = res!.headers.get("Retry-After");
    expect(retryAfter).toBeTruthy();
    expect(Number(retryAfter)).toBeGreaterThan(0);
  });
});