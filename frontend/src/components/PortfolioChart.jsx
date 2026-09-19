import {
  AreaChart,
  Area,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ComposedChart
} from "recharts";

export default function PortfolioChart({
  dates,
  portfolioValues,
  benchmarkValues,
}) {
  if (!dates?.length) return null;
  const data = dates.map((date, i) => ({
    date,
    strategy: portfolioValues[i],
    benchmark: benchmarkValues ? benchmarkValues[i] : undefined,
  }));
  
  const tickInterval = Math.max(1, Math.floor(data.length / 8));
  
  return (
    <div>
      <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-50 uppercase tracking-wider mb-6">
        Portfolio Value — Strategy vs Buy & Hold Benchmark
      </h3>
      <ResponsiveContainer width="100%" height={340}>
        <ComposedChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorStrategy" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
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
            domain={["auto", "auto"]}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            itemStyle={{ color: 'var(--color-foreground)' }}
          />
          <Area 
            type="monotone" 
            dataKey="strategy" 
            stroke="#6366f1" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorStrategy)" 
            name="Strategy" 
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
          {benchmarkValues && (
            <Line 
              type="monotone" 
              dataKey="benchmark" 
              stroke="#a1a1aa" 
              dot={false} 
              strokeWidth={1.5} 
              strokeDasharray="4 4" 
              name="Buy & Hold" 
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
