import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'

export default function DrawdownChart({ dates, portfolioValues }) {
  if (!dates?.length) return null

  let runningMax = -Infinity
  const data = dates.map((date, i) => {
    const value = portfolioValues[i]
    runningMax = Math.max(runningMax, value)
    const drawdown_pct = ((value - runningMax) / runningMax) * 100
    return { date, drawdown_pct }
  })
  const tickInterval = Math.max(1, Math.floor(data.length / 8))

  return (
    <div className="chart-card">
      <h3>Drawdown</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" interval={tickInterval} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} unit="%" domain={['auto', 0]} />
          <Tooltip />
          <Area type="monotone" dataKey="drawdown_pct" stroke="#dc2626" fill="#fee2e2" name="Drawdown %" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
