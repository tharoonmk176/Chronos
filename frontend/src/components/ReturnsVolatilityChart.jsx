import React, { useContext } from "react";
import { useRegion } from "../RegionContext";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"; // 30-day rolling annualized volatility computed client-side from daily returns // (the backend exposes raw daily returns via /api/v1/indicators; this keeps // the indicator endpoint focused on price-derived series, not window-size choices).
function rollingVolatility(data, window = 30) {
  const out = new Array(data.length).fill(null);
  for (let i = window; i < data.length; i++) {
    const slice = data
      .slice(i - window, i)
      .map((d) => d.returns)
      .filter((v) => v !== null);
    if (slice.length < window / 2) continue;
    const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
    const variance =
      slice.reduce((a, b) => a + (b - mean) ** 2, 0) / (slice.length - 1);
    out[i] = Math.sqrt(variance) * Math.sqrt(252) * 100;
  }
  return out;
}
export default function ReturnsVolatilityChart({ data }) {
  const { region } = useRegion();
  if (!data?.length) return null;
  const vol = rollingVolatility(data);
  const chartData = data.map((d, i) => ({
    date: d.date,
    cumulative_return_pct:
      d.cumulative_returns !== null ? d.cumulative_returns * 100 : null,
    volatility_pct: vol[i],
  }));
  const tickInterval = Math.max(1, Math.floor(chartData.length / 8));
  return (
    <div>
      <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-50 uppercase tracking-wider mb-6">
        Cumulative Returns & Rolling Volatility
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="var(--color-border)"
          />
          <XAxis
            dataKey="date"
            interval={tickInterval}
            tick={{ fontSize: 11, fill: "#71717a" }}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#71717a" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--color-card)",
              borderColor: "var(--color-border)",
              color: "var(--color-foreground)",
              borderRadius: "0.5rem",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
            itemStyle={{ color: "var(--color-foreground)" }}
          />
          <Line
            type="monotone"
            dataKey="cumulative_return_pct"
            stroke="#3b82f6"
            dot={false}
            strokeWidth={2}
            name="Cumulative Return %"
          />
          <Line
            type="monotone"
            dataKey="volatility_pct"
            stroke="#f97316"
            dot={false}
            strokeWidth={1.5}
            name="30d Volatility %"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
