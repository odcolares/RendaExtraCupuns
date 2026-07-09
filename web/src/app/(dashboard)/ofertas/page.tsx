import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Search, Filter, Download, Eye, Edit, Trash2, Loader2 } from "lucide-react";
import { getPaginatedOffersAction, getDashboardMetricsAction } from "@/actions/affiliates";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Offer {
  id: string;
  title: string;
  platform: string;
  price: number | null;
  status: string;
  publishedAt: Date | null;
  createdAt: Date;
}

interface OfferFilters {
  search?: string;
  platform?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

const platformOptions = [
  { value: "amazon", label: "Amazon" },
  { value: "shopee", label: "Shopee" },
  { value: "mercadolivre", label: "Mercado Livre" },
  { value: "aliexpress", label: "AliExpress" },
  { value: "outros", label: "Outros" },
];

const statusOptions = [
  { value: "active", label: "Publicado" },
  { value: "pending", label: "Pendente" },
  { value: "failed", label: "Falhou" },
];

export default async function OffersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;
  const tenantId = user.tenantId;
  const resolvedSearchParams = await searchParams;

  const filters = {
    search: (resolvedSearchParams.search as string) || "",
    platform: (resolvedSearchParams.platform as string) || "",
    status: (resolvedSearchParams.status as string) || "",
    startDate: (resolvedSearchParams.startDate as string) || "",
    endDate: (resolvedSearchParams.endDate as string) || "",
    page: parseInt((resolvedSearchParams.page as string) || "1"),
    pageSize: 10,
  };

  const [offersResult, metrics] = await Promise.all([
    getPaginatedOffersAction(tenantId || "", filters),
    getDashboardMetricsAction(tenantId || ""),
  ]);

  const formatPrice = (price: number | null) => {
    if (price === null) return "—";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const variants: Record<string, string> = {
      active: "bg-green-100 text-green-800 border-green-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      failed: "bg-red-100 text-red-800 border-red-200",
    };
    return (
      <Badge variant="outline" className={`text-xs ${variants[status] || "bg-gray-100 text-gray-800"}`}>
        {status === "published" ? "Publicado" : status === "pending" ? "Pendente" : status === "failed" ? "Falhou" : status}
      </Badge>
    );
  };

  const PlatformBadge = ({ platform }: { platform: string }) => {
    const labels: Record<string, string> = {
      amazon: "Amazon",
      shopee: "Shopee",
      mercadolivre: "Mercado Livre",
      aliexpress: "AliExpress",
      outros: "Outros",
    };
    return (
      <Badge variant="secondary" className="text-xs">
        {labels[platform] || platform}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Histórico de Ofertas</h1>
        <p className="text-muted-foreground mt-1">
          Visualize, filtre e gerencie todas as ofertas publicadas por seus canais
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
          <CardDescription>
            Filtre as ofertas por texto, plataforma, status e período de data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Busca por título</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Título da oferta..."
                  value={filters.search || ""}
onChange={(e) => {
                      const params = new URLSearchParams(resolvedSearchParams as Record<string, string>);
                      params.set("search", e.target.value);
                      params.set("page", "1");
                      window.location.search = params.toString();
                    }}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="platform">Plataforma</Label>
              <Select
                value={filters.platform || ""}
                onValueChange={(value) => {
                  const params = new URLSearchParams(resolvedSearchParams as Record<string, string>);
                  if (value) {
                    params.set("platform", value);
                  } else {
                    params.delete("platform");
                  }
                  params.set("page", "1");
                  window.location.search = params.toString();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as plataformas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {platformOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.status || ""}
                onValueChange={(value) => {
                  const params = new URLSearchParams(resolvedSearchParams as Record<string, string>);
                  if (value) {
                    params.set("status", value);
                  } else {
                    params.delete("status");
                  }
                  params.set("page", "1");
                  window.location.search = params.toString();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.startDate || filters.endDate ? (
                      <>
                        {filters.startDate && format(new Date(filters.startDate), "dd/MM/yyyy")}
                        {filters.endDate && ` - ${format(new Date(filters.endDate), "dd/MM/yyyy")}`}
                      </>
                    ) : (
                      <span>Selecione o período</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="start">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Data inicial</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={filters.startDate || ""}
                        onChange={(e) => {
                          const params = new URLSearchParams(resolvedSearchParams as Record<string, string>);
                          if (e.target.value) {
                            params.set("startDate", e.target.value);
                          } else {
                            params.delete("startDate");
                          }
                          params.set("page", "1");
                          window.location.search = params.toString();
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-date">Data final</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={filters.endDate || ""}
                        onChange={(e) => {
                          const params = new URLSearchParams(resolvedSearchParams as Record<string, string>);
                          if (e.target.value) {
                            params.set("endDate", e.target.value);
                          } else {
                            params.delete("endDate");
                          }
                          params.set("page", "1");
                          window.location.search = params.toString();
                        }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          const params = new URLSearchParams(resolvedSearchParams as Record<string, string>);
                          params.delete("startDate");
                          params.delete("endDate");
                          params.set("page", "1");
                          window.location.search = params.toString();
                        }}
                      >
                        Limpar
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {filters.search || filters.platform || filters.status || filters.startDate || filters.endDate ? (
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {offersResult.total} oferta{offersResult.total !== 1 ? "s" : ""} encontrada{offersResult.total !== 1 ? "s" : ""}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const params = new URLSearchParams();
                  window.location.search = params.toString();
                }}
              >
                Limpar filtros
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Lista de ofertas */}
      <Card>
        <CardHeader>
          <CardTitle>Ofertas Encontradas</CardTitle>
          <CardDescription>
            {offersResult.total} oferta{offersResult.total !== 1 ? "s" : ""} (Página {offersResult.page} de {offersResult.totalPages})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {offersResult.data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <span className="h-12 w-12 mx-auto mb-4 opacity-50">📭</span>
              <p>Nenhuma oferta encontrada com os filtros selecionados.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Plataforma</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Criação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offersResult.data.map((offer) => (
                    <TableRow key={offer.id}>
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
                        {format(offer.createdAt, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Visualizar">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Editar">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" title="Excluir">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Paginação */}
          {offersResult.totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="text-sm text-muted-foreground">
                Página {offersResult.page} de {offersResult.totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
onClick={() => {
                      const params = new URLSearchParams(resolvedSearchParams as Record<string, string>);
                      params.set("page", Math.max(1, offersResult.page - 1).toString());
                      window.location.search = params.toString();
                    }}
                  disabled={offersResult.page <= 1}
                >
                  Anterior
                </Button>
                {Array.from({ length: Math.min(5, offersResult.totalPages) }, (_, i) => {
                  const pageNumber = i + 1;
                  return (
                    <Button
                      key={pageNumber}
                      variant={offersResult.page === pageNumber ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const params = new URLSearchParams(resolvedSearchParams as Record<string, string>);
                        params.set("page", pageNumber.toString());
                        window.location.search = params.toString();
                      }}
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
onClick={() => {
                      const params = new URLSearchParams(resolvedSearchParams as Record<string, string>);
                      params.set("page", Math.min(offersResult.totalPages, offersResult.page + 1).toString());
                      window.location.search = params.toString();
                    }}
                  disabled={offersResult.page >= offersResult.totalPages}
                >
                  Próximo
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}