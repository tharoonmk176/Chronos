import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, TrendingUp, TrendingDown, Activity, AlertTriangle, Info, Plus, ChevronRight, X, ExternalLink, Code } from 'lucide-react';

const StrategyIntelligence = () => {
  const [strategies, setStrategies] = useState([]);
  const [situations, setSituations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedSituation, setSelectedSituation] = useState('All');
  const [selectedAssetClass, setSelectedAssetClass] = useState('All');
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  
  useEffect(() => {
    Promise.all([
      fetch("http://localhost:8000/api/v1/intel/strategies").then(r => r.json()),
      fetch("http://localhost:8000/api/v1/intel/situations").then(r => r.json())
    ]).then(([stratData, sitData]) => {
      setStrategies(stratData.strategies || []);
      setSituations(sitData.situations || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const getRiskColor = (drawdown) => {
    const dd = Math.abs(parseFloat(drawdown) || 0);
    if (dd < 15) return "text-emerald-600 dark:text-emerald-500";
    if (dd < 30) return "text-amber-600 dark:text-amber-500";
    return "text-red-600 dark:text-red-500";
  };
  
  const getReturnColor = (ret) => {
    const r = parseFloat(ret) || 0;
    if (r > 15) return "text-emerald-600 dark:text-emerald-500";
    if (r > 0) return "text-emerald-500 dark:text-emerald-400";
    if (r > -5) return "text-amber-600 dark:text-amber-500";
    return "text-red-600 dark:text-red-500";
  };

  const filteredStrategies = useMemo(() => {
    let filtered = [...strategies];
    if (selectedSituation !== 'All') {
      filtered = filtered.filter(s => s['Best-fit situation']?.includes(selectedSituation));
    }
    // Sort by 3M return (descending) as proxy for current profitability
    filtered.sort((a, b) => (parseFloat(b['3M return']) || 0) - (parseFloat(a['3M return']) || 0));
    return filtered;
  }, [strategies, selectedSituation, selectedAssetClass]);

  const uniqueSituations = ["All", ...new Set(strategies.map(s => s['Best-fit situation']).filter(Boolean))];

  return (
    <div className="w-full pb-20">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-50 uppercase tracking-wider mb-1">Strategy Intelligence</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">Compare algorithmic strategies based on market regime and risk.</p>
        </div>
        <button className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900">
          <Plus size={16} />
          <span>Add Strategy</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
          <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Market Situation</label>
          <select 
            className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm font-medium text-slate-900 dark:text-zinc-50 focus:outline-none focus:border-indigo-500 transition-colors"
            value={selectedSituation}
            onChange={e => setSelectedSituation(e.target.value)}
          >
            {uniqueSituations.map(sit => <option key={sit} value={sit}>{sit}</option>)}
          </select>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
          <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Asset Class</label>
          <select 
            className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm font-medium text-slate-900 dark:text-zinc-50 focus:outline-none focus:border-indigo-500 transition-colors"
            value={selectedAssetClass}
            onChange={e => setSelectedAssetClass(e.target.value)}
          >
            <option value="All">All Assets</option>
            <option value="Equities">Equities</option>
            <option value="Crypto">Crypto</option>
            <option value="Futures">Futures</option>
          </select>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 md:col-span-2 flex flex-col justify-center shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between z-10 relative">
            <div>
              <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Current Regime Signal</div>
              <div className="flex items-center space-x-2">
                <Activity className="text-indigo-500" size={16} />
                <span className="font-bold text-lg text-slate-900 dark:text-zinc-50">Equity Risk-On</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1">VIX: 14.2 | SPY &gt; 200DMA</div>
              <div className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase flex items-center justify-end space-x-1">
                <AlertTriangle size={10} />
                <span>Historical data only</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap text-sm">
            <thead className="bg-slate-50 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-800">
              <tr>
                <th className="py-3 px-4 font-medium">Rank</th>
                <th className="py-3 px-4 font-medium">Strategy Name</th>
                <th className="py-3 px-4 font-medium">Style</th>
                <th className="py-3 px-4 font-medium text-right">3M Ret</th>
                <th className="py-3 px-4 font-medium text-right">1Y Sharpe</th>
                <th className="py-3 px-4 font-medium text-right">Max DD</th>
                <th className="py-3 px-4 font-medium">Situation Fit</th>
                <th className="py-3 px-4 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {loading ? (
                <tr><td colSpan="8" className="p-8 text-center text-sm font-medium text-slate-500 dark:text-zinc-500">Loading intelligence data...</td></tr>
              ) : filteredStrategies.map((strat, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors group">
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-zinc-50">#{idx + 1}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-indigo-600 dark:text-indigo-400">{strat.Strategy}</div>
                    <div className="text-[11px] font-medium text-slate-500 dark:text-zinc-500 mt-0.5">By {strat.Author} | {strat.Followers} follows</div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-600 dark:text-zinc-300">{strat.Style}</td>
                  <td className={`py-3 px-4 text-right font-bold ${getReturnColor(strat['3M return'])}`}>
                    {strat['3M return'] ? `${(parseFloat(strat['3M return'])).toFixed(2)}%` : '—'}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-700 dark:text-zinc-200">{strat['1Y Sharpe'] || '—'}</td>
                  <td className={`py-3 px-4 text-right font-bold ${getRiskColor(strat['5Y drawdown'])}`}>
                    {strat['5Y drawdown'] ? `${(parseFloat(strat['5Y drawdown'])).toFixed(2)}%` : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-1 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-md text-xs font-semibold text-slate-700 dark:text-zinc-300 truncate max-w-[150px]">
                      {strat['Best-fit situation']}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button 
                      onClick={() => setSelectedStrategy(strat)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-md transition-all"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Strategy Detail Modal */}
      {selectedStrategy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-zinc-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            
            <div className="flex justify-between items-start p-6 border-b border-slate-200 dark:border-zinc-800">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 text-[10px] font-bold rounded uppercase tracking-wider">{selectedStrategy['Source bucket']}</span>
                  <span className="text-slate-500 dark:text-zinc-500 text-xs font-semibold">{selectedStrategy.Submitted}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-zinc-50 mb-1">{selectedStrategy.Strategy}</h3>
                <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Author: <span className="text-slate-800 dark:text-zinc-200">{selectedStrategy.Author}</span> | Followers: {selectedStrategy.Followers}</div>
              </div>
              <button onClick={() => setSelectedStrategy(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-400 dark:text-zinc-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-slate-50 dark:bg-zinc-950 rounded-xl p-5 border border-slate-200 dark:border-zinc-800">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-50 uppercase tracking-wider mb-3 flex items-center"><Info size={14} className="mr-2 text-indigo-500"/> Alpha Thesis</h4>
                    <p className="text-sm text-slate-600 dark:text-zinc-400 font-medium leading-relaxed">{selectedStrategy['Alpha thesis']}</p>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-zinc-950 rounded-xl p-5 border border-slate-200 dark:border-zinc-800">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-50 uppercase tracking-wider mb-3">Implementation & Rules</h4>
                    <p className="text-sm text-slate-600 dark:text-zinc-400 font-medium leading-relaxed">{selectedStrategy['Implementation / rules']}</p>
                    
                    <div className="mt-5 pt-4 border-t border-slate-200 dark:border-zinc-800 flex flex-wrap gap-2">
                      {selectedStrategy.Tags && selectedStrategy.Tags.split(';').map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-md text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">{tag.trim()}</span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4">
                      <h5 className="text-[11px] uppercase tracking-wider text-emerald-700 dark:text-emerald-500 font-bold mb-2">Best Used When</h5>
                      <p className="text-sm text-emerald-900 dark:text-emerald-100 font-medium">{selectedStrategy['Best-fit situation']}</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4">
                      <h5 className="text-[11px] uppercase tracking-wider text-red-700 dark:text-red-500 font-bold mb-2">Data Caveat / Risk</h5>
                      <p className="text-sm text-red-900 dark:text-red-100 font-medium">{selectedStrategy['Data caveat']}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-slate-200 dark:border-zinc-800 shadow-sm">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-5">Historical Performance</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <span className="text-sm font-semibold text-slate-600 dark:text-zinc-400">3M Return</span>
                        <span className={`text-xl font-bold tracking-tight ${getReturnColor(selectedStrategy['3M return'])}`}>
                          {selectedStrategy['3M return'] ? `${parseFloat(selectedStrategy['3M return']).toFixed(2)}%` : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="text-sm font-semibold text-slate-600 dark:text-zinc-400">1Y Sharpe</span>
                        <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">{selectedStrategy['1Y Sharpe'] || '—'}</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="text-sm font-semibold text-slate-600 dark:text-zinc-400">5Y CAGR</span>
                        <span className={`text-xl font-bold tracking-tight ${getReturnColor(selectedStrategy['5Y CAGR'])}`}>
                          {selectedStrategy['5Y CAGR'] ? `${parseFloat(selectedStrategy['5Y CAGR']).toFixed(2)}%` : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="text-sm font-semibold text-slate-600 dark:text-zinc-400">Max Drawdown</span>
                        <span className={`text-xl font-bold tracking-tight ${getRiskColor(selectedStrategy['5Y drawdown'])}`}>
                          {selectedStrategy['5Y drawdown'] ? `${parseFloat(selectedStrategy['5Y drawdown']).toFixed(2)}%` : '—'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-start space-x-2">
                      <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider">Historical backtest, not live performance.</p>
                    </div>
                  </div>

                  <button className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900">
                    <span>Activate Strategy in Dashboard</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default StrategyIntelligence;
