import { useState } from "react";
import { useRegion } from "../RegionContext";
const STRATEGIES = ["sma_crossover", "ema_trend", "momentum", "mean_reversion"];
const POPULAR_TICKERS = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'SPY', 'QQQ', 'GLD', 'NVDA', 'AAPL', 'MSFT', 'AMZN', 'TSLA', 'META', 'GOOGL', 'JPM', 'V', 'WMT', 'JNJ'];

export default function BacktestForm({ onSubmit, loading }) {
  const { region } = useRegion();
  const [form, setForm] = useState({
    ticker: "BTC-USD",
    start_date: "2023-01-01",
    end_date: "2024-01-01",
    initial_capital: 10000,
    strategy: "sma_crossover",
    transaction_cost: 0.001,
    sma_fast: 20,
    sma_slow: 50,
  });
  const update = (field) => (e) => {
    const value =
      e.target.type === "number" ? Number(e.target.value) : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
  };
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
    >
      {" "}
      <div>
        {" "}
        <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
          Ticker
        </label>{" "}
        <div className="flex gap-2">
          <select
            className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md px-3 py-2 text-sm text-slate-900 dark:text-zinc-50 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            value={POPULAR_TICKERS.includes(form.ticker) ? form.ticker : 'CUSTOM'}
            onChange={(e) => {
              if (e.target.value !== 'CUSTOM') update("ticker")(e);
              else update("ticker")({ target: { value: '' } });
            }}
          >
            {POPULAR_TICKERS.map(t => <option key={t} value={t}>{t}</option>)}
            <option value="CUSTOM">Custom...</option>
          </select>
          {!POPULAR_TICKERS.includes(form.ticker) && (
            <input
              type="text"
              className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md px-3 py-2 text-sm text-slate-900 dark:text-zinc-50 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
              value={form.ticker}
              onChange={update("ticker")}
              placeholder="e.g. AMC"
              autoFocus
            />
          )}
        </div>{" "}
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
            className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
            className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={form.end_date}
            onChange={update("end_date")}
          />{" "}
        </div>{" "}
      </div>{" "}
      <div>
        {" "}
        <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
          Initial Capital ($)
        </label>{" "}
        <input
          type="number"
          min="1"
          className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          value={form.initial_capital}
          onChange={update("initial_capital")}
        />{" "}
      </div>{" "}
      <div>
        {" "}
        <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
          Strategy
        </label>{" "}
        <select
          className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          value={form.strategy}
          onChange={update("strategy")}
        >
          {" "}
          {STRATEGIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}{" "}
        </select>{" "}
      </div>{" "}
      {form.strategy === "sma_crossover" && (
        <div className="grid grid-cols-2 gap-3">
          {" "}
          <div>
            {" "}
            <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
              SMA Fast
            </label>{" "}
            <input
              type="number"
              min="1"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={form.sma_fast}
              onChange={update("sma_fast")}
            />{" "}
          </div>{" "}
          <div>
            {" "}
            <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
              SMA Slow
            </label>{" "}
            <input
              type="number"
              min="1"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={form.sma_slow}
              onChange={update("sma_slow")}
            />{" "}
          </div>{" "}
        </div>
      )}{" "}
      <div>
        {" "}
        <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
          Transaction Cost (%)
        </label>{" "}
        <input
          type="number"
          step="0.0001"
          min="0"
          max="0.1"
          className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          value={form.transaction_cost}
          onChange={update("transaction_cost")}
        />{" "}
      </div>{" "}
      <button
        type="submit"
        disabled={loading}
        className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
      >
        {" "}
        {loading && (
          <svg
            className="animate-spin h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            {" "}
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>{" "}
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>{" "}
          </svg>
        )}{" "}
        {loading ? "Running Backtest…" : "Run Backtest"}{" "}
      </button>{" "}
    
      

      <datalist id="popular-tickers">
        <option value="BTC-USD" />
<option value="ETH-USD" />
<option value="SOL-USD" />
<option value="SPY" />
<option value="QQQ" />
<option value="GLD" />
<option value="NVDA" />
<option value="AAPL" />
<option value="MSFT" />
<option value="AMZN" />
<option value="TSLA" />
<option value="META" />
<option value="GOOGL" />
<option value="JPM" />
<option value="V" />
<option value="WMT" />
<option value="JNJ" />
      </datalist>
</form>
  );
}
