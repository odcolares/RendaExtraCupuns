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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { PlatformBadge } from "@/components/platform-badge";
import { EmptyState } from "@/components/empty-state";
import { PaginationControls } from "@/components/pagination-controls";
import type { Prisma } from "@/generated/prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";


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
      <PageHeader
        eyebrow="Admin"
        title="Ofertas Globais"
        description="Todas as ofertas de todos os clientes"
      />

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
            <Select name="platform" defaultValue={platformFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todas plataformas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas plataformas</SelectItem>
                <SelectItem value="amazon">Amazon</SelectItem>
                <SelectItem value="shopee">Shopee</SelectItem>
                <SelectItem value="mercadolivre">Mercado Livre</SelectItem>
                <SelectItem value="aliexpress">AliExpress</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
            <Select name="status" defaultValue={statusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Todos status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos status</SelectItem>
                <SelectItem value="published">Publicada</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="failed">Falha</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" variant="secondary">
              Filtrar
            </Button>
            {(search || platformFilter || statusFilter) && (
              <Link href="/admin/ofertas" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
                Limpar
              </Link>
            )}
          </form>

          {offers.length === 0 ? (
            <EmptyState
              title="Nenhuma oferta encontrada"
              description="Não foram encontradas ofertas com os filtros atuais."
            />
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
                        <PlatformBadge platform={offer.platform} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={offer.status} type="offer" />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {offer.createdAt.toLocaleDateString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <PaginationControls
                page={page}
                totalPages={totalPages}
                total={total}
                searchParams={{ search, platform: platformFilter, status: statusFilter }}
                basePath="/admin/ofertas"
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
