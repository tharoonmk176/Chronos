import { useState } from "react";
import { optimizeParameters } from "../api/client";
export default function OptimizerPanel() {
  const [form, setForm] = useState({
    ticker: "BTC-USD",
    start_date: "2022-01-01",
    end_date: "2024-01-01",
    strategy: "sma_crossover",
    initial_capital: 10000,
    sma_fast_list: "10, 20, 30",
    sma_slow_list: "40, 50, 60",
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));
  const parseList = (s) =>
    s
      .split(",")
      .map((v) => parseInt(v.trim(), 10))
      .filter((v) => !isNaN(v));
  const run = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await optimizeParameters({
        ticker: form.ticker,
        start_date: form.start_date,
        end_date: form.end_date,
        strategy: form.strategy,
        initial_capital: Number(form.initial_capital),
        param_ranges: {
          sma_fast: parseList(form.sma_fast_list),
          sma_slow: parseList(form.sma_slow_list),
        },
      });
      setResults(data.top_results);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div>
      {" "}
      <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4 leading-relaxed">
        {" "}
        Sweep parameter combinations to evaluate strategy robustness across
        different settings.{" "}
      </p>{" "}
      <form className="space-y-4" onSubmit={run}>
        {" "}
        <div>
          {" "}
          <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
            Ticker
          </label>{" "}
          <input
            className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={form.ticker}
            onChange={update("ticker")}
          />{" "}
        </div>{" "}
        <div className="grid grid-cols-2 gap-3">
          {" "}
          <div>
            {" "}
            <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
              Start Date
            </label>{" "}
            <input
              type="date"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.start_date}
              onChange={update("start_date")}
            />{" "}
          </div>{" "}
          <div>
            {" "}
            <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
              End Date
            </label>{" "}
            <input
              type="date"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.end_date}
              onChange={update("end_date")}
            />{" "}
          </div>{" "}
        </div>{" "}
        <div>
          {" "}
          <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
            Capital ($)
          </label>{" "}
          <input
            type="number"
            className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={form.initial_capital}
            onChange={update("initial_capital")}
          />{" "}
        </div>{" "}
        <div>
          {" "}
          <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
            SMA Fast Values (CSV)
          </label>{" "}
          <input
            className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={form.sma_fast_list}
            onChange={update("sma_fast_list")}
          />{" "}
        </div>{" "}
        <div>
          {" "}
          <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
            SMA Slow Values (CSV)
          </label>{" "}
          <input
            className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={form.sma_slow_list}
            onChange={update("sma_slow_list")}
          />{" "}
        </div>{" "}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 bg-slate-800 hover:bg-slate-900 text-white font-medium py-2.5 px-4 rounded-md transition-colors disabled:opacity-70 text-sm"
        >
          {" "}
          {loading ? "Optimizing…" : "Run Grid Search"}{" "}
        </button>{" "}
      </form>{" "}
      {error && (
        <div className="mt-4 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm border border-red-100 dark:border-red-500/30">
          {error}
        </div>
      )}{" "}
      {results && (
        <div className="mt-6 border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
          {" "}
          <table className="w-full text-left text-xs whitespace-nowrap">
            {" "}
            <thead className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-800 ">
              {" "}
              <tr>
                {" "}
                <th className="py-2 px-3 font-medium">#</th>{" "}
                <th className="py-2 px-3 font-medium">Params</th>{" "}
                <th className="py-2 px-3 font-medium text-right">Sharpe</th>{" "}
                <th className="py-2 px-3 font-medium text-right">Ret %</th>{" "}
              </tr>{" "}
            </thead>{" "}
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900 ">
              {" "}
              {results.map((r, i) => (
                <tr
                  key={i}
                  className={
                    i === 0 ? "bg-emerald-50 dark:bg-emerald-500/10 " : ""
                  }
                >
                  {" "}
                  <td className="py-2 px-3 text-slate-500 dark:text-zinc-400 ">
                    {i + 1}
                  </td>{" "}
                  <td className="py-2 px-3 font-mono">
                    {JSON.stringify(r.parameters).replace(/[{}]/g, "")}
                  </td>{" "}
                  <td className="py-2 px-3 text-right font-medium">
                    {r.sharpe_ratio.toFixed(2)}
                  </td>{" "}
                  <td
                    className={`py-2 px-3 text-right ${r.total_return >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
                  >
                    {r.total_return.toFixed(2)}%
                  </td>{" "}
                </tr>
              ))}{" "}
            </tbody>{" "}
          </table>{" "}
        </div>
      )}{" "}
    </div>
  );
}
