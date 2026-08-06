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
import { getOfferByIdAction, updateOfferAction, deleteOfferAction, createOfferAction } from "@/actions/offers";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import { Plus } from "lucide-react";
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

  const [viewOfferId, setViewOfferId] = useState<string | null>(null);
  const [editOfferId, setEditOfferId] = useState<string | null>(null);
  const [deleteOfferId, setDeleteOfferId] = useState<string | null>(null);
  const [createOfferId, setCreateOfferId] = useState<string | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    price: "",
    status: "pending",
    description: "",
  });
  const [createForm, setCreateForm] = useState({
    title: "",
    url: "",
    platform: "outros",
    price: "",
    originalPrice: "",
    discount: "",
    imageUrl: "",
    description: "",
    status: "pending",
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const loadOffer = useCallback(async (id: string) => {
    setActionLoading(true);
    const offer = await getOfferByIdAction(id, tenantId || "");
    setSelectedOffer(offer);
    setActionLoading(false);
    return offer;
  }, [tenantId]);

  const refreshOffers = useCallback(() => {
    setRefreshCounter((prev) => prev + 1);
  }, []);

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
  }, [tenantId, filters.search, filters.platform, filters.status, filters.startDate, filters.endDate, filters.page, refreshCounter]);

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

  const handleView = useCallback(async (id: string) => {
    await loadOffer(id);
    setViewOfferId(id);
  }, [loadOffer]);

  const handleEdit = useCallback(async (id: string) => {
    const offer = await loadOffer(id);
    setEditForm({
      title: offer?.title || "",
      price: offer?.price != null ? String(offer.price) : "",
      status: offer?.status || "pending",
      description: offer?.description || "",
    });
    setEditOfferId(id);
  }, [loadOffer]);

  const handleDelete = useCallback((id: string) => {
    setDeleteOfferId(id);
  }, []);

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editOfferId) return;
    await updateOfferAction(editOfferId, tenantId || "", {
      title: editForm.title,
      price: editForm.price ? parseFloat(editForm.price) : null,
      status: editForm.status as "pending" | "published" | "failed",
      description: editForm.description || null,
    });
    setEditOfferId(null);
    refreshOffers();
  };

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!tenantId) return;
    setActionLoading(true);
    await createOfferAction(tenantId, {
      title: createForm.title,
      url: createForm.url,
      platform: createForm.platform as "amazon" | "shopee" | "mercadolivre" | "aliexpress" | "outros",
      price: createForm.price ? parseFloat(createForm.price) : null,
      originalPrice: createForm.originalPrice ? parseFloat(createForm.originalPrice) : null,
      discount: createForm.discount ? parseFloat(createForm.discount) : null,
      imageUrl: createForm.imageUrl || null,
      description: createForm.description || null,
      status: createForm.status as "pending" | "published" | "failed",
    });
    setCreateForm({
      title: "",
      url: "",
      platform: "outros",
      price: "",
      originalPrice: "",
      discount: "",
      imageUrl: "",
      description: "",
      status: "pending",
    });
    setCreateOfferId(null);
    setActionLoading(false);
    refreshOffers();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteOfferId) return;
    await deleteOfferAction(deleteOfferId, tenantId || "");
    setDeleteOfferId(null);
    setSelectedOffer(null);
    refreshOffers();
  };

  if (status === "loading") return <div className="p-8 text-muted-foreground">Carregando…</div>;
  if (!session?.user) {
    redirect("/login");
  }

  if (!tenantId) {
    return <div className="p-8 text-muted-foreground">Sessão sem tenant. Faça login novamente ou verifique sua conta.</div>;
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
      >
        <Button onClick={() => setCreateOfferId("create")} className="gap-2">
          <Plus className="size-4" />
          Nova oferta
        </Button>
      </PageHeader>

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
                          <Button variant="ghost" size="icon" className="size-8 hover:text-brand-primary" title="Visualizar" onClick={() => handleView(offer.id)}>
                            <Eye className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="size-8 hover:text-brand-primary" title="Editar" onClick={() => handleEdit(offer.id)}>
                            <Edit className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" title="Excluir" onClick={() => handleDelete(offer.id)}>
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

      {/* View Sheet */}
      <Sheet open={!!viewOfferId} onOpenChange={(open) => !open && setViewOfferId(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Detalhes da Oferta</SheetTitle>
            <SheetDescription>Informações completas da oferta selecionada</SheetDescription>
          </SheetHeader>
          {actionLoading || !selectedOffer ? (
            <div className="p-4 text-sm text-muted-foreground">Carregando...</div>
          ) : (
            <div className="space-y-4 p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Título</p>
                <p className="text-sm font-medium">{selectedOffer.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Plataforma</p>
                  <p className="text-sm capitalize">{selectedOffer.platform}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Status</p>
                  <p className="text-sm capitalize">{selectedOffer.status}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Preço</p>
                  <p className="text-sm">{selectedOffer.price != null ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(selectedOffer.price) : "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Preço Original</p>
                  <p className="text-sm">{selectedOffer.originalPrice != null ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(selectedOffer.originalPrice) : "—"}</p>
                </div>
              </div>
              {selectedOffer.discount != null && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Desconto</p>
                  <p className="text-sm">{selectedOffer.discount}%</p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-muted-foreground">Link</p>
                <a href={selectedOffer.url} target="_blank" rel="noreferrer" className="text-sm text-brand-primary underline break-all">{selectedOffer.url}</a>
              </div>
              {selectedOffer.imageUrl && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Imagem</p>
                  <img src={selectedOffer.imageUrl} alt={selectedOffer.title} className="mt-1 rounded-md border max-h-48 object-contain" />
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Criado em {new Date(selectedOffer.createdAt).toLocaleString("pt-BR")}
              </div>
            </div>
          )}
          <SheetFooter>
            <Button variant="outline" onClick={() => setViewOfferId(null)}>Fechar</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Edit Sheet */}
      <Sheet open={!!editOfferId} onOpenChange={(open) => !open && setEditOfferId(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Editar Oferta</SheetTitle>
            <SheetDescription>Atualize os dados da oferta</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 p-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Título</Label>
              <Input id="edit-title" value={editForm.title} onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-price">Preço (R$)</Label>
              <Input id="edit-price" type="number" step="0.01" value={editForm.price} onChange={(e) => setEditForm((prev) => ({ ...prev, price: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={editForm.status} onValueChange={(value) => setEditForm((prev) => ({ ...prev, status: value || "pending" }))}>
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                  <SelectItem value="failed">Falhou</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Descrição da oferta..."
              />
            </div>
            <SheetFooter>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading ? "Salvando..." : "Salvar"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setEditOfferId(null)}>Cancelar</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete Sheet */}
      <Sheet open={!!deleteOfferId} onOpenChange={(open) => !open && setDeleteOfferId(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Excluir Oferta</SheetTitle>
            <SheetDescription>Essa ação não pode ser desfeita.</SheetDescription>
          </SheetHeader>
          <div className="p-4">
            <p className="text-sm text-muted-foreground">Deseja realmente excluir esta oferta? Essa ação remove o registro permanentemente do banco de dados.</p>
          </div>
          <SheetFooter>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={actionLoading}>
              {actionLoading ? "Excluindo..." : "Excluir"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setDeleteOfferId(null)}>Cancelar</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Create Sheet */}
      <Sheet open={!!createOfferId} onOpenChange={(open) => !open && setCreateOfferId(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Nova Oferta</SheetTitle>
            <SheetDescription>Adicione uma oferta manualmente</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4 p-4">
            <div className="space-y-2">
              <Label htmlFor="create-title">Título *</Label>
              <Input id="create-title" value={createForm.title} onChange={(e) => setCreateForm((prev) => ({ ...prev, title: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-url">URL *</Label>
              <Input id="create-url" type="url" value={createForm.url} onChange={(e) => setCreateForm((prev) => ({ ...prev, url: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-platform">Plataforma *</Label>
              <Select value={createForm.platform} onValueChange={(value) => setCreateForm((prev) => ({ ...prev, platform: value || "outros" }))}>
                <SelectTrigger id="create-platform">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {platformOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-price">Preço (R$)</Label>
                <Input id="create-price" type="number" step="0.01" value={createForm.price} onChange={(e) => setCreateForm((prev) => ({ ...prev, price: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-originalPrice">Preço Original (R$)</Label>
                <Input id="create-originalPrice" type="number" step="0.01" value={createForm.originalPrice} onChange={(e) => setCreateForm((prev) => ({ ...prev, originalPrice: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-discount">Desconto (%)</Label>
              <Input id="create-discount" type="number" step="0.01" value={createForm.discount} onChange={(e) => setCreateForm((prev) => ({ ...prev, discount: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-imageUrl">Imagem URL</Label>
              <Input id="create-imageUrl" type="url" value={createForm.imageUrl} onChange={(e) => setCreateForm((prev) => ({ ...prev, imageUrl: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-description">Descrição</Label>
              <textarea
                id="create-description"
                value={createForm.description}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Descrição da oferta..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-status">Status</Label>
              <Select value={createForm.status} onValueChange={(value) => setCreateForm((prev) => ({ ...prev, status: value || "pending" }))}>
                <SelectTrigger id="create-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                  <SelectItem value="failed">Falhou</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <SheetFooter>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading ? "Criando..." : "Criar oferta"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setCreateOfferId(null)}>Cancelar</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
