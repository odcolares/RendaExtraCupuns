"use client";

import { SessionProvider } from "next-auth/react";

// Without this provider, client pages calling useSession() throw
// "useSession must be wrapped in a <SessionProvider />"
// (see web/node_modules/next-auth/react.js:77), which produced
// "An unexpected error occurred" on /onboarding and /ofertas.
export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
