import React, { useContext, useState } from 'react';
import { Activity, ShieldAlert, AlertTriangle, Target, Zap, TrendingUp, TrendingDown, Layers, PlayCircle } from 'lucide-react';
import { useRegion } from "../RegionContext";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function LabsDashboard({ form }) {
  const { region } = useRegion();
  const [activeTab, setActiveTab] = useState('monte_carlo');
  const [loading, setLoading] = useState(false);
  const [mcData, setMcData] = useState(null);
  const [wfData, setWfData] = useState(null);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      if (activeTab === 'monte_carlo') {
        const res = await fetch('http://localhost:8000/api/v1/monte-carlo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
        const data = await res.json();
        setMcData(data);
      } else {
        const res = await fetch('http://localhost:8000/api/v1/walk-forward', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
        const data = await res.json();
        setWfData(data);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-3 bg-slate-100/50 dark:bg-zinc-800/50 p-1.5 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('monte_carlo')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 ${activeTab === 'monte_carlo' ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-slate-200 dark:ring-zinc-700' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-white/50 dark:hover:bg-zinc-800/50'}`}
        >
          <Activity className="h-4 w-4" /> Monte Carlo Engine
        </button>
        <button
          onClick={() => setActiveTab('walk_forward')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 ${activeTab === 'walk_forward' ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-slate-200 dark:ring-zinc-700' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-white/50 dark:hover:bg-zinc-800/50'}`}
        >
          <ShieldAlert className="h-4 w-4" /> Walk-Forward Analysis
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100 dark:border-zinc-800/80">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-zinc-50 flex items-center gap-2">
              {activeTab === 'monte_carlo' ? <><Zap className="w-5 h-5 text-indigo-500" /> Tail Risk & Scenario Simulation</> : <><Layers className="w-5 h-5 text-indigo-500" /> Out-of-Sample Validation</>}
            </h3>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1.5 max-w-2xl">
              {activeTab === 'monte_carlo' 
                ? 'Project your portfolio into the future using 1,000 randomized market permutations to uncover hidden tail risks and establish Value-at-Risk (VaR) confidence limits.' 
                : 'Rigorous walk-forward optimization. The engine historically rolls a 1-year training window to find optimal parameters, then blindly tests them on a pristine 3-month future window to prevent overfitting.'}
            </p>
          </div>
          <button 
            onClick={runAnalysis}
            disabled={loading}
            className="group relative inline-flex items-center justify-center gap-2 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 disabled:opacity-50 text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
            <PlayCircle className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="relative">{loading ? 'Simulating...' : 'Run Simulation'}</span>
          </button>
        </div>

        {/* Results Area */}
        {activeTab === 'monte_carlo' && mcData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
              <div className="relative overflow-hidden bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/40 dark:to-rose-900/20 p-5 rounded-2xl border border-red-100 dark:border-red-900/50 group">
                <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform"><AlertTriangle className="w-24 h-24 text-red-500" /></div>
                <div className="relative">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-red-600/80 dark:text-red-400 uppercase tracking-widest mb-2"><AlertTriangle className="w-3.5 h-3.5" /> Worst 5% (VaR)</span>
                  <p className="text-3xl font-black text-red-600 dark:text-red-400">
                    {region.currency}{mcData.percentile_values.p5.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
                  </p>
                </div>
              </div>
              
              <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-900/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 group">
                <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform"><Target className="w-24 h-24 text-indigo-500" /></div>
                <div className="relative">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-600/80 dark:text-indigo-400 uppercase tracking-widest mb-2"><Target className="w-3.5 h-3.5" /> Median Expected</span>
                  <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                    {region.currency}{mcData.percentile_values.p50.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
                  </p>
                </div>
              </div>
              
              <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-900/20 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 group">
                <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform"><TrendingUp className="w-24 h-24 text-emerald-500" /></div>
                <div className="relative">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600/80 dark:text-emerald-400 uppercase tracking-widest mb-2"><TrendingUp className="w-3.5 h-3.5" /> Best 5% Scenario</span>
                  <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                    {region.currency}{mcData.percentile_values.p95.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
                  </p>
                </div>
              </div>
            </div>
            <div className="md:col-span-2 h-[350px] flex items-center justify-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm relative overflow-hidden">
               <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-50/50 via-transparent to-transparent dark:from-indigo-900/10"></div>
               <div className="relative w-full h-full">
               {mcData.chart_data ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mcData.chart_data}>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--color-border)" strokeOpacity={0.5} />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#8b5cf6', fontWeight: 600 }} tickLine={false} axisLine={false} dy={10} />
                      <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#8b5cf6', fontWeight: 600 }} tickFormatter={(v) => `${region.currency}${v.toLocaleString()}`} tickLine={false} axisLine={false} dx={-10} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                        formatter={(value) => [`${region.currency}${Number(value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`]}
                      />
                      <Line type="monotone" dataKey="path_0" stroke="#f43f5e" dot={false} strokeWidth={2} opacity={0.6} name="Path 1 (Worst)" />
                      <Line type="monotone" dataKey="path_1" stroke="#3b82f6" dot={false} strokeWidth={1.5} opacity={0.3} name="Path 2" />
                      <Line type="monotone" dataKey="path_2" stroke="#10b981" dot={false} strokeWidth={1.5} opacity={0.3} name="Path 3" />
                      <Line type="monotone" dataKey="path_3" stroke="#f59e0b" dot={false} strokeWidth={1.5} opacity={0.3} name="Path 4" />
                      <Line type="monotone" dataKey="path_4" stroke="#8b5cf6" dot={false} strokeWidth={3} name="Path 5 (Median)" />
                    </LineChart>
                  </ResponsiveContainer>
               ) : (
                  <p className="text-slate-400 text-sm">Loading Monte Carlo paths...</p>
               )}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'walk_forward' && wfData && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-zinc-900 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800/30 shadow-sm relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <span className="text-xs font-bold text-indigo-600/80 dark:text-indigo-400 uppercase tracking-widest">Aggregate OOS Return</span>
                <p className="text-4xl font-black text-indigo-600 dark:text-indigo-400 mt-2">
                  {wfData.average_out_of_sample_return > 0 ? '+' : ''}{wfData.average_out_of_sample_return?.toFixed(2)}%
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-zinc-900 p-6 rounded-2xl border border-blue-100 dark:border-blue-800/30 shadow-sm relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <span className="text-xs font-bold text-blue-600/80 dark:text-blue-400 uppercase tracking-widest">Aggregate OOS Sharpe</span>
                <p className="text-4xl font-black text-blue-600 dark:text-blue-400 mt-2">
                  {wfData.average_out_of_sample_sharpe?.toFixed(2)}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {wfData.walk_forward_results.map((r, i) => (
                  <div key={i} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
                     <div className="flex items-center justify-between mb-4">
                       <span className="px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-xs font-bold rounded-md">Walk #{r.walk_number}</span>
                       {r.out_of_sample_return > 0 ? <TrendingUp className="w-5 h-5 text-emerald-500" /> : <TrendingDown className="w-5 h-5 text-red-500" />}
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4 mb-4">
                       <div>
                         <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Return</p>
                         <p className={`text-xl font-black ${r.out_of_sample_return > 0 ? 'text-emerald-500' : r.out_of_sample_return < 0 ? 'text-red-500' : 'text-slate-500'}`}>
                           {r.out_of_sample_return > 0 ? '+' : ''}{r.out_of_sample_return?.toFixed(2)}%
                         </p>
                       </div>
                       <div>
                         <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Sharpe</p>
                         <p className="text-xl font-black text-slate-900 dark:text-zinc-100">{r.out_of_sample_sharpe?.toFixed(2)}</p>
                       </div>
                     </div>
                     
                     <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/80">
                       <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Optimal Training Params</p>
                       <div className="flex flex-wrap gap-2">
                         {Object.entries(r.optimization_params).map(([k, v]) => (
                           <span key={k} className="px-2 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 text-xs font-medium rounded">
                             {k.replace('sma_', '')}: {v}
                           </span>
                         ))}
                       </div>
                     </div>
                  </div>
               ))}
            </div>
          </div>
        )}
        
        {!mcData && !wfData && !loading && (
          <div className="h-64 flex items-center justify-center text-slate-400 dark:text-zinc-500 text-sm">
            Configure your strategy on the left and click Run Simulation.
          </div>
        )}
      </div>
    </div>
  );
}
