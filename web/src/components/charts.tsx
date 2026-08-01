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
} from "recharts";

interface ChartDataPoint {
  date: string;
  ofertas: number;
}

interface PlatformDataPoint {
  plataforma: string;
  quantidade: number;
}

export function OffersLineChart({ data }: { data: ChartDataPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
        Nenhum dado disponível
      </div>
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
      <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
        Nenhum dado disponível
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <defs>
          <linearGradient id="barPrimaryGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand-primary)" stopOpacity={1} />
            <stop offset="100%" stopColor="var(--color-brand-accent)" stopOpacity={0.7} />
          </linearGradient>
        </defs>
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
        />
        <Bar
          dataKey="quantidade"
          fill="url(#barPrimaryGradient)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
