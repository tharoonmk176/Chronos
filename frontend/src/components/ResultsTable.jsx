import React, { useContext } from "react";
import { useRegion } from "../RegionContext";
import { TrendingUp, TrendingDown, Activity, Percent, Crosshair, BarChart2, Download } from 'lucide-react';

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
export default function ResultsTable({ results }) {
  const { region } = useRegion();

  const handleDownloadReport = () => {
    if (!results) return;
    const { summary, risk_metrics: risk, trade_statistics: trades, ticker, start_date, end_date, portfolio_values, dates, strategy } = results;
    
    let htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Chronos Backtest Report - ${ticker}</title>
    <script src="https://cdn.jsdelivr.net/npm/echarts/dist/echarts.min.js"></script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #333; max-width: 1000px; margin: 0 auto; background-color: #f8fafc; }
        .card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); margin-bottom: 24px; border: 1px solid #e2e8f0; }
        h1 { color: #4f46e5; margin-top: 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background-color: #f1f5f9; font-weight: bold; color: #475569; text-transform: uppercase; font-size: 12px; border-top: 1px solid #e2e8f0; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
        .metric { border-left: 4px solid #4f46e5; padding-left: 12px; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
        .label { font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: bold; margin-bottom: 4px; }
        .val { font-size: 24px; font-weight: bold; color: #0f172a; }
        #chart { width: 100%; height: 400px; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Chronos Quantitative Backtest Report</h1>
        <table>
            <tbody>
                <tr>
                    <td><strong>Ticker Symbol</strong></td>
                    <td><strong style="color: #4f46e5;">${ticker || 'N/A'}</strong></td>
                </tr>
                <tr>
                    <td><strong>Strategy Implementation</strong></td>
                    <td><strong>${strategy || 'N/A'}</strong></td>
                </tr>
                <tr>
                    <td><strong>Time Period</strong></td>
                    <td><strong>${start_date || 'N/A'}</strong> to <strong>${end_date || 'N/A'}</strong></td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="card">
        <h2 style="margin-top: 0;">Equity Curve</h2>
        <div id="chart"></div>
    </div>

    <div class="card grid">
        <div class="metric"><div class="label">Total Return</div><div class="val">${fmt(summary.total_return_percent, "%")}</div></div>
        <div class="metric"><div class="label">Annualized Return</div><div class="val">${fmt(summary.annualized_return_percent, "%")}</div></div>
        <div class="metric"><div class="label">Initial Capital</div><div class="val">${region.currency}${fmt(summary.initial_capital)}</div></div>
        <div class="metric"><div class="label">Final Value</div><div class="val">${region.currency}${fmt(summary.final_value)}</div></div>
    </div>

    <div class="card">
        <h2 style="margin-top: 0;">Risk & Trade Metrics</h2>
        <table>
            <thead>
                <tr>
                    <th>Metric</th>
                    <th>Value</th>
                    <th>Metric</th>
                    <th>Value</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Sharpe Ratio</strong></td>
                    <td><strong>${fmt(risk.sharpe_ratio)}</strong></td>
                    <td><strong>Max Drawdown</strong></td>
                    <td><strong style="color: #dc2626;">${fmt(risk.max_drawdown_percent, "%")}</strong></td>
                </tr>
                <tr>
                    <td><strong>Win Rate</strong></td>
                    <td><strong>${fmt(trades.win_rate_percent, "%")}</strong></td>
                    <td><strong>Strategy vs Bench</strong></td>
                    <td><strong>${fmt(summary.strategy_vs_benchmark, "%")}</strong></td>
                </tr>
            </tbody>
        </table>
    </div>

    <script>
        var chartDom = document.getElementById('chart');
        var myChart = echarts.init(chartDom);
        var dates = ${JSON.stringify(dates || [])};
        var values = ${JSON.stringify(portfolio_values || [])};
        
        var option = {
            tooltip: { trigger: 'axis' },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: { type: 'category', boundaryGap: false, data: dates },
            yAxis: { type: 'value', min: 'dataMin' },
            series: [{
                name: 'Portfolio Value',
                type: 'line',
                data: values,
                smooth: true,
                lineStyle: { width: 2, color: '#4f46e5' },
                areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{offset: 0, color: 'rgba(79, 70, 229, 0.4)'}, {offset: 1, color: 'rgba(79, 70, 229, 0.0)'}]) }
            }]
        };
        myChart.setOption(option);
        window.addEventListener('resize', function() { myChart.resize(); });
    </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Chronos_Report_${ticker}_${new Date().getTime()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  if (!results) return null;
  const { summary, risk_metrics: risk, trade_statistics: trades } = results;
  const isProfit = summary.total_return_percent >= 0;
  return (
    <div>
      {" "}
      <div className="flex items-center justify-between mb-4 px-1">
        {" "}
        <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-50 ">
          Performance Summary
        </h2>{" "}
        <span className="text-xs font-medium px-2 py-1 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-md">
          {" "}
          {results.strategy.toUpperCase()} • {results.ticker}{" "}
        </span>{" "}
      </div>{" "}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {" "}
        <StatCard
          label="Total Return" icon={Activity}
          value={fmt(summary.total_return_percent, "%")}
          subtext={`Final: ${region.currency}${fmt(summary.final_value)}`}
          negative={!isProfit}
          highlight={true}
        />{" "}
        <StatCard
          label="Annualized" icon={TrendingUp}
          value={fmt(summary.annualized_return_percent, "%")}
        />{" "}
        <StatCard
          label="Sharpe Ratio" icon={BarChart2}
          value={fmt(risk.sharpe_ratio)}
          subtext={`Vol: ${fmt(risk.volatility_percent, "%")}`}
        />{" "}
        <StatCard
          label="Max Drawdown" icon={TrendingDown}
          value={fmt(risk.max_drawdown_percent, "%")}
          negative={true}
        />{" "}
        <StatCard
          label="Win Rate" icon={Crosshair}
          value={fmt(trades.win_rate_percent, "%")}
          subtext={`${trades.total_trades} total trades`}
        />{" "}
      </div>{" "}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {" "}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex justify-between items-center">
          {" "}
          <span className="text-sm font-medium text-slate-600 dark:text-zinc-400 ">
            Benchmark (Buy & Hold)
          </span>{" "}
          <span className="text-sm font-bold text-slate-900 dark:text-zinc-50 ">
            {fmt(summary.benchmark_return_percent, "%")}
          </span>{" "}
        </div>{" "}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex justify-between items-center">
          {" "}
          <span className="text-sm font-medium text-slate-600 dark:text-zinc-400 ">
            Strategy vs Benchmark
          </span>{" "}
          <span
            className={`text-sm font-bold ${summary.strategy_vs_benchmark >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
          >
            {" "}
            {fmt(summary.strategy_vs_benchmark, "%")}{" "}
          </span>{" "}
        </div>{" "}
      </div>{" "}

      <div className="mt-6 flex justify-end">
        <button 
          onClick={handleDownloadReport}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors text-sm cursor-pointer"
        >
          <Download size={16} />
          Generate Report
        </button>
      </div>
    </div>
  );
}
