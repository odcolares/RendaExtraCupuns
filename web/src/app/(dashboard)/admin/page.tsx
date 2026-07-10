import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  changePlanAction,
  toggleTenantStatusAction,
} from "@/actions/admin";
import type { Prisma } from "@/generated/prisma/client";

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  active: "default",
  suspended: "destructive",
  cancelled: "secondary",
};

export default async function AdminPage(props: {
  searchParams?: Promise<{ search?: string; plan?: string; status?: string; page?: string }>;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const searchParams = await props.searchParams;
  const search = searchParams?.search || "";
  const planFilter = searchParams?.plan || "";
  const statusFilter = searchParams?.status || "";
  const page = Number(searchParams?.page) || 1;
  const pageSize = 20;

  // Build where clause
  const where: Prisma.TenantWhereInput = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { users: { some: { email: { contains: search } } } },
    ];
  }
  if (planFilter) where.plan = planFilter as Prisma.EnumTenantPlanFilter["equals"];
  if (statusFilter) where.status = statusFilter as Prisma.EnumTenantStatusFilter["equals"];

  const [tenants, total, globalStats] = await Promise.all([
    prisma.tenant.findMany({
      where,
      include: {
        users: {
          select: { id: true, name: true, email: true, role: true },
        },
        _count: { select: { offers: true, fontes: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.tenant.count({ where }),
    prisma.tenant.findMany({
      select: { plan: true, status: true },
    }),
  ]);

  const stats = {
    total: globalStats.length,
    active: globalStats.filter((t) => t.status === "active").length,
    free: globalStats.filter((t) => t.plan === "free").length,
    paying: globalStats.filter(
      (t) => t.plan !== "free" && t.status === "active"
    ).length,
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie todos os clientes e planos
        </p>
      </div>

      {/* Stats cards */}
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

      {/* Search + Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Clientes</CardTitle>
          <CardDescription>
            {total} cliente{total !== 1 ? "s" : ""} cadastrado
            {total !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="flex flex-wrap gap-3"
            action="/admin"
            method="GET"
          >
            <Input
              name="search"
              placeholder="Buscar por nome ou email..."
              defaultValue={search}
              className="max-w-xs"
            />
            <select
              name="plan"
              defaultValue={planFilter}
              className="flex h-10 w-[140px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todos planos</option>
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
            </select>
            <select
              name="status"
              defaultValue={statusFilter}
              className="flex h-10 w-[140px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todos status</option>
              <option value="active">Ativo</option>
              <option value="suspended">Suspenso</option>
              <option value="cancelled">Cancelado</option>
            </select>
            <Button type="submit" variant="secondary">
              Filtrar
            </Button>
            {(search || planFilter || statusFilter) && (
              <Link
                href="/admin"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
              >
                Limpar
              </Link>
            )}
          </form>

          {tenants.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">
              Nenhum cliente encontrado com esses filtros.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ofertas</TableHead>
                    <TableHead>Fontes</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <Link
                          href={`/admin/clientes/${tenant.id}`}
                          className="hover:underline"
                        >
                          <p className="font-medium">
                            {tenant.users[0]?.name || tenant.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {tenant.users[0]?.email}
                          </p>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <form
                          action={async (formData: FormData) => {
                            "use server";
                            await changePlanAction(
                              tenant.id,
                              formData.get("plan") as "free" | "starter" | "professional"
                            );
                          }}
                        >
                          <select
                            name="plan"
                            defaultValue={tenant.plan}
                            onChange={(e) => e.target.form?.requestSubmit()}
                            className="flex h-8 w-[120px] rounded-md border border-input bg-background px-2 text-xs ring-offset-background"
                          >
                            <option value="free">Free</option>
                            <option value="starter">Starter</option>
                            <option value="professional">Professional</option>
                          </select>
                        </form>
                      </TableCell>
                      <TableCell>
                        <form
                          action={async () => {
                            "use server";
                            await toggleTenantStatusAction(tenant.id);
                          }}
                        >
                          <button type="submit" className="cursor-pointer">
                            <Badge
                              variant={statusVariant[tenant.status]}
                              className="hover:opacity-80"
                            >
                              {tenant.status === "active"
                                ? "Ativo"
                                : tenant.status === "suspended"
                                ? "Suspenso"
                                : "Cancelado"}
                            </Badge>
                          </button>
                        </form>
                      </TableCell>
                      <TableCell>{tenant._count.offers}</TableCell>
                      <TableCell>{tenant._count.fontes}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {tenant.createdAt.toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/admin/clientes/${tenant.id}`}
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3"
                          >
                            Detalhes
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Página {page} de {totalPages} ({total} resultados)
                  </p>
                  <div className="flex gap-2">
                    {page > 1 && (
                      <Link
                        href={`/admin?${new URLSearchParams({
                          ...(search && { search }),
                          ...(planFilter && { plan: planFilter }),
                          ...(statusFilter && { status: statusFilter }),
                          page: String(page - 1),
                        })}`}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3"
                      >
                        Anterior
                      </Link>
                    )}
                    {page < totalPages && (
                      <Link
                        href={`/admin?${new URLSearchParams({
                          ...(search && { search }),
                          ...(planFilter && { plan: planFilter }),
                          ...(statusFilter && { status: statusFilter }),
                          page: String(page + 1),
                        })}`}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3"
                      >
                        Próxima
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
