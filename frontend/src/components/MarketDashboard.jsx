import React, { useEffect, useRef } from 'react';
import { useRegion } from '../RegionContext';

export default function MarketDashboard({ isDark }) {
  const { region } = useRegion();
  const containerRef = useRef();

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
      script.type = 'text/javascript';
      script.async = true;
      script.innerHTML = `
        {
          "autosize": true,
          "symbol": "${region.tvSymbol}",
          "interval": "D",
          "timezone": "Etc/UTC",
          "theme": "${isDark ? 'dark' : 'light'}",
          "style": "1",
          "locale": "en",
          "enable_publishing": false,
          "allow_symbol_change": true,
          "calendar": false,
          "support_host": "https://www.tradingview.com"
        }`;
      containerRef.current.appendChild(script);
    }
  }, [isDark, region]);

  return (
    <div className="w-full h-[700px] rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
      <div className="p-4 border-b border-slate-200 dark:border-zinc-800">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-zinc-50">Real-Time Market Dashboard</h2>
        <p className="text-sm text-slate-500 dark:text-zinc-400">Powered by TradingView</p>
      </div>
      <div className="tradingview-widget-container" ref={containerRef} style={{ height: "calc(100% - 73px)", width: "100%" }}>
        <div className="tradingview-widget-container__widget" style={{ height: "100%", width: "100%" }}></div>
      </div>
    </div>
  );
}
