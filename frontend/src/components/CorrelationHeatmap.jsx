import { useState } from "react";
import { getCorrelation } from "../api/client";
function colorFor(value) {
  if (value === undefined || value === null) return "var(--color-background)";
  const intensity = Math.min(1, Math.abs(value));
  return value >= 0
    ? `rgba(16, 185, 129, ${intensity * 0.7})`
    : `rgba(239, 68, 68, ${intensity * 0.7})`;
}
function textColorFor(value) {
  if (value === undefined || value === null) return "var(--color-foreground)";
  const intensity = Math.min(1, Math.abs(value));
  return intensity > 0.6 ? "#fff" : "var(--color-foreground)";
}
export default function CorrelationHeatmap() {
  const [tickers, setTickers] = useState("BTC-USD, GLD, NVDA");
  const [startDate, setStartDate] = useState("2023-01-01");
  const [endDate, setEndDate] = useState("2024-01-01");
  const [matrix, setMatrix] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const run = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const list = tickers
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const data = await getCorrelation({
        tickers: list,
        start_date: startDate,
        end_date: endDate,
      });
      setMatrix(data.correlation_matrix);
      setAssets(data.assets);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div>
      {" "}
      <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-50 uppercase tracking-wider mb-4">
        Cross-Asset Correlation
      </h3>{" "}
      <form className="flex flex-col sm:flex-row gap-3 mb-6" onSubmit={run}>
        {" "}
        <input
          className="flex-1 px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={tickers}
          onChange={(e) => setTickers(e.target.value)}
          placeholder="BTC-USD, GLD, NVDA"
        />{" "}
        <input
          type="date"
          className="w-36 px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />{" "}
        <input
          type="date"
          className="w-36 px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />{" "}
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-70 text-sm whitespace-nowrap"
        >
          {" "}
          {loading ? "Loading…" : "Compute"}{" "}
        </button>{" "}
      </form>{" "}
      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm border border-red-100 dark:border-red-500/30">
          {error}
        </div>
      )}{" "}
      {matrix && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-zinc-800 ">
          {" "}
          <table className="w-full text-center border-collapse text-sm">
            {" "}
            <thead>
              {" "}
              <tr>
                {" "}
                <th className="bg-slate-100 dark:bg-zinc-800 border-b border-slate-200 dark:border-zinc-800 p-2"></th>{" "}
                {assets.map((a) => (
                  <th
                    key={a}
                    className="bg-slate-50 dark:bg-zinc-950 border-b border-l border-slate-200 dark:border-zinc-800 p-2 font-medium text-slate-700 dark:text-zinc-300 "
                  >
                    {a}
                  </th>
                ))}{" "}
              </tr>{" "}
            </thead>{" "}
            <tbody>
              {" "}
              {assets.map((rowAsset) => (
                <tr key={rowAsset}>
                  {" "}
                  <th className="bg-slate-100 dark:bg-zinc-800 border-b border-slate-200 dark:border-zinc-800 p-2 font-medium text-slate-700 dark:text-zinc-300 text-left">
                    {rowAsset}
                  </th>{" "}
                  {assets.map((colAsset) => {
                    const v = matrix[rowAsset]?.[colAsset];
                    return (
                      <td
                        key={colAsset}
                        className="border-b border-l border-slate-200 dark:border-zinc-800 p-3 font-medium transition-colors"
                        style={{
                          background: colorFor(v),
                          color: textColorFor(v),
                        }}
                      >
                        {" "}
                        {v !== undefined ? v.toFixed(2) : "—"}{" "}
                      </td>
                    );
                  })}{" "}
                </tr>
              ))}{" "}
            </tbody>{" "}
          </table>{" "}
        </div>
      )}{" "}
    </div>
  );
}
