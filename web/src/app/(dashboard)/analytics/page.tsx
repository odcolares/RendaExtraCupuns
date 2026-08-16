import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getClickStatsAction } from "@/actions/clicks";
import { MetricCard } from "@/components/metric-card";
import { ClicksLineChart, PlatformBarChart } from "@/components/charts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { MousePointerClick, Users, Zap } from "lucide-react";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const sp = await searchParams;
  const periodRaw = Number(sp.period ?? "30");
  const period = periodRaw === 7 || periodRaw === 90 ? periodRaw : 30;

  const stats = await getClickStatsAction(session.user.tenantId ?? "", period);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics de Cliques</h1>
          <p className="text-sm text-muted-foreground">
            Período: {period} dias
          </p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((p) => (
            <Link
              key={p}
              href={`/analytics?period=${p}`}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                period === p
                  ? "bg-brand-primary text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {p}d
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          icon={MousePointerClick}
          label="Total de cliques"
          value={String(stats.totalClicks)}
        />
        <MetricCard
          icon={Users}
          label="Cliques únicos"
          value={String(stats.uniqueClicks)}
        />
        <MetricCard
          icon={Zap}
          label="Cliques hoje"
          value={String(stats.clicksToday)}
        />
      </div>

      {stats.totalClicks === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          Nenhum clique registrado ainda
        </div>
      ) : (
        <>
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
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell>{p.platform}</TableCell>
                    <TableCell>{p.clicks}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}