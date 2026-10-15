"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Store, MessageCircle, Store as StoreIcon, Clock, BarChart3, DollarSign, CreditCard, UserCircle, LifeBuoy, Users, Search } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface SidebarNavProps {
  userRole: string;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/ofertas", label: "Ofertas", icon: MessageCircle },
  { href: "/afiliados", label: "Afiliados", icon: StoreIcon },
  { href: "/fontes", label: "Fontes", icon: StoreIcon },
  { href: "/onboarding", label: "Onboarding", icon: Clock },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/assinatura", label: "Assinatura", icon: CreditCard },
  { href: "/conta", label: "Minha Conta", icon: UserCircle },
  { href: "/suporte", label: "Suporte", icon: LifeBuoy },
] as const;

const adminNavItems = [
  { href: "/admin", label: "Clientes", icon: Users },
  { href: "/admin/ofertas", label: "Ofertas Globais", icon: BarChart3 },
  { href: "/admin/faturamento", label: "Faturamento", icon: DollarSign },
] as const;

export function SidebarNav({ userRole }: SidebarNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            className={cn(
              "transition-all duration-200",
              isActive(item.href)
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
        </SidebarMenuItem>
      ))}

      {userRole === "admin" && (
        <>
          <div className="my-2 h-px bg-gradient-to-r from-brand-primary/50 to-transparent" />
          <SidebarMenuItem className="mt-2 px-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Admin
            </p>
          </SidebarMenuItem>
          {adminNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                className={cn(
                  "transition-all duration-200",
                  isActive(item.href)
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
            </SidebarMenuItem>
          ))}
        </>
      )}
    </SidebarMenu>
  );
}