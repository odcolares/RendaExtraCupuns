import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
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
import { Home, Store, MessageCircle, Clock } from "lucide-react";

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
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar className="border-r">
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton render={<Link href="/dashboard"><Home className="mr-2 h-4 w-4" />Dashboard</Link>} />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton render={<Link href="/dashboard/ofertas"><MessageCircle className="mr-2 h-4 w-4" />Ofertas</Link>} />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton render={<Link href="/dashboard/afiliados"><Store className="mr-2 h-4 w-4" />Afiliados</Link>} />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton render={<Link href="/dashboard/onboarding"><Clock className="mr-2 h-4 w-4" />Onboarding</Link>} />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-50 w-full border-b bg-background">
            <div className="flex h-16 items-center justify-between px-4">
              <SidebarTrigger className="-ml-1" />
              <Link href="/dashboard" className="font-bold text-xl">
                <span className="text-primary">RendaExtra</span>
                <span className="text-muted-foreground">Cupuns</span>
              </Link>

              <div className="flex items-center gap-4">
                {user.role === "admin" && (
                  <Link href="/admin">
                    <Button variant="ghost" size="sm">
                      Admin
                    </Button>
                  </Link>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger className="cursor-pointer">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>{initials || "U"}</AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
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
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <main className="flex-1 p-8 pt-20">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
