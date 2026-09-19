export default function RegimeBreakdown({ breakdown }) {
  if (!breakdown || Object.keys(breakdown).length === 0) return null

  const rows = Object.entries(breakdown)

  return (
    <div className="results-table-card">
      <h3>Performance by Market Regime</h3>
      <table>
        <thead>
          <tr><th>Regime</th><th>Days</th><th>Avg Daily Return</th><th>Volatility</th></tr>
        </thead>
        <tbody>
          {rows.map(([label, stats]) => (
            <tr key={label}>
              <td>{label}</td>
              <td>{stats.days}</td>
              <td>{stats.avg_daily_return_percent.toFixed(3)}%</td>
              <td>{stats.volatility_percent.toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
