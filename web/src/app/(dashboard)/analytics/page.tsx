import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getClickStatsAction } from "@/actions/clicks";
import { MetricCard } from "@/components/metric-card";
import { ClicksLineChart, PlatformBarChart } from "@/components/charts";
import { StaggerContainer, StaggerItem } from "@/components/motion";
import { PlatformBadge } from "@/components/platform-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

export const metadata = { title: "Analytics" };

const periods = [
  { value: 7, label: "7d" },
  { value: 30, label: "30d" },
  { value: 90, label: "90d" },
  { value: 0, label: "Todo" },
];

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const sp = await searchParams;
  const periodRaw = Number(sp.period ?? "30");
  const period = periods.find((p) => p.value === periodRaw)?.value ?? 30;

  const stats = await getClickStatsAction(session.user.tenantId ?? "", period);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics de Cliques</h1>
          <p className="text-sm text-muted-foreground">
            Período: {period === 0 ? "Todo" : `${period} dias`}
          </p>
        </div>
        <div className="flex gap-2">
          {periods.map((p) => (
            <Link
              key={p.value}
              href={`/analytics?period=${p.value}`}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                period === p.value
                  ? "bg-brand-primary text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      <StaggerContainer className="grid gap-4 sm:grid-cols-3">
        <StaggerItem>
          <MetricCard
            icon="MousePointerClick"
            label="Total de cliques"
            value={String(stats.totalClicks)}
            accent="primary"
          />
        </StaggerItem>
        <StaggerItem>
          <MetricCard
            icon="Users"
            label="Cliques únicos"
            value={String(stats.uniqueClicks)}
            accent="teal"
          />
        </StaggerItem>
        <StaggerItem>
          <MetricCard
            icon="Zap"
            label="Cliques hoje"
            value={String(stats.clicksToday)}
            accent="amber"
          />
        </StaggerItem>
      </StaggerContainer>

      {stats.totalClicks === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          Nenhum clique registrado ainda
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border bg-card p-4">
              <h2 className="mb-4 text-sm font-semibold">Cliques por dia</h2>
              <ClicksLineChart data={stats.clicksByDay} />
            </div>
            <div className="rounded-lg border bg-card p-4">
              <h2 className="mb-4 text-sm font-semibold">
                Cliques por plataforma
              </h2>
              <PlatformBarChart data={stats.clicksByPlatform} />
            </div>
          </div>

          <div className="rounded-lg border bg-card">
            <h2 className="border-b p-4 text-sm font-semibold">
              Top 10 produtos
            </h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Plataforma</TableHead>
                  <TableHead>Cliques</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.topProducts.map((p) => (
                  <TableRow key={p.offerId}>
                    <TableCell className="font-medium max-w-xs truncate">
                      {p.title}
                    </TableCell>
                    <TableCell>
                      <PlatformBadge platform={p.platform} />
                    </TableCell>
                    <TableCell>{p.clicks}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
