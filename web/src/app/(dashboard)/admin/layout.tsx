import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, BarChart3, DollarSign } from "lucide-react";

const adminNavItems = [
  { href: "/admin", label: "Clientes", icon: Users },
  { href: "/admin/ofertas", label: "Ofertas Globais", icon: BarChart3 },
  { href: "/admin/faturamento", label: "Faturamento", icon: DollarSign },
] as const;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <nav className="flex items-center gap-1 border-b pb-2">
        {adminNavItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors aria-[current=page]:bg-accent aria-[current=page]:text-accent-foreground"
            aria-current={
              // Simple client-side check won't work in RSC, so we rely on the fact that
              // only the active page will use this layout — actual highlighting via CSS
              undefined
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
