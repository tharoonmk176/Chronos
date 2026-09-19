function fmt(n, suffix = '') {
  if (n === null || n === undefined) return '—'
  return `${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}${suffix}`
}

export default function ResultsTable({ results }) {
  if (!results) return null
  const { summary, risk_metrics: risk, trade_statistics: trades } = results

  const rows = [
    ['Initial Capital', fmt(summary.initial_capital, ' $')],
    ['Final Value', fmt(summary.final_value, ' $')],
    ['Total Return', fmt(summary.total_return_percent, '%')],
    ['Annualized Return', fmt(summary.annualized_return_percent, '%')],
    ['Benchmark (Buy & Hold)', fmt(summary.benchmark_return_percent, '%')],
    ['Strategy vs Benchmark', fmt(summary.strategy_vs_benchmark, '%')],
    ['Sharpe Ratio', fmt(risk.sharpe_ratio)],
    ['Volatility', fmt(risk.volatility_percent, '%')],
    ['Max Drawdown', fmt(risk.max_drawdown_percent, '%')],
    ['Total Trades', fmt(trades.total_trades)],
    ['Win Rate', fmt(trades.win_rate_percent, '%')],
  ]

  return (
    <div className="results-table-card">
      <h3>Results — {results.strategy} on {results.ticker}</h3>
      <table>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <td>{label}</td>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
