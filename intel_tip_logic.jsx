      {/* Mini Tip Popup Logic (Stored for future use) */}
      <div className="fixed bottom-6 left-6 max-w-sm bg-white dark:bg-slate-900/95 border border-indigo-200 dark:border-cyan-500/30 rounded-xl p-4 shadow-2xl backdrop-blur-md z-40 transform transition-transform animate-fade-in-up">
        <div className="flex items-center space-x-2 mb-2">
          <div className="bg-indigo-100 dark:bg-cyan-500/20 p-1.5 rounded-md">
            <Activity size={14} className="text-indigo-600 dark:text-cyan-400" />
          </div>
          <span className="text-sm font-black text-slate-800 dark:text-white tracking-wide">CHRONOS INTEL TIP</span>
          <span className="text-[10px] font-bold text-slate-500 ml-auto">{new Date().toLocaleTimeString()}</span>
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed mb-3">
          <span className="text-indigo-600 dark:text-cyan-300 font-bold">SPY</span> is below its 200DMA and VIX is elevated. <strong className="text-slate-900 dark:text-white">Regime-Based Downside Protection</strong> is currently a stronger fit to reduce equity exposure.
        </p>
        <div className="flex justify-between items-center text-xs font-bold">
          <span className="px-2 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded">Risk: Limited history</span>
          <span className="text-slate-500 dark:text-slate-400">Confidence: <span className="text-emerald-600 dark:text-emerald-400">Medium</span></span>
        </div>
      </div>
