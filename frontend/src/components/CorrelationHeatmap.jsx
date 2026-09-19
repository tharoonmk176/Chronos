import { useState } from 'react'
import { getCorrelation } from '../api/client'

function colorFor(value) {
  // -1 -> red, 0 -> white, +1 -> green
  if (value === undefined || value === null) return '#f3f4f6'
  const intensity = Math.min(1, Math.abs(value))
  return value >= 0
    ? `rgba(22, 163, 74, ${intensity})`
    : `rgba(220, 38, 38, ${intensity})`
}

export default function CorrelationHeatmap() {
  const [tickers, setTickers] = useState('BTC-USD, GLD, NVDA')
  const [startDate, setStartDate] = useState('2023-01-01')
  const [endDate, setEndDate] = useState('2024-01-01')
  const [matrix, setMatrix] = useState(null)
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const run = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const list = tickers.split(',').map((t) => t.trim()).filter(Boolean)
      const data = await getCorrelation({ tickers: list, start_date: startDate, end_date: endDate })
      setMatrix(data.correlation_matrix)
      setAssets(data.assets)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="chart-card">
      <h3>Cross-Asset Correlation Heatmap</h3>
      <form className="inline-form" onSubmit={run}>
        <input value={tickers} onChange={(e) => setTickers(e.target.value)} placeholder="BTC-USD, GLD, NVDA" />
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <button type="submit" disabled={loading}>{loading ? 'Loading…' : 'Compute'}</button>
      </form>
      {error && <div className="error-banner">{error}</div>}
      {matrix && (
        <table className="heatmap">
          <thead>
            <tr>
              <th></th>
              {assets.map((a) => <th key={a}>{a}</th>)}
            </tr>
          </thead>
          <tbody>
            {assets.map((rowAsset) => (
              <tr key={rowAsset}>
                <th>{rowAsset}</th>
                {assets.map((colAsset) => {
                  const v = matrix[rowAsset]?.[colAsset]
                  return (
                    <td key={colAsset} style={{ background: colorFor(v) }}>
                      {v !== undefined ? v.toFixed(2) : '—'}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
