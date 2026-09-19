export default function TradesList({ trades }) {
  if (!trades?.length)
    return (
      <div className="text-sm text-slate-500 dark:text-zinc-400 py-4 text-center">
        No trades executed for this run.
      </div>
    );
  return (
    <div>
      {" "}
      <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-50 uppercase tracking-wider mb-4">
        Trade Log ({trades.length})
      </h3>{" "}
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-zinc-800 ">
        {" "}
        <div className="max-h-80 overflow-y-auto">
          {" "}
          <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
            {" "}
            <thead className="sticky top-0 bg-slate-50 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-800 ">
              {" "}
              <tr>
                {" "}
                <th className="py-2 px-3 font-medium">#</th>{" "}
                <th className="py-2 px-3 font-medium">Type</th>{" "}
                <th className="py-2 px-3 font-medium">Date</th>{" "}
                <th className="py-2 px-3 font-medium text-right">Price</th>{" "}
                <th className="py-2 px-3 font-medium text-right">Shares</th>{" "}
                <th className="py-2 px-3 font-medium text-right">
                  Profit
                </th>{" "}
              </tr>{" "}
            </thead>{" "}
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {" "}
              {trades.map((t) => (
                <tr
                  key={t.trade_number}
                  className="hover:bg-slate-50 dark:hover:bg-zinc-800 dark:bg-zinc-950 transition-colors"
                >
                  {" "}
                  <td className="py-2 px-3 text-slate-500 dark:text-zinc-400 ">
                    {t.trade_number}
                  </td>{" "}
                  <td className="py-2 px-3">
                    {" "}
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${t.type === "BUY" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400" : "bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-400"}`}
                    >
                      {" "}
                      {t.type}{" "}
                    </span>{" "}
                  </td>{" "}
                  <td className="py-2 px-3 text-slate-900 dark:text-zinc-50 ">
                    {t.date}
                  </td>{" "}
                  <td className="py-2 px-3 text-right font-medium text-slate-900 dark:text-zinc-50 ">
                    ${t.price.toFixed(2)}
                  </td>{" "}
                  <td className="py-2 px-3 text-right text-slate-600 dark:text-zinc-400 ">
                    {t.shares.toFixed(4)}
                  </td>{" "}
                  <td
                    className={`py-2 px-3 text-right font-medium ${!t.profit ? "text-slate-400" : t.profit > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
                  >
                    {" "}
                    {t.profit !== null && t.profit !== undefined
                      ? `$${t.profit.toFixed(2)}`
                      : "—"}{" "}
                  </td>{" "}
                </tr>
              ))}{" "}
            </tbody>{" "}
          </table>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
