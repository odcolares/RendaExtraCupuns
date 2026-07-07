import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const tenants = await prisma.tenant.findMany({
    include: {
      users: {
        select: { id: true, name: true, email: true, role: true },
      },
      _count: { select: { offers: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const stats = {
    total: tenants.length,
    active: tenants.filter((t) => t.status === "active").length,
    free: tenants.filter((t) => t.plan === "free").length,
    paying: tenants.filter((t) => t.plan !== "free" && t.status === "active")
      .length,
  };

  const statusVariant: Record<string, "default" | "secondary" | "destructive"> =
    {
      active: "default",
      suspended: "destructive",
      cancelled: "secondary",
    };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie todos os clientes e planos
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total Clientes", value: stats.total },
          { label: "Ativos", value: stats.active },
          { label: "Gratuitos", value: stats.free },
          { label: "Pagantes", value: stats.paying },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-medium">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clientes</CardTitle>
          <CardDescription>
            Todos os clientes cadastrados na plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tenants.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhum cliente cadastrado ainda.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ofertas</TableHead>
                  <TableHead>Criado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {tenant.users[0]?.name || tenant.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tenant.users[0]?.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{tenant.plan}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[tenant.status]}>
                        {tenant.status === "active" ? "Ativo" : tenant.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{tenant._count.offers}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {tenant.createdAt.toLocaleDateString("pt-BR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
