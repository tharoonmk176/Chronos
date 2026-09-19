import React, { useContext } from 'react';
import {
  ComposedChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { useRegion } from "../RegionContext";

export default function AdvancedTechnicalChart({ data }) {
  const { region } = useRegion();
  if (!data?.length) return null;

  const tickInterval = Math.max(1, Math.floor(data.length / 8));

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-50 uppercase tracking-wider mb-2">
        Bollinger Bands
      </h3>
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4">
        <ResponsiveContainer width="100%" height={250}>
          <ComposedChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
            <XAxis dataKey="date" interval={tickInterval} tick={{ fontSize: 11, fill: '#71717a' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#71717a' }} domain={['auto', 'auto']} tickFormatter={(v) => `${region.currency}${v}`} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }} />
            <Line type="monotone" dataKey="close" stroke="#8b5cf6" dot={false} strokeWidth={2} name="Close Price" />
            <Line type="monotone" dataKey="bb_upper" stroke="#ef4444" dot={false} strokeWidth={1} strokeDasharray="4 4" name="Upper Band" />
            <Line type="monotone" dataKey="bb_lower" stroke="#10b981" dot={false} strokeWidth={1} strokeDasharray="4 4" name="Lower Band" />
            <Area type="monotone" dataKey="bb_middle" stroke="none" fill="#64748b" fillOpacity={0.05} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-50 uppercase tracking-wider mb-2">RSI (14)</h3>
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4">
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="date" interval={tickInterval} tick={{ fontSize: 11, fill: '#71717a' }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#71717a' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }} />
                {/* Overbought / Oversold zones */}
                <Area type="step" dataKey={() => 70} stroke="none" fill="#ef4444" fillOpacity={0.05} />
                <Area type="step" dataKey={() => 30} stroke="none" fill="#10b981" fillOpacity={0.05} />
                <Line type="monotone" dataKey="rsi" stroke="#f59e0b" dot={false} strokeWidth={2} name="RSI" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-50 uppercase tracking-wider mb-2">MACD</h3>
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4">
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="date" interval={tickInterval} tick={{ fontSize: 11, fill: '#71717a' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#71717a' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }} />
                <Bar dataKey="macd_histogram" fill="#64748b" name="Histogram" />
                <Line type="monotone" dataKey="macd" stroke="#3b82f6" dot={false} strokeWidth={2} name="MACD" />
                <Line type="monotone" dataKey="macd_signal" stroke="#f43f5e" dot={false} strokeWidth={1.5} name="Signal" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
