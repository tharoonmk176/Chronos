import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
  Area
} from "recharts";

export default function PriceChart({ data }) {
  if (!data?.length) return null;

  const buys = data.filter((d) => d.signal === 1).map((d) => ({ date: d.date, close: d.close }));
  const sells = data.filter((d) => d.signal === -1).map((d) => ({ date: d.date, close: d.close }));
  const tickInterval = Math.max(1, Math.floor(data.length / 8));

  return (
    <div>
      <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-50 uppercase tracking-wider mb-6">
        Price, Moving Averages & Signals
      </h3>
      <ResponsiveContainer width="100%" height={340}>
        <ComposedChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
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
            allowDuplicatedCategory={false} 
          />
          <YAxis 
            tick={{ fontSize: 11, fill: '#71717a' }} 
            tickLine={false}
            axisLine={false}
            domain={["auto", "auto"]} 
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            itemStyle={{ color: 'var(--color-foreground)' }}
          />
          <Area 
            type="monotone" 
            dataKey="close" 
            stroke="#8b5cf6" 
            strokeWidth={1.5}
            fillOpacity={1} 
            fill="url(#colorPrice)" 
            name="Close" 
          />
          <Line 
            type="monotone" 
            dataKey="sma_fast" 
            stroke="#10b981" 
            dot={false} 
            strokeWidth={1.5} 
            name="SMA Fast" 
          />
          <Line 
            type="monotone" 
            dataKey="sma_slow" 
            stroke="#f59e0b" 
            dot={false} 
            strokeWidth={1.5} 
            name="SMA Slow" 
          />
          <Scatter data={buys} dataKey="close" fill="#10b981" shape="triangle" name="Buy" />
          <Scatter data={sells} dataKey="close" fill="#ef4444" shape="triangle" name="Sell" />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="text-xs text-slate-500 dark:text-zinc-400 mt-4 flex items-center justify-center gap-6">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#8b5cf6] inline-block" /> Price</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#10b981] inline-block" /> SMA Fast</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#f59e0b] inline-block" /> SMA Slow</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rotate-180 bg-[#ef4444] inline-block" style={{clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}} /> Sell Signal</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#10b981] inline-block" style={{clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}} /> Buy Signal</span>
      </div>
    </div>
  );
}
