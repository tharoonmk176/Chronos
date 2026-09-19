import ChartingDemo from './components/ChartingDemo';
import PortfolioDashboard from './components/PortfolioDashboard';
import { useState, useEffect } from "react";
import { useRegion, regionsData } from "./RegionContext";
import { Globe } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import BacktestForm from "./components/BacktestForm";
import PortfolioChart from "./components/PortfolioChart";
import PriceChart from "./components/PriceChart";
import ReturnsVolatilityChart from "./components/ReturnsVolatilityChart";
import DrawdownChart from "./components/DrawdownChart";
import RegimeBreakdown from "./components/RegimeBreakdown";
import ResultsTable from "./components/ResultsTable";
import TradesList from "./components/TradesList";
import CorrelationHeatmap from "./components/CorrelationHeatmap";
import OptimizerPanel from "./components/OptimizerPanel";
import MarketDashboard from "./components/MarketDashboard";
import Chatbot from "./components/Chatbot";
import AdvancedTechnicalChart from "./components/AdvancedTechnicalChart";
import StrategyIntelligence from "./components/StrategyIntelligence";
import LabsDashboard from "./components/LabsDashboard";
import AuthPanel from "./components/AuthPanel";
import { clearToken } from "./api/client";
import { loggedIn, loggedOut } from "./store/authSlice";
import { runBacktestFlow } from "./store/backtestSlice";
function App() {
  const { region, setRegion } = useRegion();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);
  const { results, indicators, regime, loading, statusMessage, error } =
    useSelector((s) => s.backtest);
  const [activeMainTab, setActiveMainTab] = useState("intel");
  const [activeSubTab, setActiveSubTab] = useState("overview");
  const [isDark, setIsDark] = useState(false);
  const [labsForm, setLabsForm] = useState({ ticker: "BTC-USD", start_date: "2023-01-01", end_date: "2024-01-01", initial_capital: 10000, strategy: "sma_crossover", transaction_cost: 0.001, sma_fast: 20, sma_slow: 50 });
  useEffect(() => {
    if (document.documentElement.classList.contains("dark")) setIsDark(true);
  }, []);
  const toggleDark = () => {
    document.documentElement.classList.toggle("dark");
    setIsDark(!isDark);
  };
  const handleSubmit = (form) => dispatch(runBacktestFlow(form));
  const benchmarkValues = (() => {
    if (!results || !indicators?.data?.length) return null;
    const firstClose = indicators.data[0].close;
    return results.dates.map((date) => {
      const point = indicators.data.find((d) => d.date === date);
      return point
        ? (results.summary.initial_capital * point.close) / firstClose
        : null;
    });
  })();
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        {" "}
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 p-8">
          {" "}
          <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-50 mb-2">
            Chronos Platform
          </h1>{" "}
          <p className="text-slate-500 dark:text-zinc-400 text-sm mb-6">
            Quantitative Multi-Asset Backtesting
          </p>{" "}
          <AuthPanel onAuthenticated={() => dispatch(loggedIn())} />{" "}
        </div>{" "}
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col">
      {" "}
      {/* Top Navbar */}{" "}
      <header className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        {" "}
        <div>
          {" "}
          <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-50 tracking-tight">
            Chronos
          </h1>{" "}
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
            Quantitative Backtesting Engine
          </p>{" "}
        </div>{" "}
        <div className="hidden md:flex items-center gap-1 mx-8 bg-slate-100 dark:bg-zinc-800 p-1 rounded-lg">
          {" "}
          {["portfolio", "intel", "backtest", "optimizer", "correlation", "labs", "charts", "market"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveMainTab(tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${activeMainTab === tab ? "bg-white dark:bg-zinc-900 shadow-sm text-indigo-600 " : "text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-300 dark:text-zinc-300 :text-slate-200"}`}
            >
              {" "}
              {tab}{" "}
            </button>
          ))}{" "}
        </div>{" "}
        <div className="flex items-center gap-4">

          <div className="relative group">
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 px-3 py-1.5 rounded-full cursor-pointer transition-colors border border-slate-200 dark:border-zinc-700">
              <Globe className="h-4 w-4 text-indigo-500" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{region.name} ({region.currency})</span>
            </div>
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
              {regionsData.map(r => (
                <button 
                  key={r.id} 
                  onClick={() => setRegion(r)}
                  className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-600 hover:text-indigo-700 dark:hover:text-white transition-colors flex justify-between items-center"
                >
                  <span>{r.name}</span>
                  <span className="text-slate-400 dark:text-slate-500 opacity-80">{r.currency}</span>
                </button>
              ))}
            </div>
          </div>

          {" "}
          <button
            onClick={toggleDark}
            className="text-sm font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 dark:text-zinc-50 :text-slate-100 transition-colors px-3 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 dark:bg-zinc-800 :bg-slate-800"
          >
            {" "}
            {isDark ? "☀️ Light" : "🌙 Dark"}{" "}
          </button>{" "}
          <button
            type="button"
            onClick={() => {
              clearToken();
              dispatch(loggedOut());
            }}
            className="text-sm font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 dark:text-zinc-50 transition-colors px-3 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 dark:bg-zinc-800 "
          >
            {" "}
            Log out{" "}
          </button>{" "}
        </div>{" "}
      </header>

      <div className="bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/20 px-6 py-2.5 text-center flex items-center justify-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600 dark:text-amber-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <p className="text-xs font-medium text-amber-800 dark:text-amber-400/90">
          This platform is for quantitative research and historical analysis only. Backtested strategy performance is not a guarantee of future returns.
        </p>
      </div>
{" "}
      {/* Main Content Layout */}{" "}
      <div className="flex-1 max-w-[1600px] w-full mx-auto p-6">
        {activeMainTab === "portfolio" && <PortfolioDashboard />}
        {activeMainTab === "intel" && <StrategyIntelligence />}
        {" "}
        {activeMainTab === "optimizer" && (
          <div className="max-w-4xl mx-auto bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm p-6">
            {" "}
            <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-50 uppercase tracking-wider mb-4">
              Grid Search Optimizer
            </h2>{" "}
            <OptimizerPanel />{" "}
          </div>
        )}{" "}
        
        {activeMainTab === "labs" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-3 space-y-6">
               <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm p-5 mb-6">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-50 uppercase tracking-wider mb-4">Labs Configuration</h2>
                  <BacktestForm onSubmit={(form) => { setLabsForm(form); alert("Labs configured! Now click Run Simulation on the right."); }} loading={loading} />
               </div>
            </div>
            <div className="lg:col-span-9 space-y-6">
               <LabsDashboard form={labsForm} />
            </div>
          </div>
        )}

        {activeMainTab === "correlation" && (
          <div className="max-w-5xl mx-auto bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm p-6">
            {" "}
            <CorrelationHeatmap />{" "}
          </div>
        )}{" "}
        
        {activeMainTab === "charts" && <ChartingDemo isDark={isDark} />}
        {activeMainTab === "market" && (
          <div className="max-w-6xl mx-auto space-y-6">
            <MarketDashboard isDark={isDark} />
          </div>
        )}
        {activeMainTab === "backtest" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {" "}
            {/* Left Sidebar: Controls */}{" "}
            <div className="lg:col-span-3 space-y-6">
              {" "}
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm p-5">
                {" "}
                <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-50 uppercase tracking-wider mb-4">
                  Configuration
                </h2>{" "}
                <BacktestForm onSubmit={handleSubmit} loading={loading} />{" "}
              </div>{" "}
            </div>{" "}
            {/* Right Content Area: Results */}{" "}
            <div className="lg:col-span-9 space-y-6 min-w-0">
              {" "}
              {/* Status & Errors */}{" "}
              {statusMessage && (
                <div className="bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 p-3 rounded-lg text-sm border border-blue-100 dark:border-blue-500/30 flex items-center gap-2">
                  {" "}
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />{" "}
                  {statusMessage}{" "}
                </div>
              )}{" "}
              {error && (
                <div className="bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm border border-red-100 dark:border-red-500/30">
                  {" "}
                  {error}{" "}
                </div>
              )}{" "}
              {!results && !loading && !statusMessage && (
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 border-dashed p-12 text-center text-slate-500 dark:text-zinc-400 ">
                  {" "}
                  Run a backtest to see results here.{" "}
                </div>
              )}{" "}
              {results && (
                <div className="space-y-6">
                  {" "}
                  <ResultsTable results={results} />{" "}
                  {/* Sub-navigation for Charts */}{" "}
                  <div className="border-b border-slate-200 dark:border-zinc-800 flex gap-6">
                    {" "}
                    {["overview", "technical", "advanced", "trades"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveSubTab(tab)}
                        className={`pb-3 text-sm font-medium capitalize border-b-2 transition-colors ${activeSubTab === tab ? "border-indigo-600 text-indigo-600 " : "border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-300 dark:text-zinc-300 :text-slate-200"}`}
                      >
                        {" "}
                        {tab}{" "}
                      </button>
                    ))}{" "}
                  </div>{" "}
                  {activeSubTab === "overview" && (
                    <div className="grid grid-cols-1 gap-6">
                      {" "}
                      <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                        {" "}
                        <PortfolioChart
                          dates={results.dates}
                          portfolioValues={results.portfolio_values}
                          benchmarkValues={benchmarkValues}
                        />{" "}
                      </div>{" "}
                      <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                        {" "}
                        <DrawdownChart
                          dates={results.dates}
                          portfolioValues={results.portfolio_values}
                        />{" "}
                      </div>{" "}
                    </div>
                  )}{" "}
                  {activeSubTab === "technical" && indicators && (
                    <div className="grid grid-cols-1 gap-6">
                      {" "}
                      <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                        {" "}
                        <PriceChart data={indicators.data} />{" "}
                      </div>{" "}
                      <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                        {" "}
                        <ReturnsVolatilityChart data={indicators.data} />{" "}
                      </div>{" "}
                    </div>
                  )}{" "}
                  
                      {activeSubTab === "advanced" && (
                        <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                          <AdvancedTechnicalChart data={indicators?.data} />
                        </div>
                      )}

                      {activeSubTab === "trades" && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      {" "}
                      {regime && (
                        <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                          {" "}
                          <RegimeBreakdown breakdown={regime} />{" "}
                        </div>
                      )}{" "}
                      <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                        {" "}
                        <TradesList trades={results.trades} />{" "}
                      </div>{" "}
                    </div>
                  )}{" "}
                </div>
              )}{" "}
            </div>{" "}
          </div>
        )}{" "}
      </div>{" "}
      <Chatbot />
    </div>
  );
}
export default App;
