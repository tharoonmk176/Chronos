import React, { useContext } from "react";
import { useRegion } from "../RegionContext";
import {
  AreaChart,
  Area,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function DrawdownChart({ dates, portfolioValues }) {
  const { region } = useRegion();
  if (!dates?.length) return null;
  
  let runningMax = -Infinity;
  const data = dates.map((date, i) => {
    const value = portfolioValues[i];
    runningMax = Math.max(runningMax, value);
    const drawdown_pct = ((value - runningMax) / runningMax) * 100;
    return { date, drawdown: drawdown_pct };
  });

  const tickInterval = Math.max(1, Math.floor(data.length / 8));

  return (
    <div>
      <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-50 uppercase tracking-wider mb-6">
        Underwater Plot (Drawdown)
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorDrawdown" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
          <XAxis 
            dataKey="date" 
            interval={tickInterval} 
            tick={{ fontSize: 11, fill: '#71717a' }} 
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis 
            tick={{ fontSize: 11, fill: '#71717a' }} 
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value.toFixed(1)}%`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            itemStyle={{ color: 'var(--color-foreground)' }}
            formatter={(val) => [`${val.toFixed(2)}%`, 'Drawdown']}
          />
          <Area 
            type="monotone" 
            dataKey="drawdown" 
            stroke="#ef4444" 
            strokeWidth={1.5}
            fillOpacity={1} 
            fill="url(#colorDrawdown)" 
            name="Drawdown" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
