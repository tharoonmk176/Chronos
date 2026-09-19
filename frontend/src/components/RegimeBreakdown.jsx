export default function RegimeBreakdown({ breakdown }) {
  if (!breakdown || Object.keys(breakdown).length === 0) return null;
  const rows = Object.entries(breakdown);
  return (
    <div>
      {" "}
      <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-50 uppercase tracking-wider mb-4">
        Performance by Market Regime
      </h3>{" "}
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-zinc-800 ">
        {" "}
        <table className="w-full text-left text-sm whitespace-nowrap">
          {" "}
          <thead className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-800 ">
            {" "}
            <tr>
              {" "}
              <th className="py-2 px-3 font-medium">Regime</th>{" "}
              <th className="py-2 px-3 font-medium text-right">Days</th>{" "}
              <th className="py-2 px-3 font-medium text-right">
                Avg Daily Return
              </th>{" "}
              <th className="py-2 px-3 font-medium text-right">
                Volatility
              </th>{" "}
            </tr>{" "}
          </thead>{" "}
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900 ">
            {" "}
            {rows.map(([label, stats]) => (
              <tr
                key={label}
                className="hover:bg-slate-50 dark:hover:bg-zinc-800 dark:bg-zinc-950 transition-colors"
              >
                {" "}
                <td className="py-2 px-3 font-medium text-slate-700 dark:text-zinc-300 ">
                  {label}
                </td>{" "}
                <td className="py-2 px-3 text-right text-slate-600 dark:text-zinc-400 ">
                  {stats.days}
                </td>{" "}
                <td
                  className={`py-2 px-3 text-right font-medium ${stats.avg_daily_return_percent >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
                >
                  {" "}
                  {stats.avg_daily_return_percent.toFixed(3)}%{" "}
                </td>{" "}
                <td className="py-2 px-3 text-right text-slate-600 dark:text-zinc-400 ">
                  {stats.volatility_percent.toFixed(2)}%
                </td>{" "}
              </tr>
            ))}{" "}
          </tbody>{" "}
        </table>{" "}
      </div>{" "}
    </div>
  );
}
