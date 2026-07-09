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
import { Badge } from "@/components/ui/badge";
import { getDashboardMetricsAction, getRecentOffersAction, getOffersByDayAction } from "@/actions/affiliates";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"; 
import { BarChart, Bar, XAxis as XAxis2, YAxis as YAxis2, CartesianGrid as CartesianGrid2 } from "recharts";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;

  // Get dashboard metrics in parallel for optimal performance
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

  const statusVariants: Record<string, "secondary" | "default" | "destructive"> = {
    active: "default",
    suspended: "destructive",
    cancelled: "secondary",
  };

  // Transform data for chart components
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
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Bem-vindo, {user.name}!
        </p>
      </div>

      {/* Cards de Métricas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Plano
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                {planLabels[metrics.plan] || metrics.plan}
              </span>
              <Badge variant={statusVariants[metrics.status]}>
                {metrics.status === "active" ? "Ativo" : metrics.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Total de Ofertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{metrics.totalOffers}</span>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.publishedOffers} publicadas, {metrics.pendingOffers} pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Ofertas Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{metrics.todayOffers}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{metrics.activeSources}</span>
          </CardContent>
        </Card>
      </div>

      <Card>
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
                { label: "Amazon", value: metrics.affiliateConfig.amazonTag },
                { label: "Shopee", value: metrics.affiliateConfig.shopeeId },
                {
                  label: "Mercado Livre",
                  value: metrics.affiliateConfig.mlId,
                },
                {
                  label: "AliExpress",
                  value: metrics.affiliateConfig.aliexpressId,
                },
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
              Nenhuma configuração encontrada.
            </p>
          )}
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
