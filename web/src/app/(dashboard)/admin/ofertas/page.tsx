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
import type { Prisma } from "@/generated/prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const platformLabels: Record<string, string> = {
  amazon: "Amazon",
  shopee: "Shopee",
  mercadolivre: "Mercado Livre",
  aliexpress: "AliExpress",
  outros: "Outros",
};

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  published: "default",
  pending: "secondary",
  failed: "destructive",
};

export default async function GlobalOffersPage(props: {
  searchParams?: Promise<{
    search?: string;
    platform?: string;
    status?: string;
    page?: string;
  }>;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const searchParams = await props.searchParams;
  const search = searchParams?.search || "";
  const platformFilter = searchParams?.platform || "";
  const statusFilter = searchParams?.status || "";
  const page = Number(searchParams?.page) || 1;
  const pageSize = 20;

  const where: Prisma.OfferWhereInput = {};
  if (search) where.title = { contains: search };
  if (platformFilter) where.platform = platformFilter as Prisma.EnumOfferPlatformFilter["equals"];
  if (statusFilter) where.status = statusFilter as Prisma.EnumOfferStatusFilter["equals"];

  const [offers, total, globalStats] = await Promise.all([
    prisma.offer.findMany({
      where,
      include: {
        tenant: {
          select: {
            name: true,
            users: { select: { name: true, email: true }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.offer.count({ where }),
    prisma.offer.groupBy({
      by: ["status"],
      _count: true,
    }),
  ]);

  const totalPages = Math.ceil(total / pageSize);
  const statsMap: Record<string, number> = {};
  globalStats.forEach((s) => {
    statsMap[s.status] = s._count;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Ofertas Globais</h1>
        <p className="text-muted-foreground mt-1">
          Todas as ofertas de todos os clientes
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{total}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Publicadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-green-600">
              {statsMap.published || 0}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-yellow-600">
              {statsMap.pending || 0}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Falhas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-red-600">
              {statsMap.failed || 0}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Ofertas</CardTitle>
          <CardDescription>
            {total} oferta{total !== 1 ? "s" : ""} encontrada{total !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="flex flex-wrap gap-3" action="/admin/ofertas" method="GET">
            <Input
              name="search"
              placeholder="Buscar por título..."
              defaultValue={search}
              className="max-w-xs"
            />
            <select
              name="platform"
              defaultValue={platformFilter}
              className="flex h-10 w-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Todas plataformas</option>
              <option value="amazon">Amazon</option>
              <option value="shopee">Shopee</option>
              <option value="mercadolivre">Mercado Livre</option>
              <option value="aliexpress">AliExpress</option>
              <option value="outros">Outros</option>
            </select>
            <select
              name="status"
              defaultValue={statusFilter}
              className="flex h-10 w-[140px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Todos status</option>
              <option value="published">Publicada</option>
              <option value="pending">Pendente</option>
              <option value="failed">Falha</option>
            </select>
            <Button type="submit" variant="secondary">
              Filtrar
            </Button>
            {(search || platformFilter || statusFilter) && (
              <Link
                href="/admin/ofertas"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
              >
                Limpar
              </Link>
            )}
          </form>

          {offers.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">
              Nenhuma oferta encontrada com esses filtros.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Plataforma</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criada em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offers.map((offer) => (
                    <TableRow key={offer.id}>
                      <TableCell className="font-medium max-w-[300px] truncate">
                        {offer.title}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {offer.tenant.users[0]?.name || offer.tenant.name}
                        </span>
                      </TableCell>
                      <TableCell>
                        {platformLabels[offer.platform] || offer.platform}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[offer.status]}>
                          {offer.status === "published"
                            ? "Publicada"
                            : offer.status === "pending"
                            ? "Pendente"
                            : "Falha"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {offer.createdAt.toLocaleDateString("pt-BR")}
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
                        href={`/admin/ofertas?${new URLSearchParams({
                          ...(search && { search }),
                          ...(platformFilter && { platform: platformFilter }),
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
                        href={`/admin/ofertas?${new URLSearchParams({
                          ...(search && { search }),
                          ...(platformFilter && { platform: platformFilter }),
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
