import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { X, Sparkles, PieChart, TrendingUp, TrendingDown, Layers, BarChart3, List } from 'lucide-react';
import { useRegion } from '../RegionContext';

export default function PortfolioAnalysisDrawer({ portfolioId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('market'); // market, sector, holdings
  const { region } = useRegion();

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

  const fmt = (n) => Number(n).toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 });

  const getChartOption = (type) => {
    if (!data) return {};
    let chartData = [];
    let name = '';
    
    if (type === 'market' && data.market) {
      chartData = data.market.map(m => ({ name: m.name, value: m.value }));
      name = 'Market Cap';
    } else if (type === 'sector' && data.sector) {
      chartData = data.sector.map(s => ({ name: s.name, value: s.value }));
      name = 'Sectors';
    } else if (type === 'holdings' && data.holdings) {
      chartData = data.holdings.map(h => ({ name: h.ticker, value: h.market_value }));
      name = 'Top Holdings';
    }

    return {
      tooltip: { 
        trigger: 'item', 
        formatter: (params) => {
            return `<strong>${params.name}</strong><br/>Value: ${region.currency}${fmt(params.value)} (${params.percent}%)`;
        }
      },
      legend: { 
          type: 'scroll',
          orient: 'vertical',
          right: 10,
          top: 20,
          bottom: 20,
          textStyle: { color: '#64748b', fontSize: 12 }
      },
      series: [
        {
          name: name,
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['40%', '50%'], // Shift pie to the left to make room for legend
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#ffffff',
            borderWidth: 2
          },
          label: { 
              show: false // Hide messy overlapping inline labels
          },
          labelLine: { show: false },
          data: chartData
        }
      ]
    };
  };

  const renderDetailsTable = (items) => {
    // Items can be from market/sector group or flat holdings list
    // We want to flatten them for market/sector to show all companies in that category
    let flatItems = [];
    if (activeTab === 'market') {
        data.market?.forEach(m => flatItems.push(...m.details));
    } else if (activeTab === 'sector') {
        data.sector?.forEach(s => flatItems.push(...s.details));
    } else {
        flatItems = data.holdings || [];
    }

    // Sort by market value desc and take only Top 6
    flatItems.sort((a, b) => b.market_value - a.market_value);
    flatItems = flatItems.slice(0, 6);

    return (
      <div className="overflow-x-auto mt-6">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-zinc-800">
              <th className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider bg-slate-50 dark:bg-zinc-900 rounded-tl-lg">Company Name</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider bg-slate-50 dark:bg-zinc-900 text-right">Market Value</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider bg-slate-50 dark:bg-zinc-900 text-right rounded-tr-lg">Total G/L</th>
            </tr>
          </thead>
          <tbody>
            {flatItems.map((item, idx) => (
              <tr key={idx} className="border-b border-slate-100 dark:border-zinc-800/50 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-900 dark:text-zinc-100">{item.company_name}</div>
                  <div className="text-xs text-slate-500">{item.ticker}</div>
                </td>
                <td className="py-3 px-4 text-right font-medium text-slate-700 dark:text-zinc-300">
                  {region.currency}{fmt(item.market_value)}
                </td>
                <td className="py-3 px-4 text-right">
                  <span className={`font-semibold flex items-center justify-end gap-1 ${item.total_gl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {item.total_gl >= 0 ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                    {region.currency}{fmt(Math.abs(item.total_gl))}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <>
    <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white dark:bg-zinc-950 border-l border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-slide-left">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center bg-slate-50 dark:bg-zinc-900">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-50 flex items-center gap-2">
            <PieChart size={24} className="text-indigo-600 dark:text-indigo-400" />
            Portfolio Analysis
          </h2>
        </div>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-0">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-indigo-500 font-medium animate-pulse p-6">
            <Sparkles className="mb-4" size={32} />
            <p>Classifying market caps, sectors, and holdings...</p>
          </div>
        ) : data && !data.error ? (
          <div className="flex flex-col h-full">
            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 pt-4">
              <button 
                onClick={() => setActiveTab('market')}
                className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'market' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'}`}
              >
                <BarChart3 size={16} />
                Market
              </button>
              <button 
                onClick={() => setActiveTab('sector')}
                className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'sector' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'}`}
              >
                <Layers size={16} />
                Sector
              </button>
              <button 
                onClick={() => setActiveTab('holdings')}
                className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'holdings' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'}`}
              >
                <List size={16} />
                Top Holdings
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm mb-6">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-50 uppercase tracking-wider mb-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
                        {activeTab === 'market' ? 'Market Capitalization Breakdown' : activeTab === 'sector' ? 'Sector Allocation Breakdown' : 'Portfolio Weights (Top Holdings)'}
                    </h3>
                    <div className="h-[320px] w-full">
                        <ReactECharts option={getChartOption(activeTab)} style={{ height: '100%', width: '100%' }} notMerge={true} />
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-50 uppercase tracking-wider mb-2">
                        Detailed Breakdown
                    </h3>
                    {renderDetailsTable()}
                </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-red-500 p-10 font-medium bg-red-50 dark:bg-red-500/10 rounded-xl m-6 border border-red-100 dark:border-red-500/20">
            Error analyzing portfolio. Please ensure the portfolio contains valid holdings.
          </div>
        )}
      </div>
    </div>
    </>
  );
}
