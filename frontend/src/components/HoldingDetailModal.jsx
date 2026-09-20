import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { X, TrendingUp, TrendingDown, Activity, ExternalLink } from 'lucide-react';
import { useRegion } from "../RegionContext";

export default function HoldingDetailModal({ holding, onClose }) {
  const { region } = useRegion();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!holding) return;
    setLoading(true);
    fetch(`http://localhost:8000/api/v1/ticker/${holding.ticker}/chart?days=180`)
      .then(r => r.json())
      .then(res => {
        if (res.error) setError(res.error);
        else setData(res.data);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [holding]);

  const formatCurrency = (val) => {
    const num = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0);
    return `${region.currency}${num}`;
  };

  if (!holding) return null;

  const getChartOptions = () => {
    if (!data || data.length === 0) return {};
    const dates = data.map(d => d.time);
    const candleData = data.map(d => [d.open, d.close, d.low, d.high]);
    
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
      grid: { left: '10%', right: '5%', bottom: '15%', top: '10%' },
      xAxis: { type: 'category', data: dates, boundaryGap: false, axisLine: { lineStyle: { color: '#52525b' } } },
      yAxis: { scale: true, splitArea: { show: false }, axisLine: { lineStyle: { color: '#52525b' } }, splitLine: { lineStyle: { color: '#3f3f46', type: 'dashed' } } },
      dataZoom: [{ type: 'inside', start: 50, end: 100 }, { show: true, type: 'slider', bottom: '2%' }],
      series: [
        {
          name: holding.ticker,
          type: 'candlestick',
          data: candleData,
          itemStyle: { color: '#10b981', color0: '#ef4444', borderColor: '#10b981', borderColor0: '#ef4444' }
        }
      ]
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-up">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 dark:bg-indigo-500/20 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
              <Activity size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-50 tracking-tight">{holding.ticker}</h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Holding Detail Analysis</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 bg-slate-100 dark:bg-zinc-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
             <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-xl border border-slate-200 dark:border-zinc-800">
               <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Current Price</div>
               <div className="text-xl font-bold text-slate-900 dark:text-zinc-50">{formatCurrency(holding.current_price)}</div>
             </div>
             <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-xl border border-slate-200 dark:border-zinc-800">
               <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Avg Buy Price</div>
               <div className="text-xl font-bold text-slate-900 dark:text-zinc-50">{formatCurrency(holding.buy_price)}</div>
             </div>
             <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-xl border border-slate-200 dark:border-zinc-800">
               <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Quantity</div>
               <div className="text-xl font-bold text-slate-900 dark:text-zinc-50">{holding.quantity} Shares</div>
             </div>
             <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-xl border border-slate-200 dark:border-zinc-800">
               <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Total Return</div>
               <div className={`text-xl font-bold flex items-center gap-1 ${holding.total_gain >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                 {holding.total_gain >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                 {holding.total_gain >= 0 ? '+' : ''}{holding.total_gain_pct.toFixed(2)}%
               </div>
             </div>
          </div>

          {/* Chart Section */}
          <div className="bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800 p-4 min-h-[400px] flex flex-col justify-center relative">
            {loading && <div className="absolute inset-0 flex items-center justify-center text-indigo-500 font-bold animate-pulse">Loading Chart Data...</div>}
            {error && <div className="absolute inset-0 flex items-center justify-center text-red-500 font-bold">{error}</div>}
            {!loading && !error && data && (
              <ReactECharts option={getChartOptions()} style={{ height: '400px', width: '100%' }} theme="dark" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
