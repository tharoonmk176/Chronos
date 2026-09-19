import {
  CartesianGrid, ComposedChart, Line, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis,
} from 'recharts'

export default function PriceChart({ data }) {
  if (!data?.length) return null

  const buys = data.filter((d) => d.signal === 1).map((d) => ({ date: d.date, close: d.close }))
  const sells = data.filter((d) => d.signal === -1).map((d) => ({ date: d.date, close: d.close }))
  const tickInterval = Math.max(1, Math.floor(data.length / 8))

  return (
    <div className="chart-card">
      <h3>Price, Moving Averages & Signals</h3>
      <ResponsiveContainer width="100%" height={340}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" interval={tickInterval} tick={{ fontSize: 11 }} allowDuplicatedCategory={false} />
          <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
          <Tooltip />
          <Line type="monotone" dataKey="close" stroke="#111827" dot={false} strokeWidth={1.5} name="Close" />
          <Line type="monotone" dataKey="sma_fast" stroke="#4f46e5" dot={false} strokeWidth={1} name="SMA fast" />
          <Line type="monotone" dataKey="sma_slow" stroke="#f59e0b" dot={false} strokeWidth={1} name="SMA slow" />
          <Scatter data={buys} dataKey="close" fill="#16a34a" shape="triangle" name="Buy" />
          <Scatter data={sells} dataKey="close" fill="#dc2626" shape="triangle" name="Sell" />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="legend-note">
        <span className="dot buy" /> Buy signal &nbsp; <span className="dot sell" /> Sell signal
      </div>
    </div>
  )
}
