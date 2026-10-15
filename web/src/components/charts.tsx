"use client";

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Cell,
  LabelList,
} from "recharts";
import { EmptyState } from "@/components/empty-state";
import { BarChart3 } from "lucide-react";

interface ChartDataPoint {
  date: string;
  ofertas: number;
}

interface PlatformDataPoint {
  plataforma: string;
  quantidade: number;
}

interface ClicksDataPoint {
  date: string;
  count: number;
}

export function OffersLineChart({ data }: { data: ChartDataPoint[] }) {
  if (data.length === 0) {
    return (
      <EmptyState
        title="Sem dados"
        description="Nenhuma oferta capturada no período selecionado."
        icon={<BarChart3 className="size-8" />}
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand-primary)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--color-brand-accent)" stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="date" className="text-xs text-muted-foreground" />
        <YAxis className="text-xs text-muted-foreground" allowDecimals={false} />
        <Tooltip
          contentStyle={{
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
            background: "var(--card)",
          }}
          labelStyle={{ fontWeight: 600 }}
          formatter={(value: number) => [`${value} ofertas`, "Ofertas"]}
        />
        <Area
          type="monotone"
          dataKey="ofertas"
          stroke="var(--color-brand-primary)"
          strokeWidth={2}
          fill="url(#primaryGradient)"
          dot={{ r: 3, fill: "var(--color-brand-primary)" }}
          activeDot={{ r: 6, fill: "var(--color-brand-primary)" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function PlatformBarChart({ data }: { data: PlatformDataPoint[] }) {
  if (data.length === 0) {
    return (
      <EmptyState
        title="Sem dados"
        description="Nenhuma oferta capturada no período selecionado."
        icon={<BarChart3 className="size-8" />}
      />
    );
  }

  const platformColors: Record<string, string> = {
    Amazon: "#FF9900",
    Shopee: "#EE4D2D",
    Mercado_Livre: "#FFE600",
    AliExpress: "#FF4747",
    Outros: "#64748b",
  };

  const getBarColor = (platform: string) =>
    platformColors[platform] || "var(--color-brand-primary)";

  const formatTooltip = (value: number) => `${value} ofertas`;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="plataforma" className="text-xs text-muted-foreground" />
        <YAxis className="text-xs text-muted-foreground" allowDecimals={false} />
        <Tooltip
          contentStyle={{
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
            background: "var(--card)",
          }}
          labelStyle={{ fontWeight: 600 }}
          formatter={formatTooltip}
        />
        <Bar
          dataKey="quantidade"
          radius={[4, 4, 0, 0]}
          fill="var(--color-brand-primary)"
          isAnimationActive
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={getBarColor(entry.plataforma)}
            />
          ))}
          <LabelList
            position="top"
            className="text-xs text-muted-foreground"
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ClicksLineChart({ data }: { data: ClicksDataPoint[] }) {
  if (data.length === 0) {
    return (
      <EmptyState
        title="Sem dados"
        description="Nenhum clique registrado no período selecionado."
        icon={<BarChart3 className="size-8" />}
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="date" className="text-xs text-muted-foreground" />
        <YAxis className="text-xs text-muted-foreground" allowDecimals={false} />
        <Tooltip
          contentStyle={{
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
            background: "var(--card)",
          }}
          labelStyle={{ fontWeight: 600 }}
          formatter={(value: number) => [`${value} cliques`, "Cliques"]}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke="var(--color-brand-primary)"
          strokeWidth={2}
          dot={{ r: 3, fill: "var(--color-brand-primary)" }}
          activeDot={{ r: 6, fill: "var(--color-brand-primary)" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
