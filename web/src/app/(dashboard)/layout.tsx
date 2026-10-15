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
  SidebarInset,
} from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/sidebar-nav";
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
            <SidebarNav userRole={user.role} />
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
