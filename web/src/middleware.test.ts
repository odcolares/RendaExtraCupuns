import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";
import { clearRateLimitWindows } from "@/lib/rate-limit";

/**
 * Testes do rate limiting em middleware (C4).
 *
 * NOTA anti-poluição: o Map do rate-limit é compartilhado dentro deste
 * arquivo de teste — cada teste usa um IP próprio e `clearRateLimitWindows`
 * roda antes de cada teste para garantir isolamento total.
 */

function makeRequest(path: string, ip: string): NextRequest {
  return new NextRequest(`https://example.com${path}`, {
    headers: { "x-forwarded-for": ip },
  });
}

describe("rate limiting middleware", () => {
  beforeEach(() => {
    clearRateLimitWindows();
  });

  it("bloqueia o 11º request do mesmo IP em /login com 429 + Retry-After", async () => {
    const ip = "ip-test-1";

    for (let i = 0; i < 10; i++) {
      const res = await middleware(makeRequest("/login", ip));
      expect(res.status).not.toBe(429);
    }

    const eleventh = await middleware(makeRequest("/login", ip));
    expect(eleventh.status).toBe(429);
    expect(eleventh.headers.get("Retry-After")).toBeTruthy();
  });

  it("não intercepta /dashboard (fora do matcher)", async () => {
    const res = await middleware(makeRequest("/dashboard", "ip-test-2"));
    expect(res.status).not.toBe(429);
  });

  it("inclui o header Retry-After como inteiro positivo no 429", async () => {
    const ip = "ip-test-3";

    for (let i = 0; i < 10; i++) {
      await middleware(makeRequest("/login", ip));
    }

    const res = await middleware(makeRequest("/login", ip));
    expect(res.status).toBe(429);

    const retryAfter = res.headers.get("Retry-After");
    expect(retryAfter).toBeTruthy();
    expect(Number(retryAfter)).toBeGreaterThan(0);
  });
});
