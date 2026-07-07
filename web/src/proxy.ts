import { auth } from "@/lib/auth.proxy";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/", "/login", "/signup"];
const apiAuthPaths = ["/api/auth"];
const adminPrefix = "/admin";
const dashboardPrefix = "/dashboard";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  // Always allow public pages and auth API
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
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)",
  ],
};
