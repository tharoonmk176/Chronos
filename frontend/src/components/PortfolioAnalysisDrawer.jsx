import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { X, ShieldAlert, Sparkles, PieChart, Info } from 'lucide-react';
import { useRegion } from '../RegionContext';

export default function PortfolioAnalysisDrawer({ portfolioId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:8000/api/v1/portfolio/${portfolioId}/analyze`, { method: 'POST' })
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, [portfolioId]);

  const getSectorChartOption = () => {
    if (!data?.sectors) return {};
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {d}%' },
      legend: { bottom: '0%', left: 'center', textStyle: { color: '#a1a1aa' } },
      series: [
        {
          name: 'Sector Allocation',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#18181b',
            borderWidth: 2
          },
          label: { show: false },
          data: data.sectors
        }
      ]
    };
  };

  return (
    <>
    <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-zinc-950 border-l border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-slide-left">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center bg-slate-50 dark:bg-zinc-900">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-50 flex items-center gap-2">
            <PieChart size={24} className="text-indigo-600 dark:text-indigo-400" />
            AI Portfolio Analysis
          </h2>
        </div>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-indigo-500 font-medium animate-pulse">
            <Sparkles className="mb-4" size={32} />
            <p>Chronos AI is analyzing your holdings...</p>
          </div>
        ) : data && !data.error ? (
          <>
            {/* Risk Score */}
            <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-1">Portfolio Risk Score</p>
                <div className="text-3xl font-black text-slate-900 dark:text-zinc-50">{data.risk_score} / 100</div>
              </div>
              <div className={`p-4 rounded-full ${data.risk_score > 70 ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'}`}>
                <ShieldAlert size={32} />
              </div>
            </div>

            {/* Sector Allocation */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-50 uppercase tracking-wider mb-4 border-b border-slate-200 dark:border-zinc-800 pb-2">Sector Diversification</h3>
              <div className="h-[300px]">
                <ReactECharts option={getSectorChartOption()} style={{ height: '100%', width: '100%' }} />
              </div>
            </div>

            {/* AI Summary */}
            <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/30 rounded-2xl p-6 relative">
              <Sparkles className="absolute top-4 right-4 text-indigo-300 dark:text-indigo-500/50" size={40} />
              <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider mb-3 relative z-10">Chronos Assessment</h3>
              <p className="text-indigo-800 dark:text-indigo-200 text-sm leading-relaxed font-medium relative z-10">
                {data.summary}
              </p>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-100 dark:border-amber-500/20">
               <Info className="text-amber-600 dark:text-amber-400 shrink-0" size={18} />
               <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">This analysis is algorithmically generated based on sector exposure estimates. Always perform your own due diligence before rebalancing.</p>
            </div>
          </>
        ) : (
          <div className="text-center text-red-500 py-10">
            Error analyzing portfolio. Make sure it contains holdings.
          </div>
        )}
      </div>
    </div>
    </>
  );
}
