import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Providers from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from "@/components/ui/sidebar";
import { headers } from "next/headers";
import { Home, Store, MessageCircle, Clock, Users, BarChart3, DollarSign, CreditCard, UserCircle, LifeBuoy, Search } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;
  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const headersList = await headers();
  const currentPath = headersList.get("x-invoke-path") || headersList.get("x-middleware-invoke") || headersList.get("x-next-url") || "";
  const isActive = (href: string) => currentPath === href;

  async function handleLogout() {
    "use server";
    const { signOut } = await import("@/lib/auth");
    await signOut({ redirectTo: "/" });
  }

  return (
    <SidebarProvider collapsible="icon">
      <div className="flex min-h-screen">
        <Sidebar className="border-r border-border/50">
          <SidebarContent>
            <div className="h-1 bg-gradient-to-r from-brand-primary to-brand-accent" />
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className={`transition-all duration-200 ${isActive("/dashboard") ? "bg-brand-primary/15 text-brand-primary border-l-2 border-l-brand-primary rounded-none" : ""}`} render={<Link href="/dashboard"><Home className="mr-2 h-4 w-4" />Dashboard</Link>} />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className={`transition-all duration-200 ${isActive("/ofertas") ? "bg-brand-primary/15 text-brand-primary border-l-2 border-l-brand-primary rounded-none" : ""}`} render={<Link href="/ofertas"><MessageCircle className="mr-2 h-4 w-4" />Ofertas</Link>} />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className={`transition-all duration-200 ${isActive("/afiliados") ? "bg-brand-primary/15 text-brand-primary border-l-2 border-l-brand-primary rounded-none" : ""}`} render={<Link href="/afiliados"><Store className="mr-2 h-4 w-4" />Afiliados</Link>} />
              </SidebarMenuItem>
               <SidebarMenuItem>
                 <SidebarMenuButton className={`transition-all duration-200 ${isActive("/fontes") ? "bg-brand-primary/15 text-brand-primary border-l-2 border-l-brand-primary rounded-none" : ""}`} render={<Link href="/fontes"><Store className="mr-2 h-4 w-4" />Fontes</Link>} />
               </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className={`transition-all duration-200 ${isActive("/onboarding") ? "bg-brand-primary/15 text-brand-primary border-l-2 border-l-brand-primary rounded-none" : ""}`} render={<Link href="/onboarding"><Clock className="mr-2 h-4 w-4" />Onboarding</Link>} />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className={`transition-all duration-200 ${isActive("/assinatura") ? "bg-brand-primary/15 text-brand-primary border-l-2 border-l-brand-primary rounded-none" : ""}`} render={<Link href="/assinatura"><CreditCard className="mr-2 h-4 w-4" />Assinatura</Link>} />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className={`transition-all duration-200 ${isActive("/conta") ? "bg-brand-primary/15 text-brand-primary border-l-2 border-l-brand-primary rounded-none" : ""}`} render={<Link href="/conta"><UserCircle className="mr-2 h-4 w-4" />Minha Conta</Link>} />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className={`transition-all duration-200 ${isActive("/suporte") ? "bg-brand-primary/15 text-brand-primary border-l-2 border-l-brand-primary rounded-none" : ""}`} render={<Link href="/suporte"><LifeBuoy className="mr-2 h-4 w-4" />Suporte</Link>} />
              </SidebarMenuItem>

              {user.role === "admin" && (
                <>
                  <div className="my-2 h-px bg-gradient-to-r from-brand-primary/50 to-transparent" />
                  <SidebarMenuItem className="mt-2 px-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin</p>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton className={`transition-all duration-200 ${isActive("/admin") ? "bg-brand-primary/15 text-brand-primary border-l-2 border-l-brand-primary rounded-none" : ""}`} render={<Link href="/admin"><Users className="mr-2 h-4 w-4" />Clientes</Link>} />
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton className={`transition-all duration-200 ${isActive("/admin/ofertas") ? "bg-brand-primary/15 text-brand-primary border-l-2 border-l-brand-primary rounded-none" : ""}`} render={<Link href="/admin/ofertas"><BarChart3 className="mr-2 h-4 w-4" />Ofertas Globais</Link>} />
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton className={`transition-all duration-200 ${isActive("/admin/faturamento") ? "bg-brand-primary/15 text-brand-primary border-l-2 border-l-brand-primary rounded-none" : ""}`} render={<Link href="/admin/faturamento"><DollarSign className="mr-2 h-4 w-4" />Faturamento</Link>} />
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-50 w-full border-b bg-background">
            <div className="flex h-16 items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="-ml-1" />
                <Link href="/dashboard" className="font-bold text-xl">
                  <span className="text-primary">RendaExtra</span>
                  <span className="text-muted-foreground">Cupuns</span>
                </Link>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative hidden w-64 md:block">
                  <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar..."
                    readOnly
                    className="pl-9"
                  />
                </div>

                <ThemeToggle />
                {user.role === "admin" && (
                  <Link href="/admin">
                    <Button variant="ghost" size="sm">
                      Admin
                    </Button>
                  </Link>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger className="cursor-pointer">
                    <Avatar className="h-9 w-9 ring-2 ring-brand-primary/20">
                      <AvatarFallback>{initials || "U"}</AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>
                        <div className="flex flex-col">
                          <span>{user.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {user.email}
                          </span>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <Link href="/dashboard">
                        <DropdownMenuItem>Dashboard</DropdownMenuItem>
                      </Link>
                      {user.role === "admin" && (
                        <Link href="/admin">
                          <DropdownMenuItem>Admin</DropdownMenuItem>
                        </Link>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <form action={handleLogout} className="w-full">
                          <button type="submit" className="w-full text-left">
                            Sair
                          </button>
                        </form>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <main className="flex-1 p-8 pt-20">
            <Providers>{children}</Providers>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
