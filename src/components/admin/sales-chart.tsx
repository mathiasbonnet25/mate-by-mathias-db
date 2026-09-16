"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatPrice } from "@/lib/utils";

/**
 * Courbe du chiffre d'affaires journalier.
 * Les couleurs proviennent des variables de thème pour rester lisibles en
 * mode clair comme en mode sombre.
 */
export function SalesChart({
  data,
}: {
  data: { date: string; cents: number }[];
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="goldFade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "var(--foreground-muted)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            tickFormatter={(value: string) => value.slice(8)}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--foreground-muted)" }}
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(value: number) => `${Math.round(value / 100)} €`}
          />
          <Tooltip
            contentStyle={{
              background: "var(--surface-elevated)",
              border: "1px solid var(--border)",
              borderRadius: 0,
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--foreground-muted)" }}
            formatter={(value: number) => [formatPrice(value), "Chiffre d'affaires"]}
            labelFormatter={(label: string) =>
              new Date(label).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "long",
              })
            }
          />
          <Area
            type="monotone"
            dataKey="cents"
            stroke="var(--accent)"
            strokeWidth={1.5}
            fill="url(#goldFade)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
