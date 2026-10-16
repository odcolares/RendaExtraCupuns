import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RefreshCw, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { PlatformBadge } from "@/components/platform-badge";
import { StaggerContainer, StaggerItem } from "@/components/motion";
import { getDashboardMetricsAction, getRecentOffersAction, getOffersByDayAction } from "@/actions/affiliates";
import { OffersLineChart, PlatformBarChart } from "@/components/charts";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;

  const lastUpdated = new Date();

  const [metrics, recentOffers, offersByDay] = await Promise.all([
    getDashboardMetricsAction(user.tenantId || ""),
    getRecentOffersAction(user.tenantId || ""),
    getOffersByDayAction(user.tenantId || ""),
  ]);

  const planLabels: Record<string, string> = {
    free: "Free",
    starter: "Starter",
    professional: "Professional",
  };

  const chartData = offersByDay.map((day) => ({
    date: day.date,
    ofertas: day.count,
  }));

  const chartPlatformData = metrics.platformCounts.map((platform) => ({
    plataforma: platform.platform.charAt(0).toUpperCase() + platform.platform.slice(1),
    quantidade: platform.count,
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description={`Bem-vindo, ${user.name}!`}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-4" />
            <span>Atualizado em {format(lastUpdated, "PPp", { locale: ptBR })}</span>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="size-4" />
              Atualizar
            </Button>
          </Link>
        </div>
      </PageHeader>

      {/* Cards de Métricas */}
      <StaggerContainer className="grid gap-4 md:grid-cols-4">
        <StaggerItem>
          <MetricCard
            icon="Crown"
            label="Plano"
            value={planLabels[metrics.plan] || metrics.plan}
            hint={metrics.status === "active" ? "Ativo" : metrics.status}
            accent="primary"
          />
        </StaggerItem>

        <StaggerItem>
          <MetricCard
            icon="Tags"
            label="Total de Ofertas"
            value={String(metrics.totalOffers)}
            hint={`${metrics.publishedOffers} publicadas, ${metrics.pendingOffers} pendentes`}
            accent="teal"
          />
        </StaggerItem>

        <StaggerItem>
          <MetricCard
            icon="TrendingUp"
            label="Ofertas Hoje"
            value={String(metrics.todayOffers)}
            accent="amber"
          />
        </StaggerItem>

        <StaggerItem>
          <MetricCard
            icon="Radio"
            label="Ativas"
            value={String(metrics.activeSources)}
            accent="violet"
          />
        </StaggerItem>
      </StaggerContainer>

      <Card className="border-t-2 border-t-brand-primary/30">
        <CardHeader>
          <CardTitle>Configuração de Afiliados</CardTitle>
          <CardDescription>
            Gerencie seus IDs de afiliado para cada plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.affiliateConfig ? (
            <div className="space-y-3">
              {[
                { platform: "amazon", label: "Amazon Tag", value: metrics.affiliateConfig.amazonTag },
                { platform: "shopee", label: "Shopee ID", value: metrics.affiliateConfig.shopeeId },
                { platform: "mercadolivre", label: "Mercado Livre ID", value: metrics.affiliateConfig.mlId },
                { platform: "aliexpress", label: "AliExpress ID", value: metrics.affiliateConfig.aliexpressId },
              ].map(({ platform, label, value }) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-3 px-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <PlatformBadge platform={platform} showIcon />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
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
              Nenhuma configuração encontrada.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-t-2 border-t-brand-primary/30">
        <CardHeader>
          <CardTitle>Ofertas por Dia</CardTitle>
          <CardDescription>
            Distribuição de ofertas capturadas nos últimos dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OffersLineChart data={chartData} />
        </CardContent>
      </Card>

      <Card className="border-t-2 border-t-brand-primary/30">
        <CardHeader>
          <CardTitle>Ofertas por Plataforma</CardTitle>
          <CardDescription>
            Quantidade de ofertas por plataforma de afiliados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlatformBarChart data={chartPlatformData} />
        </CardContent>
      </Card>

      {user.role === "admin" && (
        <Card>
          <CardHeader>
            <CardTitle>Painel Admin</CardTitle>
            <CardDescription>
              Gerencie todos os clientes e planos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin">
              <Button>Acessar Admin</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
