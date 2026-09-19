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
    if (dd < 15) return "text-emerald-400";
    if (dd < 30) return "text-amber-400";
    return "text-red-400";
  };
  
  const getReturnColor = (ret) => {
    const r = parseFloat(ret) || 0;
    if (r > 15) return "text-emerald-400";
    if (r > 0) return "text-emerald-300";
    if (r > -5) return "text-amber-400";
    return "text-red-400";
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
    <div className="w-full text-white pb-20">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">Strategy Intelligence</h2>
          <p className="text-slate-400">Compare and rank algorithmic strategies based on market regime, risk, and historical performance.</p>
        </div>
        <button className="flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-purple-500/20">
          <Plus size={18} />
          <span>Add My Strategy</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <label className="block text-sm text-slate-400 mb-2">Market Situation</label>
          <select 
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
            value={selectedSituation}
            onChange={e => setSelectedSituation(e.target.value)}
          >
            {uniqueSituations.map(sit => <option key={sit} value={sit}>{sit}</option>)}
          </select>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <label className="block text-sm text-slate-400 mb-2">Asset Class</label>
          <select 
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
            value={selectedAssetClass}
            onChange={e => setSelectedAssetClass(e.target.value)}
          >
            <option value="All">All Assets</option>
            <option value="Equities">Equities</option>
            <option value="Crypto">Crypto</option>
            <option value="Futures">Futures</option>
          </select>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 md:col-span-2 flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-400 mb-1">Current Regime Signal</div>
            <div className="flex items-center space-x-2">
              <Activity className="text-cyan-400" size={20} />
              <span className="font-semibold text-lg">Equity Risk-On</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500 mb-1">VIX: 14.2 | SPY &gt; 200DMA</div>
            <div className="text-xs text-amber-400 flex items-center justify-end space-x-1">
              <AlertTriangle size={12} />
              <span>Historical data only</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-900/50">
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Rank</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Strategy Name</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Style</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">3M Ret</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">1Y Sharpe</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Max DD</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Situation Fit</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                <tr><td colSpan="8" className="p-8 text-center text-slate-400">Loading intelligence data...</td></tr>
              ) : filteredStrategies.map((strat, idx) => (
                <tr key={idx} className="hover:bg-slate-700/30 transition-colors group">
                  <td className="p-4 font-bold text-slate-300">#{idx + 1}</td>
                  <td className="p-4">
                    <div className="font-medium text-cyan-50">{strat.Strategy}</div>
                    <div className="text-xs text-slate-500 mt-1">By {strat.Author} | {strat.Followers} follows</div>
                  </td>
                  <td className="p-4 text-sm text-slate-300">{strat.Style}</td>
                  <td className={`p-4 text-right font-medium ${getReturnColor(strat['3M return'])}`}>
                    {strat['3M return'] ? `${(parseFloat(strat['3M return'])).toFixed(2)}%` : 'N/A'}
                  </td>
                  <td className="p-4 text-right text-slate-300">{strat['1Y Sharpe'] || 'N/A'}</td>
                  <td className={`p-4 text-right font-medium ${getRiskColor(strat['5Y drawdown'])}`}>
                    {strat['5Y drawdown'] ? `${(parseFloat(strat['5Y drawdown'])).toFixed(2)}%` : 'N/A'}
                  </td>
                  <td className="p-4">
                    <span className="inline-block px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-300 truncate max-w-[150px]">
                      {strat['Best-fit situation']}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => setSelectedStrategy(strat)}
                      className="opacity-0 group-hover:opacity-100 p-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg transition-all"
                    >
                      <ChevronRight size={18} />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            
            <div className="flex justify-between items-start p-6 border-b border-slate-800">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs font-bold rounded uppercase tracking-wider">{selectedStrategy['Source bucket']}</span>
                  <span className="text-slate-500 text-sm">{selectedStrategy.Submitted}</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{selectedStrategy.Strategy}</h3>
                <div className="text-slate-400">Author: <span className="text-slate-200">{selectedStrategy.Author}</span> | Followers: {selectedStrategy.Followers}</div>
              </div>
              <button onClick={() => setSelectedStrategy(null)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                    <h4 className="text-lg font-semibold text-white mb-3 flex items-center"><Info size={18} className="mr-2 text-cyan-400"/> Alpha Thesis</h4>
                    <p className="text-slate-300 leading-relaxed">{selectedStrategy['Alpha thesis']}</p>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                    <h4 className="text-lg font-semibold text-white mb-3">Implementation & Rules</h4>
                    <p className="text-slate-300 leading-relaxed">{selectedStrategy['Implementation / rules']}</p>
                    
                    <div className="mt-4 pt-4 border-t border-slate-700 flex flex-wrap gap-2">
                      {selectedStrategy.Tags && selectedStrategy.Tags.split(';').map((tag, i) => (
                        <span key={i} className="px-3 py-1 bg-slate-900 border border-slate-700 rounded-full text-xs text-slate-400">{tag.trim()}</span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-xl p-4">
                      <h5 className="text-emerald-400 font-medium mb-2 text-sm">Best Used When</h5>
                      <p className="text-slate-300 text-sm">{selectedStrategy['Best-fit situation']}</p>
                    </div>
                    <div className="bg-red-900/20 border border-red-500/20 rounded-xl p-4">
                      <h5 className="text-red-400 font-medium mb-2 text-sm">Data Caveat / Risk</h5>
                      <p className="text-slate-300 text-sm">{selectedStrategy['Data caveat']}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-slate-800/80 rounded-xl p-5 border border-slate-700 shadow-lg">
                    <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Historical Performance</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <span className="text-slate-300">3M Return</span>
                        <span className={`text-xl font-bold ${getReturnColor(selectedStrategy['3M return'])}`}>
                          {selectedStrategy['3M return'] ? `${parseFloat(selectedStrategy['3M return']).toFixed(2)}%` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="text-slate-300">1Y Sharpe</span>
                        <span className="text-xl font-bold text-white">{selectedStrategy['1Y Sharpe'] || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="text-slate-300">5Y CAGR</span>
                        <span className={`text-xl font-bold ${getReturnColor(selectedStrategy['5Y CAGR'])}`}>
                          {selectedStrategy['5Y CAGR'] ? `${parseFloat(selectedStrategy['5Y CAGR']).toFixed(2)}%` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="text-slate-300">Max Drawdown</span>
                        <span className={`text-xl font-bold ${getRiskColor(selectedStrategy['5Y drawdown'])}`}>
                          {selectedStrategy['5Y drawdown'] ? `${parseFloat(selectedStrategy['5Y drawdown']).toFixed(2)}%` : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-amber-500/10 rounded-lg flex items-start space-x-2">
                      <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-400/80 leading-relaxed">Metrics are platform-reported historical backtests, not live verified performance.</p>
                    </div>
                  </div>

                  <a 
                    href={selectedStrategy['Source URL']} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white p-3 rounded-xl transition-all"
                  >
                    <Code size={18} />
                    <span>View Public Source Code</span>
                    <ExternalLink size={14} className="text-slate-400 ml-2" />
                  </a>
                  
                  <button className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white p-3 rounded-xl font-medium shadow-lg shadow-cyan-500/20 transition-all">
                    <span>Activate Strategy in Dashboard</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mini Tip Popup */}
      <div className="fixed bottom-6 left-6 max-w-sm bg-slate-900/95 border border-cyan-500/30 rounded-xl p-4 shadow-2xl backdrop-blur-md z-40 transform transition-transform animate-fade-in-up">
        <div className="flex items-center space-x-2 mb-2">
          <div className="bg-cyan-500/20 p-1.5 rounded-md">
            <Activity size={14} className="text-cyan-400" />
          </div>
          <span className="text-sm font-bold text-white tracking-wide">CHRONOS INTEL TIP</span>
          <span className="text-[10px] text-slate-500 ml-auto">{new Date().toLocaleTimeString()}</span>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed mb-3">
          <span className="text-cyan-300 font-medium">SPY</span> is below its 200DMA and VIX is elevated. <strong className="text-white">Regime-Based Downside Protection</strong> is currently a stronger fit to reduce equity exposure.
        </p>
        <div className="flex justify-between items-center text-xs">
          <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded">Risk: Limited history</span>
          <span className="text-slate-400">Confidence: <span className="text-emerald-400 font-medium">Medium</span></span>
        </div>
      </div>
      
    </div>
  );
};

export default StrategyIntelligence;
