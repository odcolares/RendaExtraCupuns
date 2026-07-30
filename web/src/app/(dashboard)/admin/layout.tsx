import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
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

  const headersList = await headers();
  const currentPath = headersList.get("x-next-url") || headersList.get("referer") || "";
  const path =
    headersList.get("x-invoke-path") ||
    headersList.get("x-middleware-invoke") ||
    currentPath;

  return (
    <div className="flex flex-col gap-6">
      <nav className="flex items-center gap-1">
        {adminNavItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/admin"
            ? path === "/admin" || path === "/admin/"
            : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-brand-gradient text-white shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
