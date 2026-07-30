import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-gradient-to-br from-background via-background to-muted bg-dot-pattern">
      {/* Decorative brand blobs */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-80 w-80 rounded-full bg-brand-pink/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-72 w-72 rounded-full bg-brand-cyan/10 blur-3xl" />

      <header className="relative border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/" className="cursor-pointer font-bold text-xl">
            <span className="text-gradient">RendaExtra</span>
            <span className="text-muted-foreground">Cupuns</span>
          </Link>
        </div>
      </header>
      <main className="relative flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-bold tracking-tight">
              <span className="text-gradient">RendaExtra</span>
              <span className="text-muted-foreground">Cupuns</span>
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Monitore ofertas e maximize seus ganhos com links de afiliado
            </p>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
