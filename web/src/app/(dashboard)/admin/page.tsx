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
import { CheckCircle, DollarSign, Users } from "lucide-react";
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
import { toggleTenantStatusAction } from "@/actions/admin";
import { PlanSelect } from "@/components/admin/plan-select";
import { PageHeader } from "@/components/page-header";
import type { Prisma } from "@/generated/prisma/client";

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  active: "default",
  suspended: "destructive",
  cancelled: "secondary",
};

const planClass: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  starter: "bg-brand-primary/15 text-brand-primary",
  professional: "bg-amber-500/15 text-amber-600",
};

const statusClass: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-600",
  suspended: "bg-red-500/15 text-red-600",
  cancelled: "bg-muted text-muted-foreground",
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
      <PageHeader
        eyebrow="Admin"
        title="Admin"
        description="Gerencie todos os clientes e planos"
      />

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4 border-l-2 border-l-brand-primary bg-brand-primary/5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground font-medium">Total Clientes</p>
            <Users className="size-5 text-brand-primary" />
          </div>
          <p className="text-2xl font-bold mt-2">{stats.total}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 border-l-2 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground font-medium">Planos Ativos</p>
            <CheckCircle className="size-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold mt-2">{stats.active}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 border-l-2 border-l-brand-accent">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground font-medium">Faturamento</p>
            <DollarSign className="size-5 text-brand-accent" />
          </div>
          <p className="text-2xl font-bold mt-2">
            {(stats.paying * 97).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </p>
        </div>
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
                    <TableRow key={tenant.id} className="hover:bg-brand-primary/5 transition-colors">
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
                        <div className="flex items-center gap-2">
                          <Badge className={`${planClass[tenant.plan]} border-0 font-medium`}>
                            {tenant.plan === "free"
                              ? "Free"
                              : tenant.plan === "starter"
                              ? "Starter"
                              : "Professional"}
                          </Badge>
                          <PlanSelect
                            tenantId={tenant.id}
                            defaultValue={tenant.plan}
                            className="flex h-8 w-[120px] rounded-md border border-input bg-background px-2 text-xs ring-offset-background"
                          />
                        </div>
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
                                className={`${statusClass[tenant.status]} hover:opacity-80 border-0`}
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
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-brand-primary h-8 px-3"
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
