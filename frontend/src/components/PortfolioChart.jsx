import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'

export default function PortfolioChart({ dates, portfolioValues, benchmarkValues }) {
  if (!dates?.length) return null

  const data = dates.map((date, i) => ({
    date,
    strategy: portfolioValues[i],
    benchmark: benchmarkValues ? benchmarkValues[i] : undefined,
  }))
  // Thin the x-axis labels so long backtests stay readable.
  const tickInterval = Math.max(1, Math.floor(data.length / 8))

  return (
    <div className="chart-card">
      <h3>Portfolio Value — Strategy vs Buy &amp; Hold Benchmark</h3>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" interval={tickInterval} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
          <Tooltip />
          <Line type="monotone" dataKey="strategy" stroke="#4f46e5" dot={false} strokeWidth={2} name="Strategy" />
          {benchmarkValues && (
            <Line type="monotone" dataKey="benchmark" stroke="#9ca3af" dot={false} strokeWidth={1.5} strokeDasharray="4 3" name="Buy & Hold" />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
