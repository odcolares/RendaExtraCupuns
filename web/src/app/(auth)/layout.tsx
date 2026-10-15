"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion } from "framer-motion";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-gradient-to-br from-background via-background to-muted bg-dot-pattern">
      {/* Decorative brand blobs */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-80 w-80 rounded-full bg-brand-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-72 w-72 rounded-full bg-brand-accent/10 blur-3xl" />

      <header className="relative border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/" className="cursor-pointer font-bold text-xl">
            <span className="text-gradient">RendaExtra</span>
            <span className="text-muted-foreground">Cupuns</span>
          </Link>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="relative flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-3">
            <motion.h1
              className="text-3xl font-bold tracking-tight"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="text-gradient">RendaExtra</span>
              <span className="text-muted-foreground">Cupuns</span>
            </motion.h1>
            <motion.p
              className="text-sm text-muted-foreground leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              Monitore ofertas e maximize seus ganhos com links de afiliado
            </motion.p>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
