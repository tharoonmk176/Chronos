import os
import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

# Add Lucide imports
lucide_imports = "import { Activity, LayoutDashboard, Sliders, Grid3X2, Rocket } from 'lucide-react'\n"
content = content.replace("import { useState, useEffect } from 'react'", "import { useState, useEffect } from 'react'\n" + lucide_imports)

# Replace the Header Logo
old_header_logo = """<div> <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-50 tracking-tight">Chronos</h1> <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Quantitative Backtesting Engine</p> </div>"""
new_header_logo = """<div className="flex items-center gap-3"> <div className="p-2 bg-indigo-600 rounded-lg text-white"> <Activity className="w-5 h-5" /> </div> <div> <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-50 tracking-tight leading-tight">Chronos</h1> <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Quantitative Engine</p> </div> </div>"""
content = content.replace(old_header_logo, new_header_logo)

# Replace Navigation Tabs with icons
old_nav = """{['backtest', 'optimizer', 'correlation'].map(tab => ( <button key={tab} onClick={() => setActiveMainTab(tab)} className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${activeMainTab === tab ? 'bg-white dark:bg-zinc-900 shadow-sm text-indigo-600 ' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-300 dark:text-zinc-300 :text-slate-200'}`} > {tab} </button> ))}"""
new_nav = """
          <button onClick={() => setActiveMainTab('backtest')} className={`px-4 py-1.5 flex items-center gap-2 rounded-md text-sm font-medium transition-all ${activeMainTab === 'backtest' ? 'bg-white dark:bg-zinc-900 shadow-sm text-indigo-600' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'}`}> <LayoutDashboard className="w-4 h-4" /> Backtest </button>
          <button onClick={() => setActiveMainTab('optimizer')} className={`px-4 py-1.5 flex items-center gap-2 rounded-md text-sm font-medium transition-all ${activeMainTab === 'optimizer' ? 'bg-white dark:bg-zinc-900 shadow-sm text-indigo-600' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'}`}> <Sliders className="w-4 h-4" /> Optimizer </button>
          <button onClick={() => setActiveMainTab('correlation')} className={`px-4 py-1.5 flex items-center gap-2 rounded-md text-sm font-medium transition-all ${activeMainTab === 'correlation' ? 'bg-white dark:bg-zinc-900 shadow-sm text-indigo-600' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'}`}> <Grid3X2 className="w-4 h-4" /> Correlation </button>
"""
content = content.replace(old_nav, new_nav)

# Replace the Empty State
old_empty = """<div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 border-dashed p-12 text-center text-slate-500 dark:text-zinc-400 "> Run a backtest to see results here. </div>"""
new_empty = """<div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 border-dashed p-16 flex flex-col items-center justify-center text-center"> <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mb-4"> <Rocket className="w-8 h-8 text-indigo-500 opacity-80" /> </div> <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50 mb-2">Ready to Launch</h3> <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-md"> Configure your parameters on the left and hit <b>Run Backtest</b> to generate your strategy performance reports.</p> </div>"""
content = content.replace(old_empty, new_empty)

with open('src/App.jsx', 'w') as f:
    f.write(content)
