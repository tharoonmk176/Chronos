import { useState } from 'react'
import { optimizeParameters } from '../api/client'

export default function OptimizerPanel() {
  const [form, setForm] = useState({
    ticker: 'BTC-USD',
    start_date: '2022-01-01',
    end_date: '2024-01-01',
    strategy: 'sma_crossover',
    initial_capital: 10000,
    sma_fast_list: '10, 20, 30',
    sma_slow_list: '40, 50, 60',
  })
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const parseList = (s) => s.split(',').map((v) => parseInt(v.trim(), 10)).filter((v) => !isNaN(v))

  const run = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const data = await optimizeParameters({
        ticker: form.ticker,
        start_date: form.start_date,
        end_date: form.end_date,
        strategy: form.strategy,
        initial_capital: Number(form.initial_capital),
        param_ranges: {
          sma_fast: parseList(form.sma_fast_list),
          sma_slow: parseList(form.sma_slow_list),
        },
      })
      setResults(data.top_results)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="chart-card">
      <h3>Strategy Robustness Testing (Parameter Optimizer)</h3>
      <p className="muted">
        Sweeps SMA period combinations to check whether a strategy holds up across parameter
        choices, not just one hand-picked setting.
      </p>
      <form className="backtest-form" onSubmit={run}>
        <label>Ticker <input value={form.ticker} onChange={update('ticker')} /></label>
        <label>Start date <input type="date" value={form.start_date} onChange={update('start_date')} /></label>
        <label>End date <input type="date" value={form.end_date} onChange={update('end_date')} /></label>
        <label>Initial capital <input type="number" value={form.initial_capital} onChange={update('initial_capital')} /></label>
        <label>SMA fast values <input value={form.sma_fast_list} onChange={update('sma_fast_list')} /></label>
        <label>SMA slow values <input value={form.sma_slow_list} onChange={update('sma_slow_list')} /></label>
        <button type="submit" disabled={loading}>{loading ? 'Optimizing…' : 'Run Grid Search'}</button>
      </form>

      {error && <div className="error-banner">{error}</div>}

      {results && (
        <table>
          <thead>
            <tr><th>#</th><th>Params</th><th>Sharpe</th><th>Return %</th><th>Max DD %</th><th>Win Rate %</th><th>Trades</th></tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{JSON.stringify(r.parameters)}</td>
                <td>{r.sharpe_ratio.toFixed(2)}</td>
                <td>{r.total_return.toFixed(2)}</td>
                <td>{r.max_drawdown.toFixed(2)}</td>
                <td>{r.win_rate.toFixed(1)}</td>
                <td>{r.total_trades}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
