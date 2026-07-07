import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;

  const tenant = user.tenantId
    ? await prisma.tenant.findUnique({
        where: { id: user.tenantId },
        include: {
          affiliateConfig: true,
          _count: { select: { offers: true } },
        },
      })
    : null;

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Bem-vindo, {user.name}!
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Plano
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                {tenant ? planLabels[tenant.plan] : "—"}
              </span>
              {tenant && (
                <Badge variant={statusVariants[tenant.status]}>
                  {tenant.status === "active" ? "Ativo" : tenant.status}
                </Badge>
              )}
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
            <span className="text-2xl font-bold">
              {tenant?._count.offers ?? 0}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              {tenant?.status === "active" ? "Operacional" : "Pendente"}
            </span>
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
          {tenant?.affiliateConfig ? (
            <div className="space-y-3">
              {[
                { label: "Amazon", value: tenant.affiliateConfig.amazonTag },
                { label: "Shopee", value: tenant.affiliateConfig.shopeeId },
                {
                  label: "Mercado Livre",
                  value: tenant.affiliateConfig.mlId,
                },
                {
                  label: "AliExpress",
                  value: tenant.affiliateConfig.aliexpressId,
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
