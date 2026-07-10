import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function BillingPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const tenants = await prisma.tenant.findMany({
    select: {
      id: true,
      name: true,
      plan: true,
      status: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const activeTenants = tenants.filter((t) => t.status === "active");
  const payingTenants = activeTenants.filter((t) => t.plan !== "free");

  const planBreakdown = {
    free: activeTenants.filter((t) => t.plan === "free").length,
    starter: activeTenants.filter((t) => t.plan === "starter").length,
    professional: activeTenants.filter((t) => t.plan === "professional").length,
  };

  const estimatedMRR =
    planBreakdown.starter * 29 + planBreakdown.professional * 79;

  const mrrBreakdown = {
    starter: planBreakdown.starter * 29,
    professional: planBreakdown.professional * 79,
  };

  const totalOffers = await prisma.offer.count();
  const totalPublished = await prisma.offer.count({
    where: { status: "published" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Faturamento</h1>
        <p className="text-muted-foreground mt-1">
          Visão geral de receita e planos
        </p>
      </div>

      {/* Revenue Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              MRR Estimado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-green-600">
              R$ {estimatedMRR.toFixed(2)}
            </span>
            <p className="text-xs text-muted-foreground mt-1">
              Receita mensal recorrente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Clientes Pagantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{payingTenants.length}</span>
            <p className="text-xs text-muted-foreground mt-1">
              de {activeTenants.length} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              R${" "}
              {payingTenants.length > 0
                ? (estimatedMRR / payingTenants.length).toFixed(2)
                : "0,00"}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Ofertas Publicadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <span className="text-2xl font-bold">{totalPublished}</span>
              <span className="text-sm text-muted-foreground ml-1">
                / {totalOffers}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Planos</CardTitle>
            <CardDescription>
              Clientes ativos por plano
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                plan: "Free",
                count: planBreakdown.free,
                price: 0,
                color: "text-muted-foreground",
              },
              {
                plan: "Starter",
                count: planBreakdown.starter,
                price: 29,
                color: "text-blue-600",
              },
              {
                plan: "Professional",
                count: planBreakdown.professional,
                price: 79,
                color: "text-purple-600",
              },
            ].map(({ plan, count, price, color }) => (
              <div
                key={plan}
                className="flex items-center justify-between py-2"
              >
                <div>
                  <p className="font-medium">{plan}</p>
                  <p className="text-sm text-muted-foreground">
                    R$ {price}/mês
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${color}`}>{count}</p>
                  <p className="text-sm text-muted-foreground">
                    R$ {(count * price).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
            <div className="border-t pt-4 flex items-center justify-between">
              <p className="font-semibold">Total MRR</p>
              <p className="text-2xl font-bold text-green-600">
                R$ {estimatedMRR.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status dos Clientes</CardTitle>
            <CardDescription>
              Situação geral dos cadastros
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                label: "Ativos",
                count: tenants.filter((t) => t.status === "active").length,
                color: "text-green-600",
                variant: "default" as const,
              },
              {
                label: "Suspensos",
                count: tenants.filter((t) => t.status === "suspended").length,
                color: "text-red-600",
                variant: "destructive" as const,
              },
              {
                label: "Cancelados",
                count: tenants.filter((t) => t.status === "cancelled").length,
                color: "text-muted-foreground",
                variant: "secondary" as const,
              },
            ].map(({ label, count, variant }) => (
              <div
                key={label}
                className="flex items-center justify-between py-2"
              >
                <Badge variant={variant}>{label}</Badge>
                <span className="text-2xl font-bold">{count}</span>
              </div>
            ))}

            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">Com Stripe</p>
                <span className="text-lg font-bold">
                  {tenants.filter((t) => t.stripeSubscriptionId).length}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="font-medium text-sm">Sem Stripe</p>
                <span className="text-lg font-bold">
                  {tenants.filter((t) => !t.stripeSubscriptionId).length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MRR Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento MRR</CardTitle>
          <CardDescription>
            Cálculo detalhado da receita mensal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plano</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Clientes</TableHead>
                <TableHead>Receita</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Free</TableCell>
                <TableCell>R$ 0,00</TableCell>
                <TableCell>{planBreakdown.free}</TableCell>
                <TableCell>R$ 0,00</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Starter</TableCell>
                <TableCell>R$ 29,00</TableCell>
                <TableCell>{planBreakdown.starter}</TableCell>
                <TableCell>R$ {mrrBreakdown.starter.toFixed(2)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Professional</TableCell>
                <TableCell>R$ 79,00</TableCell>
                <TableCell>{planBreakdown.professional}</TableCell>
                <TableCell>R$ {mrrBreakdown.professional.toFixed(2)}</TableCell>
              </TableRow>
              <TableRow className="font-bold">
                <TableCell>Total</TableCell>
                <TableCell>—</TableCell>
                <TableCell>{payingTenants.length}</TableCell>
                <TableCell>R$ {estimatedMRR.toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
