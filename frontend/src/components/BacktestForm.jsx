import { useState } from 'react'

const STRATEGIES = ['sma_crossover', 'ema_trend', 'momentum', 'mean_reversion']

export default function BacktestForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    ticker: 'BTC-USD',
    start_date: '2023-01-01',
    end_date: '2024-01-01',
    initial_capital: 10000,
    strategy: 'sma_crossover',
    transaction_cost: 0.001,
    sma_fast: 20,
    sma_slow: 50,
  })

  const update = (field) => (e) => {
    const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value
    setForm((f) => ({ ...f, [field]: value }))
  }

  return (
    <form
      className="backtest-form"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(form)
      }}
    >
      <label>
        Ticker
        <input value={form.ticker} onChange={update('ticker')} placeholder="BTC-USD" />
      </label>

      <label>
        Start date
        <input type="date" value={form.start_date} onChange={update('start_date')} />
      </label>

      <label>
        End date
        <input type="date" value={form.end_date} onChange={update('end_date')} />
      </label>

      <label>
        Initial capital
        <input type="number" min="1" value={form.initial_capital} onChange={update('initial_capital')} />
      </label>

      <label>
        Strategy
        <select value={form.strategy} onChange={update('strategy')}>
          {STRATEGIES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </label>

      {form.strategy === 'sma_crossover' && (
        <>
          <label>
            SMA fast
            <input type="number" min="1" value={form.sma_fast} onChange={update('sma_fast')} />
          </label>
          <label>
            SMA slow
            <input type="number" min="1" value={form.sma_slow} onChange={update('sma_slow')} />
          </label>
        </>
      )}

      <label>
        Transaction cost
        <input type="number" step="0.0001" min="0" max="0.1" value={form.transaction_cost} onChange={update('transaction_cost')} />
      </label>

      <button type="submit" disabled={loading}>
        {loading ? 'Running…' : 'Run Backtest'}
      </button>
    </form>
  )
}
