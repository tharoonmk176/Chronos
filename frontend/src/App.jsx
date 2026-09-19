import { useState, useEffect } from "react";
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
import AuthPanel from "./components/AuthPanel";
import { clearToken } from "./api/client";
import { loggedIn, loggedOut } from "./store/authSlice";
import { runBacktestFlow } from "./store/backtestSlice";
function App() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);
  const { results, indicators, regime, loading, statusMessage, error } =
    useSelector((s) => s.backtest);
  const [activeMainTab, setActiveMainTab] = useState("backtest");
  const [activeSubTab, setActiveSubTab] = useState("overview");
  const [isDark, setIsDark] = useState(false);
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
          {["backtest", "optimizer", "correlation"].map((tab) => (
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
      </header>{" "}
      {/* Main Content Layout */}{" "}
      <div className="flex-1 max-w-[1600px] w-full mx-auto p-6">
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
        {activeMainTab === "correlation" && (
          <div className="max-w-5xl mx-auto bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm p-6">
            {" "}
            <CorrelationHeatmap />{" "}
          </div>
        )}{" "}
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
                    {["overview", "technical", "trades"].map((tab) => (
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
    </div>
  );
}
export default App;
