import { auth } from "@/lib/auth.proxy";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { applyRateLimit } from "@/lib/proxy-rate-limit";

const publicPaths = ["/", "/login", "/signup"];
const apiAuthPaths = ["/api/auth"];
const adminPrefix = "/admin";
const dashboardPrefix = "/dashboard";

/**
 * Handler do proxy (exportado para uso direto; rate limit em `@/lib/proxy-rate-limit`).
 * Runtime: proxy roda em nodejs no Next.js 16 — o rate limit é 100% em memória.
 * LIMITAÇÃO: na Vercel serverless o limite é por-instância (aceitável p/ beta;
 * upgrade Upstash/Redis = TODO futuro, fora do escopo).
 */
export function proxyHandler(
  req: NextRequest & { auth?: { user?: { role?: string } | null } | null }
) {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  const rateLimitResponse = applyRateLimit(req);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Always allow public pages and auth API
  if (pathname.startsWith("/r/")) {
    return NextResponse.next();
  }

  if (publicPaths.some((p) => pathname === p)) {
    return NextResponse.next();
  }

  if (apiAuthPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin-only routes
  if (pathname.startsWith(adminPrefix) && userRole !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Dashboard routes - any logged in user
  if (pathname.startsWith(dashboardPrefix) && isLoggedIn) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export default auth(proxyHandler);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)",
  ],
};