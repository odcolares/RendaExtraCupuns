"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, Store as StoreIcon, Clock, BarChart3, CreditCard, UserCircle, LifeBuoy, Users, DollarSign } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface SidebarNavProps {
  userRole: string;
  /** Itens tenant-scoped (Operação) só aparecem para quem tem tenant */
  hasTenant: boolean;
}

interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly icon: typeof Home;
}

// Itens ligados ao tenant do usuário — só aparecem para quem tem tenant
// (admin super-admin sem tenant não vê esta seção)
const operationNavItems = [
  { href: "/ofertas", label: "Ofertas", icon: MessageCircle },
  { href: "/afiliados", label: "Afiliados", icon: StoreIcon },
  { href: "/fontes", label: "Fontes", icon: StoreIcon },
  { href: "/onboarding", label: "Onboarding", icon: Clock },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/assinatura", label: "Assinatura", icon: CreditCard },
] as const;

// Seção exclusiva de admin — verificada também em admin/layout.tsx e requireAdmin()
const adminNavItems = [
  { href: "/admin", label: "Clientes", icon: Users },
  { href: "/admin/ofertas", label: "Ofertas Globais", icon: BarChart3 },
  { href: "/admin/faturamento", label: "Faturamento", icon: DollarSign },
] as const;

// Universais — valem para qualquer perfil autenticado
const accountNavItems = [
  { href: "/conta", label: "Minha Conta", icon: UserCircle },
  { href: "/suporte", label: "Suporte", icon: LifeBuoy },
] as const;

function NavItemButton({
  item,
  isActive,
}: {
  item: NavItem;
  isActive: boolean;
}) {
  return (
    <SidebarMenuButton
      className={cn(
        "transition-all duration-200",
        isActive
          ? "bg-brand-primary/15 text-brand-primary border-l-2 border-l-brand-primary rounded-none"
          : ""
      )}
      render={
        <Link href={item.href}>
          <item.icon className="mr-2 h-4 w-4" />
          {item.label}
        </Link>
      }
    />
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <SidebarMenuItem className="mt-2 px-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {children}
      </p>
    </SidebarMenuItem>
  );
}

function NavItems({
  items,
  pathname,
}: {
  items: readonly NavItem[];
  pathname: string;
}) {
  return (
    <>
      {items.map((item) => (
        <SidebarMenuItem key={item.href}>
          <NavItemButton
            item={item}
            isActive={
              item.href === "/dashboard"
                ? pathname === item.href
                : pathname.startsWith(item.href)
            }
          />
        </SidebarMenuItem>
      ))}
    </>
  );
}

export function SidebarNav({ userRole, hasTenant }: SidebarNavProps) {
  const pathname = usePathname();
  const isAdmin = userRole === "admin";

  return (
    <SidebarMenu>
      {/* Home — sempre visível */}
      <SidebarMenuItem>
        <NavItemButton
          item={{ href: "/dashboard", label: "Dashboard", icon: Home }}
          isActive={pathname === "/dashboard"}
        />
      </SidebarMenuItem>

      {/* Operação — apenas para quem tem tenant (clientes e admins com tenant) */}
      {hasTenant && (
        <>
          <div className="my-2 h-px bg-gradient-to-r from-brand-primary/50 to-transparent" />
          <SectionLabel>Operação</SectionLabel>
          <NavItems items={operationNavItems} pathname={pathname} />
        </>
      )}

      {/* Admin — apenas para role admin */}
      {isAdmin && (
        <>
          <div className="my-2 h-px bg-gradient-to-r from-brand-primary/50 to-transparent" />
          <SectionLabel>Admin</SectionLabel>
          <NavItems items={adminNavItems} pathname={pathname} />
        </>
      )}

      {/* Conta — universal */}
      <div className="my-2 h-px bg-gradient-to-r from-brand-primary/50 to-transparent" />
      <SectionLabel>Conta</SectionLabel>
      <NavItems items={accountNavItems} pathname={pathname} />
    </SidebarMenu>
  );
}