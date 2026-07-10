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
  cancelTenantAction,
} from "@/actions/admin";

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  active: "default",
  suspended: "destructive",
  cancelled: "secondary",
};

const platformLabels: Record<string, string> = {
  amazon: "Amazon",
  shopee: "Shopee",
  mercadolivre: "Mercado Livre",
  aliexpress: "AliExpress",
  outros: "Outros",
};

const offerStatusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  published: "default",
  pending: "secondary",
  failed: "destructive",
};

export default async function ClientDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const { id } = await props.params;

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      users: {
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      },
      affiliateConfig: true,
      _count: { select: { offers: true, fontes: true } },
    },
  });

  if (!tenant) {
    redirect("/admin");
  }

  const recentOffers = await prisma.offer.findMany({
    where: { tenantId: id },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      title: true,
      platform: true,
      status: true,
      price: true,
      createdAt: true,
      publishedAt: true,
    },
  });

  const fontes = await prisma.fonte.findMany({
    where: { tenantId: id },
    select: {
      id: true,
      name: true,
      isActive: true,
      lastChecked: true,
      totalOffersFound: true,
      totalOffersPublished: true,
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Voltar
            </Link>
          </div>
          <h1 className="text-3xl font-bold mt-2">
            {tenant.users[0]?.name || tenant.name}
          </h1>
          <p className="text-muted-foreground">{tenant.users[0]?.email}</p>
        </div>

        <div className="flex gap-2">
          <form
            action={async () => {
              "use server";
              await toggleTenantStatusAction(id);
            }}
          >
            <Button
              type="submit"
              variant={tenant.status === "active" ? "destructive" : "default"}
              size="sm"
            >
              {tenant.status === "active" ? "Suspender" : "Reativar"}
            </Button>
          </form>

          {tenant.status !== "cancelled" && (
            <form
              action={async () => {
                "use server";
                await cancelTenantAction(id);
              }}
              onSubmit={(e) => {
                if (!confirm("Tem certeza? Esta ação cancela o plano do cliente.")) {
                  e.preventDefault();
                }
              }}
            >
              <Button type="submit" variant="outline" size="sm">
                Cancelar Plano
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Plano
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <form
                action={async (formData: FormData) => {
                  "use server";
                  await changePlanAction(
                    id,
                    formData.get("plan") as "free" | "starter" | "professional"
                  );
                }}
              >
                <select
                  name="plan"
                  defaultValue={tenant.plan}
                  onChange={(e) => e.target.form?.requestSubmit()}
                  className="flex h-9 w-[140px] rounded-md border border-input bg-background px-2 text-sm font-medium"
                >
                  <option value="free">Free</option>
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                </select>
              </form>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={statusVariant[tenant.status]}>
              {tenant.status === "active" ? "Ativo" : tenant.status === "suspended" ? "Suspenso" : "Cancelado"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Total Ofertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{tenant._count.offers}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Fontes Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              {fontes.filter((f) => f.isActive).length}/{fontes.length}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Stripe Info */}
      {tenant.stripeSubscriptionId && (
        <Card>
          <CardHeader>
            <CardTitle>Stripe</CardTitle>
            <CardDescription>Informações de faturamento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer ID</span>
              <code className="text-xs">{tenant.stripeCustomerId}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subscription ID</span>
              <code className="text-xs">{tenant.stripeSubscriptionId}</code>
            </div>
            {tenant.expiresAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expira em</span>
                <span>{tenant.expiresAt.toLocaleDateString("pt-BR")}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Affiliate Config */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração de Afiliados</CardTitle>
          <CardDescription>
            IDs configurados para cada plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tenant.affiliateConfig ? (
            <div className="space-y-3">
              {[
                { label: "Amazon Tag", value: tenant.affiliateConfig.amazonTag },
                { label: "Shopee ID", value: tenant.affiliateConfig.shopeeId },
                { label: "Mercado Livre ID", value: tenant.affiliateConfig.mlId },
                { label: "AliExpress ID", value: tenant.affiliateConfig.aliexpressId },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-2 border-b last:border-b-0"
                >
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-sm text-muted-foreground">
                    {value || (
                      <span className="italic text-xs">não configurado</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Nenhuma configuração de afiliado encontrada.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Fontes WhatsApp */}
      <Card>
        <CardHeader>
          <CardTitle>Fontes WhatsApp</CardTitle>
          <CardDescription>
            {fontes.length} fonte{fontes.length !== 1 ? "s" : ""} configurada{fontes.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fontes.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhuma fonte configurada.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Última verificação</TableHead>
                  <TableHead>Ofertas encontradas</TableHead>
                  <TableHead>Publicadas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fontes.map((fonte) => (
                  <TableRow key={fonte.id}>
                    <TableCell className="font-medium">{fonte.name}</TableCell>
                    <TableCell>
                      <Badge variant={fonte.isActive ? "default" : "secondary"}>
                        {fonte.isActive ? "Ativa" : "Inativa"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {fonte.lastChecked.toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>{fonte.totalOffersFound}</TableCell>
                    <TableCell>{fonte.totalOffersPublished}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Offers */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Ofertas</CardTitle>
          <CardDescription>
            As 10 ofertas mais recentes deste cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentOffers.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhuma oferta encontrada.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Plataforma</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criada em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOffers.map((offer) => (
                  <TableRow key={offer.id}>
                    <TableCell className="font-medium max-w-[300px] truncate">
                      {offer.title}
                    </TableCell>
                    <TableCell>
                      {platformLabels[offer.platform] || offer.platform}
                    </TableCell>
                    <TableCell>
                      {offer.price
                        ? `R$ ${offer.price.toFixed(2)}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={offerStatusVariant[offer.status]}>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
