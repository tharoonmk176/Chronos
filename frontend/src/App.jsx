import { useDispatch, useSelector } from 'react-redux'
import BacktestForm from './components/BacktestForm'
import PortfolioChart from './components/PortfolioChart'
import PriceChart from './components/PriceChart'
import ReturnsVolatilityChart from './components/ReturnsVolatilityChart'
import DrawdownChart from './components/DrawdownChart'
import RegimeBreakdown from './components/RegimeBreakdown'
import ResultsTable from './components/ResultsTable'
import TradesList from './components/TradesList'
import CorrelationHeatmap from './components/CorrelationHeatmap'
import OptimizerPanel from './components/OptimizerPanel'
import AuthPanel from './components/AuthPanel'
import { clearToken } from './api/client'
import { loggedIn, loggedOut } from './store/authSlice'
import { runBacktestFlow } from './store/backtestSlice'
import './App.css'

function App() {
  const dispatch = useDispatch()
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated)
  const { results, indicators, regime, loading, statusMessage, error } = useSelector(
    (s) => s.backtest
  )

  const handleSubmit = (form) => dispatch(runBacktestFlow(form))

  // Buy & Hold benchmark series: capital scaled by the price series, so it can be
  // overlaid on the same chart as the strategy's portfolio value.
  const benchmarkValues = (() => {
    if (!results || !indicators?.data?.length) return null
    const firstClose = indicators.data[0].close
    return results.dates.map((date) => {
      const point = indicators.data.find((d) => d.date === date)
      return point ? (results.summary.initial_capital * point.close) / firstClose : null
    })
  })()

  if (!isAuthenticated) {
    return (
      <div className="app">
        <header>
          <h1 className="text-2xl font-semibold mb-1">Quantitative Multi-Asset Backtesting Platform</h1>
          <p className="muted">Gold · Bitcoin · NVIDIA — SMA/EMA, momentum &amp; mean-reversion strategies</p>
        </header>
        <AuthPanel onAuthenticated={() => dispatch(loggedIn())} />
      </div>
    )
  }

  return (
    <div className="app">
      <header className="flex justify-between items-baseline">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Quantitative Multi-Asset Backtesting Platform</h1>
          <p className="muted">Gold · Bitcoin · NVIDIA — SMA/EMA, momentum &amp; mean-reversion strategies</p>
        </div>
        <button
          type="button"
          onClick={() => { clearToken(); dispatch(loggedOut()) }}
          className="border border-gray-300 rounded-md px-3 py-1.5 bg-transparent cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Log out
        </button>
      </header>

      <div className="disclaimer">
        This platform is for quantitative research and historical analysis only. Backtested
        strategy performance is not a guarantee of future returns.
      </div>

      <BacktestForm onSubmit={handleSubmit} loading={loading} />

      {statusMessage && <div className="muted my-1">{statusMessage}</div>}
      {error && <div className="error-banner">{error}</div>}

      {results && (
        <div className="results">
          <ResultsTable results={results} />
          <PortfolioChart
            dates={results.dates}
            portfolioValues={results.portfolio_values}
            benchmarkValues={benchmarkValues}
          />
          {indicators && (
            <>
              <PriceChart data={indicators.data} />
              <ReturnsVolatilityChart data={indicators.data} />
            </>
          )}
          <DrawdownChart dates={results.dates} portfolioValues={results.portfolio_values} />
          {regime && <RegimeBreakdown breakdown={regime} />}
          <TradesList trades={results.trades} />
        </div>
      )}

      <OptimizerPanel />
      <CorrelationHeatmap />
    </div>
  )
}

export default App
