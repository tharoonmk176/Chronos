import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'

// 30-day rolling annualized volatility computed client-side from daily returns
// (the backend exposes raw daily returns via /api/v1/indicators; this keeps
// the indicator endpoint focused on price-derived series, not window-size choices).
function rollingVolatility(data, window = 30) {
  const out = new Array(data.length).fill(null)
  for (let i = window; i < data.length; i++) {
    const slice = data.slice(i - window, i).map((d) => d.returns).filter((v) => v !== null)
    if (slice.length < window / 2) continue
    const mean = slice.reduce((a, b) => a + b, 0) / slice.length
    const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / (slice.length - 1)
    out[i] = Math.sqrt(variance) * Math.sqrt(252) * 100
  }
  return out
}

export default function ReturnsVolatilityChart({ data }) {
  if (!data?.length) return null

  const vol = rollingVolatility(data)
  const chartData = data.map((d, i) => ({
    date: d.date,
    cumulative_return_pct: d.cumulative_returns !== null ? d.cumulative_returns * 100 : null,
    volatility_pct: vol[i],
  }))
  const tickInterval = Math.max(1, Math.floor(chartData.length / 8))

  return (
    <div className="chart-card">
      <h3>Cumulative Returns & Rolling Volatility</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" interval={tickInterval} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} unit="%" />
          <Tooltip />
          <Line type="monotone" dataKey="cumulative_return_pct" stroke="#4f46e5" dot={false} strokeWidth={2} name="Cumulative Return %" />
          <Line type="monotone" dataKey="volatility_pct" stroke="#dc2626" dot={false} strokeWidth={1.5} name="30d Volatility %" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
