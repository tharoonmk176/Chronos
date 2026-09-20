import React, { useContext } from "react";
import { useRegion } from "../RegionContext";
import { TrendingUp, TrendingDown, Activity, Percent, Crosshair, BarChart2, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';

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
    const { summary, risk_metrics: risk, trade_statistics: trades, ticker, start_date, end_date, strategy } = results;

    // Grab the Recharts SVGs from the DOM
    const chartWrappers = document.querySelectorAll('.recharts-wrapper');
    let equityChart = '';
    let drawdownChart = '';
    
    if (chartWrappers.length > 0) {
      equityChart = `<div style="display: flex; justify-content: center; transform: scale(0.85); transform-origin: top center;">${chartWrappers[0].outerHTML}</div>`;
    }
    if (chartWrappers.length > 1) {
      drawdownChart = `<div style="display: flex; justify-content: center; transform: scale(0.85); transform-origin: top center;">${chartWrappers[1].outerHTML}</div>`;
    }

    const htmlContent = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; font-size: 14px;">
        
        <!-- PAGE 1: Executive Summary -->
        <h1 style="color: #4f46e5; text-align: center; border-bottom: 3px solid #4f46e5; padding-bottom: 15px; margin-bottom: 30px; font-size: 28px;">Chronos Quantitative Analysis Report</h1>
        
        <h2 style="color: #334155; margin-bottom: 10px;">1. Executive Summary & Strategy Overview</h2>
        <p>
          This comprehensive financial report provides an in-depth, quantitative review of the <strong>${strategy}</strong> trading strategy applied to the ticker symbol <strong>${ticker}</strong>. 
          The historical backtest spans a defined time period beginning on <strong>${start_date}</strong> and concluding on <strong>${end_date}</strong>. 
          The primary objective of this simulation is to evaluate the strategy's profitability, risk exposure, and market resilience over the tested horizon.
        </p>

        <h3 style="color: #475569; margin-top: 25px;">Key Performance Indicators</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 30px;">
            <thead>
                <tr>
                    <th style="border: 1px solid #cbd5e1; padding: 12px; background-color: #f8fafc; text-align: left; font-weight: bold;">Metric</th>
                    <th style="border: 1px solid #cbd5e1; padding: 12px; background-color: #f8fafc; text-align: left; font-weight: bold;">Value</th>
                    <th style="border: 1px solid #cbd5e1; padding: 12px; background-color: #f8fafc; text-align: left; font-weight: bold;">Metric</th>
                    <th style="border: 1px solid #cbd5e1; padding: 12px; background-color: #f8fafc; text-align: left; font-weight: bold;">Value</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="border: 1px solid #cbd5e1; padding: 12px;"><strong>Initial Capital</strong></td>
                    <td style="border: 1px solid #cbd5e1; padding: 12px;"><strong>${region.currency}${fmt(summary.initial_capital)}</strong></td>
                    <td style="border: 1px solid #cbd5e1; padding: 12px;"><strong>Final Value</strong></td>
                    <td style="border: 1px solid #cbd5e1; padding: 12px;"><strong>${region.currency}${fmt(summary.final_value)}</strong></td>
                </tr>
                <tr>
                    <td style="border: 1px solid #cbd5e1; padding: 12px;"><strong>Total Return</strong></td>
                    <td style="border: 1px solid #cbd5e1; padding: 12px; color: #16a34a;"><strong>${fmt(summary.total_return_percent, "%")}</strong></td>
                    <td style="border: 1px solid #cbd5e1; padding: 12px;"><strong>Annualized Return</strong></td>
                    <td style="border: 1px solid #cbd5e1; padding: 12px;"><strong>${fmt(summary.annualized_return_percent, "%")}</strong></td>
                </tr>
            </tbody>
        </table>

        <h3 style="color: #475569;">Equity Curve Progression (Trend Diagram)</h3>
        <p>
          The graph below visualizes the compounding portfolio value over the specified timeline. A consistent, upward-trending equity curve with minimal volatility indicates a stable algorithmic framework.
        </p>
        ${equityChart}

        <div class="html2pdf__page-break"></div>

        <!-- PAGE 2: Risk and Drawdowns -->
        <h2 style="color: #334155; margin-top: 20px;">2. Risk Mitigation & Drawdown Analysis</h2>
        <p>
          While absolute returns are crucial, evaluating the risk assumed to achieve those returns is equally critical. 
          This section breaks down the maximum capital depletion (drawdown) and the statistical risk-adjusted performance of the algorithm.
        </p>

        <table style="width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 30px;">
            <thead>
                <tr>
                    <th style="border: 1px solid #cbd5e1; padding: 12px; background-color: #f8fafc; text-align: left; font-weight: bold;">Risk Metric</th>
                    <th style="border: 1px solid #cbd5e1; padding: 12px; background-color: #f8fafc; text-align: left; font-weight: bold;">Value</th>
                    <th style="border: 1px solid #cbd5e1; padding: 12px; background-color: #f8fafc; text-align: left; font-weight: bold;">Risk Metric</th>
                    <th style="border: 1px solid #cbd5e1; padding: 12px; background-color: #f8fafc; text-align: left; font-weight: bold;">Value</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="border: 1px solid #cbd5e1; padding: 12px;"><strong>Sharpe Ratio</strong></td>
                    <td style="border: 1px solid #cbd5e1; padding: 12px;"><strong>${fmt(risk.sharpe_ratio)}</strong></td>
                    <td style="border: 1px solid #cbd5e1; padding: 12px;"><strong>Max Drawdown</strong></td>
                    <td style="border: 1px solid #cbd5e1; padding: 12px; color: #dc2626;"><strong>${fmt(risk.max_drawdown_percent, "%")}</strong></td>
                </tr>
                <tr>
                    <td style="border: 1px solid #cbd5e1; padding: 12px;"><strong>Win Rate</strong></td>
                    <td style="border: 1px solid #cbd5e1; padding: 12px;"><strong>${fmt(trades.win_rate_percent, "%")}</strong></td>
                    <td style="border: 1px solid #cbd5e1; padding: 12px;"><strong>Strategy vs Bench</strong></td>
                    <td style="border: 1px solid #cbd5e1; padding: 12px;"><strong>${fmt(summary.strategy_vs_benchmark, "%")}</strong></td>
                </tr>
            </tbody>
        </table>

        <h3 style="color: #475569;">Historical Drawdown Depths (Risk Diagram)</h3>
        <p>
          The drawdown chart illustrates the percentage drop from the portfolio's highest peak. 
          Deep, extended red zones suggest periods of significant market stress or structural failure in the strategy. 
          A maximum drawdown of <strong>${fmt(risk.max_drawdown_percent, "%")}</strong> was recorded during this backtest.
        </p>
        ${drawdownChart}

        <div style="margin-top: 50px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px;">
          <strong>Confidential & Proprietary</strong> • Generated by Chronos AI Quantitative Engine • ${new Date().toLocaleString()}
        </div>
      </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    
    // We must append to document so html2canvas can render the SVG properly
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '800px';
    document.body.appendChild(container);

    const opt = {
      margin:       [0.5, 0, 0.5, 0],
      filename:     `Chronos_Detailed_Report_${ticker}.pdf`,
      image:        { type: 'jpeg', quality: 1.0 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true, logging: false },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(container).save().then(() => {
      document.body.removeChild(container);
    }).catch(err => {
      console.error(err);
      document.body.removeChild(container);
    });
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
