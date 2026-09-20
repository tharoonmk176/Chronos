import React, { useState, useEffect } from 'react';
import HoldingDetailModal from './HoldingDetailModal';
import { useRegion } from '../RegionContext';
import { Upload, FileText, CheckCircle, AlertCircle, TrendingUp, TrendingDown, RefreshCw, Plus, X, ArrowRight } from 'lucide-react';

export default function PortfolioDashboard() {
  const { region } = useRegion();
  const getTip = (h) => {
    if (h.total_gain_pct > 20 && h.today_gain < 0) return { action: 'HOLD', reason: 'Strong trend despite daily dip', color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30' };
    if (h.total_gain_pct < -10) return { action: 'REVIEW', reason: 'High drawdown', color: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-500/30' };
    if (h.today_gain > 0 && h.total_gain_pct > 5) return { action: 'ACCUMULATE', reason: 'Trend confirming upside', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30' };
    return { action: 'HOLD', reason: 'Consolidating', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30' };
  };
  const [portfolios, setPortfolios] = useState([]);
  const [activePortfolio, setActivePortfolio] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [reviewItems, setReviewItems] = useState(null);
  const [tipFilter, setTipFilter] = useState('ALL');
  const [selectedHolding, setSelectedHolding] = useState(null);

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/portfolios');
      const data = await res.json();
      setPortfolios(data.portfolios || []);
      if (data.portfolios && data.portfolios.length > 0) {
        loadPortfolio(data.portfolios[0].id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const loadPortfolio = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/portfolio/${id}`);
      const data = await res.json();
      setActivePortfolio(data.portfolio);
      setHoldings(data.holdings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch('http://localhost:8000/api/v1/portfolio/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setReviewItems(data.items);
      }
    } catch (err) {
      alert("Error uploading file.");
    } finally {
      setUploading(false);
    }
  };

  const handleSavePortfolio = async () => {
    setUploading(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/portfolio/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: "My Uploaded Portfolio",
          items: reviewItems
        })
      });
      const data = await res.json();
      if (data.portfolio_id) {
        setReviewItems(null);
        await fetchPortfolios();
      }
    } catch (err) {
      alert("Error saving portfolio.");
    } finally {
      setUploading(false);
    }
  };

  const formatCurrency = (val) => {
    const num = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0);
    return `${region.currency}${num}`;
  };

  const filteredHoldings = tipFilter === 'ALL' 
    ? holdings 
    : holdings.filter(h => getTip(h).action === tipFilter);

  if (reviewItems) {
    return (
      <div className="w-full max-w-5xl mx-auto space-y-6">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-50 mb-1">Review Uploaded Holdings</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">Please verify the extracted data before saving.</p>
            </div>
            <button onClick={() => setReviewItems(null)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300">
              <X size={20} />
            </button>
          </div>
          
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-zinc-800 mb-6">
            <table className="w-full text-left border-collapse whitespace-nowrap text-sm">
              <thead className="bg-slate-50 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-800">
                <tr>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs">Ticker</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs text-right">Quantity</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs text-right">Buy Price</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {reviewItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                    <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">{item.ticker}</td>
                    <td className="py-3 px-4 text-right font-medium text-slate-900 dark:text-zinc-200">{item.quantity}</td>
                    <td className="py-3 px-4 text-right font-medium text-slate-900 dark:text-zinc-200">{formatCurrency(item.buy_price)}</td>
                    <td className="py-3 px-4 font-medium text-slate-500 dark:text-zinc-400">{item.purchase_date || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button onClick={() => setReviewItems(null)} className="px-4 py-2 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
              Cancel
            </button>
            <button onClick={handleSavePortfolio} disabled={uploading} className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              {uploading ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle size={16} />}
              <span>{uploading ? 'Saving...' : 'Confirm & Save'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-500 dark:text-zinc-400">Loading portfolio data...</div>;
  }

  if (!activePortfolio && portfolios.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="bg-indigo-50 dark:bg-indigo-500/10 p-4 rounded-full mb-6">
          <Upload size={32} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-50 mb-2">Upload Your Portfolio</h2>
        <p className="text-slate-500 dark:text-zinc-400 max-w-md mb-8">
          Upload your stock holdings via Excel or CSV to unlock live valuation, strategy-based suggestions, and risk analysis. PDF support coming soon.
        </p>
        
        <label className="cursor-pointer flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-sm">
          {uploading ? <RefreshCw className="animate-spin" size={20} /> : <FileText size={20} />}
          <span>{uploading ? 'Processing...' : 'Browse Files'}</span>
          <input type="file" className="hidden" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} disabled={uploading} />
        </label>
        
        <div className="mt-8 text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center space-x-2">
          <AlertCircle size={14} />
          <span>Not financial advice — validate all signals before trading.</span>
        </div>
      </div>
    );
  }

  const totalInvested = holdings.reduce((sum, h) => sum + h.invested_amount, 0);
  const totalValue = holdings.reduce((sum, h) => sum + h.current_value, 0);
  const totalGain = totalValue - totalInvested;
  const totalGainPct = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;
  const todayGain = holdings.reduce((sum, h) => sum + h.today_gain, 0);
  const todayGainPct = totalValue > 0 ? (todayGain / (totalValue - todayGain)) * 100 : 0;

  return (
    <div className="w-full max-w-7xl mx-auto pb-20">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-50 uppercase tracking-wider mb-1">{activePortfolio?.name}</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">Live portfolio valuation and holding analysis.</p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 rounded-lg text-sm font-medium transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800">
            <span>Analyze Portfolio</span>
            <ArrowRight size={16} />
          </button>
          <label className="cursor-pointer flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} />
            <span>Add Holdings</span>
            <input type="file" className="hidden" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Total Value</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-zinc-50 mb-1">{formatCurrency(totalValue)}</div>
          <div className="text-xs font-medium text-slate-500 dark:text-zinc-500">Invested: {formatCurrency(totalInvested)}</div>
        </div>
        
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Total Return</div>
          <div className={`text-2xl font-bold flex items-center ${totalGain >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {totalGain >= 0 ? '+' : ''}{formatCurrency(totalGain)}
          </div>
          <div className={`text-xs font-semibold mt-1 flex items-center ${totalGain >= 0 ? 'text-emerald-600 dark:text-emerald-500/80' : 'text-red-600 dark:text-red-500/80'}`}>
            {totalGain >= 0 ? <TrendingUp size={12} className="mr-1"/> : <TrendingDown size={12} className="mr-1"/>}
            {totalGain >= 0 ? '+' : ''}{totalGainPct.toFixed(2)}% All-time
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Today's Return</div>
          <div className={`text-2xl font-bold flex items-center ${todayGain >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-600 dark:text-red-400'}`}>
            {todayGain >= 0 ? '+' : ''}{formatCurrency(todayGain)}
          </div>
          <div className={`text-xs font-semibold mt-1 flex items-center ${todayGain >= 0 ? 'text-indigo-600 dark:text-indigo-500/80' : 'text-red-600 dark:text-red-500/80'}`}>
            {todayGain >= 0 ? <TrendingUp size={12} className="mr-1"/> : <TrendingDown size={12} className="mr-1"/>}
            {todayGain >= 0 ? '+' : ''}{todayGainPct.toFixed(2)}% Today
          </div>
        </div>
        
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col justify-center relative overflow-hidden">
           <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Data Status</div>
           <div className="flex items-center space-x-2 text-slate-900 dark:text-zinc-50 font-bold">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <span>Live Market Data</span>
           </div>
           <div className="text-xs font-medium text-slate-500 dark:text-zinc-500 mt-1">Source: Yahoo Finance API</div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center bg-slate-50/50 dark:bg-zinc-900/50">
          <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-50 uppercase tracking-wider">Current Holdings</h3>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">AI Filter:</span>
            <select 
              value={tipFilter} 
              onChange={(e) => setTipFilter(e.target.value)}
              className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-md text-xs font-bold px-3 py-1.5 text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
            >
              <option value="ALL">ALL HOLDINGS</option>
              <option value="HOLD">HOLD ONLY</option>
              <option value="ACCUMULATE">ACCUMULATE ONLY</option>
              <option value="REVIEW">REVIEW ONLY</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap text-sm">
            <thead className="bg-slate-50 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-800">
              <tr>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs">Ticker</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs text-right">Shares</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs text-right">Buy Price</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs text-right">Current Price</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs text-right">Total Value</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs text-right">Total P/L</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs text-right">Today P/L</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs text-center w-48">Chronos AI Tip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                            {filteredHoldings.length === 0 && (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-500 dark:text-zinc-500 font-medium">
                    No holdings match the selected AI tip filter.
                  </td>
                </tr>
              )}
              {filteredHoldings.map((h, idx) => (
                <tr key={idx} onClick={() => setSelectedHolding(h)} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 cursor-pointer group">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-zinc-50">{h.ticker}</td>
                  <td className="py-3 px-4 text-right font-medium text-slate-700 dark:text-zinc-300">{h.quantity}</td>
                  <td className="py-3 px-4 text-right font-medium text-slate-700 dark:text-zinc-300">{formatCurrency(h.buy_price)}</td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-900 dark:text-zinc-50">{formatCurrency(h.current_price)}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-zinc-50">{formatCurrency(h.current_value)}</td>
                  <td className={`py-3 px-4 text-right font-bold ${h.total_gain >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {h.total_gain >= 0 ? '+' : ''}{formatCurrency(h.total_gain)}
                    <span className="text-[10px] ml-1 opacity-80 block">{h.total_gain >= 0 ? '+' : ''}{h.total_gain_pct.toFixed(2)}%</span>
                  </td>
                  <td className={`py-3 px-4 text-right font-semibold ${h.today_gain >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-600 dark:text-red-400'}`}>
                    {h.today_gain >= 0 ? '+' : ''}{formatCurrency(h.today_gain)}
                  </td>
                  <td className="py-2 px-4 text-center">
                    {(() => {
                      const tip = getTip(h);
                      return (
                        <div className="flex flex-col items-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${tip.color}`}>
                            {tip.action}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 truncate w-full max-w-[120px]">
                            {tip.reason}
                          </span>
                        </div>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-6 flex justify-center">
         <div className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center space-x-2">
           <AlertCircle size={14} />
           <span>Not financial advice — validate all signals before trading.</span>
         </div>
      </div>
      
      {selectedHolding && <HoldingDetailModal holding={selectedHolding} onClose={() => setSelectedHolding(null)} />}
    </div>
  );
}
