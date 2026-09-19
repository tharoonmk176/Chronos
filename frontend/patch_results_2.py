import os

with open('src/components/ResultsTable.jsx', 'r') as f:
    content = f.read()

# Replace the whole top portion up to export default function ResultsTable
new_top = """import { TrendingUp, TrendingDown, Activity, Percent, Crosshair, BarChart2 } from 'lucide-react';

function fmt(n, suffix = "") {
  if (n === null || n === undefined) return "—";
  return `${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}${suffix}`;
}

function StatCard({
  label,
  value,
  subtext = null,
  highlight = false,
  negative = false,
  icon: Icon
}) {
  return (
    <div
      className={`p-5 rounded-xl border transition-all hover:-translate-y-1 hover:shadow-md ${highlight ? "bg-indigo-50 dark:bg-indigo-500/20 border-indigo-100 dark:border-indigo-500/30 " : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 "} shadow-sm flex flex-col`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
          {label}
        </span>
        {Icon && <Icon className={`w-4 h-4 ${highlight ? 'text-indigo-500' : 'text-slate-400 dark:text-zinc-500'}`} />}
      </div>
      <div className="flex items-baseline gap-2">
        <span
          className={`text-2xl font-bold tracking-tight ${negative ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-zinc-50 "}`}
        >
          {value}
        </span>
      </div>
      {subtext && (
        <span className="text-xs font-medium text-slate-400 dark:text-zinc-500 mt-1">{subtext}</span>
      )}
    </div>
  );
}
"""

import re
content = re.sub(r'^.*?export default function ResultsTable', new_top + 'export default function ResultsTable', content, flags=re.DOTALL)

# Inject icons
content = content.replace('label="Total Return"', 'label="Total Return" icon={Activity}')
content = content.replace('label="Annualized"', 'label="Annualized" icon={TrendingUp}')
content = content.replace('label="Sharpe Ratio"', 'label="Sharpe Ratio" icon={BarChart2}')
content = content.replace('label="Max Drawdown"', 'label="Max Drawdown" icon={TrendingDown}')
content = content.replace('label="Win Rate"', 'label="Win Rate" icon={Crosshair}')

with open('src/components/ResultsTable.jsx', 'w') as f:
    f.write(content)
