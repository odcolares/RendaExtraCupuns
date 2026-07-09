"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Search, Filter, Download, Eye, Edit, Trash2, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { getPaginatedOffers } from "@/lib/dashboard";

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
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}

export default function OffersPage() {
  const { data: session } = useSession();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [totalOffers, setTotalOffers] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<OfferFilters>({ page: 1, pageSize: 10 });
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [showDateFilter, setShowDateFilter] = useState(false);

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

  useEffect(() => {
    setTenantId(session?.user?.tenantId || null);
  }, [session?.user?.tenantId]);

  useEffect(() => {
    if (tenantId) {
      loadOffers();
    }
  }, [tenantId, filters]);

  const loadOffers = async () => {
    if (!tenantId) return;
    
    setLoading(true);
    try {
      const result = await getPaginatedOffers(tenantId, filters);
      setOffers(result.data);
      setTotalOffers(result.total);
      setPage(result.page);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error("Failed to load offers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof OfferFilters, value: unknown) => {
    setFilters(prev => ({
      ...prev,
      [key]: value as never,
      page: 1,
    }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      pageSize: 10,
    });
    setShowDateFilter(false);
  };

  const hasActiveFilters = filters.search || filters.platform || filters.status || filters.startDate || filters.endDate;

  const formatPrice = (price: number | null) => {
    if (price === null) return "—";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const getPlatformBadgeVariant = (platform: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      amazon: "default",
      shopee: "secondary",
      mercadolivre: "outline",
      aliexpress: "destructive",
      outros: "outline",
    };
    return variants[platform] || "default";
  };

  const getStatusBadgeVariant = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      published: "default",
      pending: "secondary",
      failed: "destructive",
    };
    return variants[status] || "default";
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const variants = {
      published: "bg-green-100 text-green-800 border-green-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      failed: "bg-red-100 text-red-800 border-red-200",
    };
    return (
      <Badge
        variant="outline"
        className={`text-xs ${variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800"}`}
      >
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
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="platform">Plataforma</Label>
              <Select
                value={filters.platform || ""}
                onValueChange={(value) => handleFilterChange("platform", value || undefined)}
                disabled={loading}
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
                onValueChange={(value) => handleFilterChange("status", value || undefined)}
                disabled={loading}
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
              <Popover open={showDateFilter} onOpenChange={setShowDateFilter}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    disabled={loading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.startDate || filters.endDate ? (
                      <>
                        {filters.startDate && format(filters.startDate, "dd/MM/yyyy")}
                        {filters.endDate && ` - ${format(filters.endDate, "dd/MM/yyyy")}`}
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
                        value={filters.startDate ? format(filters.startDate, "yyyy-MM-dd") : ""}
                        onChange={(e) =>
                          handleFilterChange(
                            "startDate",
                            e.target.value ? new Date(e.target.value) : undefined
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-date">Data final</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={filters.endDate ? format(filters.endDate, "yyyy-MM-dd") : ""}
                        onChange={(e) =>
                          handleFilterChange(
                            "endDate",
                            e.target.value ? new Date(e.target.value) : undefined
                          )
                        }
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          handleFilterChange("startDate", undefined);
                          handleFilterChange("endDate", undefined);
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

          {hasActiveFilters && (
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {totalOffers} oferta{totalOffers !== 1 ? "s" : ""} encontrada{totalOffers !== 1 ? "s" : ""}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                disabled={loading}
              >
                Limpar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de ofertas */}
      <Card>
        <CardHeader>
          <CardTitle>Ofertas Encontradas</CardTitle>
          <CardDescription>
            {loading
              ? "Carregando..."
              : `${totalOffers} oferta${totalOffers !== 1 ? "s" : ""} (Página ${page} de ${totalPages})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Carregando ofertas...</span>
            </div>
          ) : offers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
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
                  {offers.map((offer) => (
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
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            title="Excluir"
                          >
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
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange("page", Math.max(1, page - 1))}
                  disabled={loading || page <= 1}
                >
                  Anterior
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNumber = i + 1;
                  return (
                    <Button
                      key={pageNumber}
                      variant={page === pageNumber ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFilterChange("page", pageNumber)}
                      disabled={loading}
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange("page", Math.min(totalPages, page + 1))}
                  disabled={loading || page >= totalPages}
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