"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect, useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Inbox,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getPaginatedOffersAction } from "@/actions/affiliates";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const platformOptions = [
  { value: "amazon", label: "Amazon" },
  { value: "shopee", label: "Shopee" },
  { value: "mercadolivre", label: "Mercado Livre" },
  { value: "aliexpress", label: "AliExpress" },
  { value: "outros", label: "Outros" },
];

const statusOptions = [
  { value: "published", label: "Publicado" },
  { value: "pending", label: "Pendente" },
  { value: "failed", label: "Falhou" },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    published: { label: "Publicado", className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
    pending: { label: "Pendente", className: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
    failed: { label: "Falhou", className: "bg-red-500/15 text-red-600 border-red-500/30" },
  };
  const { label, className } = map[status] || { label: status, className: "bg-muted text-muted-foreground" };
  return <Badge variant="outline" className={className}>{label}</Badge>;
}

function PlatformBadge({ platform }: { platform: string }) {
  const labels: Record<string, string> = {
    amazon: "Amazon",
    shopee: "Shopee",
    mercadolivre: "Mercado Livre",
    aliexpress: "AliExpress",
    outros: "Outros",
  };
  const colors: Record<string, string> = {
    amazon: "bg-[#FF9900]/15 text-[#FF9900] border-[#FF9900]/30",
    shopee: "bg-[#EE4D2D]/15 text-[#EE4D2D] border-[#EE4D2D]/30",
    mercadolivre: "bg-[#FFE600]/20 text-[#B8960F] border-[#FFE600]/40",
    aliexpress: "bg-[#FF4747]/15 text-[#FF4747] border-[#FF4747]/30",
  };
  return (
    <Badge variant="outline" className={`text-xs ${colors[platform] || "bg-muted text-muted-foreground"}`}>
      {labels[platform] || platform}
    </Badge>
  );
}

function formatPrice(price: number | null) {
  if (price === null) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
}

export default function OffersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tenantId = session?.user?.tenantId;
  const [data, setData] = useState<{
    offers: Array<{
      id: string;
      title: string;
      platform: string;
      price: number | null;
      status: string;
      publishedAt: Date | null;
      createdAt: Date;
    }>;
    total: number;
    page: number;
    totalPages: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Read filters from URL
  const filters = {
    search: searchParams.get("search") || "",
    platform: searchParams.get("platform") || "",
    status: searchParams.get("status") || "",
    startDate: searchParams.get("startDate") || "",
    endDate: searchParams.get("endDate") || "",
    page: parseInt(searchParams.get("page") || "1"),
  };

  // Fetch data
  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    setLoading(true);
    getPaginatedOffersAction(tenantId || "", {
      search: filters.search,
      platform: filters.platform,
      status: filters.status,
      startDate: filters.startDate,
      endDate: filters.endDate,
      page: filters.page,
      pageSize: 10,
    }).then((result) => {
      if (cancelled) return;
      setData({ offers: result.data, total: result.total, page: result.page, totalPages: result.totalPages });
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [tenantId, filters.search, filters.platform, filters.status, filters.startDate, filters.endDate, filters.page]);

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      if (key !== "page") params.set("page", "1");
      router.push(`/ofertas?${params.toString()}`);
    },
    [searchParams, router]
  );

  const clearFilters = useCallback(() => {
    router.push("/ofertas");
  }, [router]);

  if (status === "loading") return <div className="p-8 text-muted-foreground">Carregando…</div>;
  if (!session?.user) {
    redirect("/login");
  }

  const hasFilters =
    filters.search ||
    filters.platform ||
    filters.status ||
    filters.startDate ||
    filters.endDate;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ofertas"
        title="Histórico de Ofertas"
        description="Visualize, filtre e gerencie todas as ofertas publicadas"
      />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="size-5" />
            Filtros
          </CardTitle>
          <CardDescription>
            Filtre por texto, plataforma, status e período
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="search">Busca</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Título da oferta..."
                  value={filters.search}
                  onChange={(e) => updateFilter("search", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="platform">Plataforma</Label>
              <Select
                value={filters.platform}
                onValueChange={(v) => updateFilter("platform", v || "")}
              >
                <SelectTrigger id="platform">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {platformOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(v) => updateFilter("status", v || "")}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Data inicial</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => updateFilter("startDate", e.target.value)}
              />
            </div>
          </div>

          {hasFilters && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {data ? `${data.total} oferta${data.total !== 1 ? "s" : ""} encontrada${data.total !== 1 ? "s" : ""}` : "Carregando..."}
              </p>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Ofertas</CardTitle>
          <CardDescription>
            {data
              ? `${data.total} oferta${data.total !== 1 ? "s" : ""} (Página ${data.page} de ${data.totalPages})`
              : "Carregando..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <span className="text-sm">Carregando ofertas...</span>
            </div>
          ) : !data || data.offers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Inbox className="size-12 mb-4 opacity-40" />
              <p>Nenhuma oferta encontrada.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Plataforma</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.offers.map((offer) => (
                    <TableRow key={offer.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium max-w-xs truncate" title={offer.title}>
                        {offer.title}
                      </TableCell>
                      <TableCell>
                        <PlatformBadge platform={offer.platform} />
                      </TableCell>
                      <TableCell>{formatPrice(offer.price)}</TableCell>
                      <TableCell>
                        <StatusBadge status={offer.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(offer.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="size-8 hover:text-brand-primary" title="Visualizar">
                            <Eye className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="size-8 hover:text-brand-primary" title="Editar">
                            <Edit className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" title="Excluir">
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-4">
              <p className="text-sm text-muted-foreground">
                Página {data.page} de {data.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilter("page", String(data.page - 1))}
                  disabled={data.page <= 1}
                >
                  <ChevronLeft className="size-4 mr-1" />
                  Anterior
                </Button>
                {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <Button
                      key={pageNum}
                      variant={data.page === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateFilter("page", String(pageNum))}
                    >
                      {pageNum}
                    </Button>
                  )
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilter("page", String(data.page + 1))}
                  disabled={data.page >= data.totalPages}
                >
                  Próximo
                  <ChevronRight className="size-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
