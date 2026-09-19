import os

with open('src/components/TradesList.jsx', 'r') as f:
    content = f.read()

content = content.replace("export default function", "import { ArrowUpRight, ArrowDownRight } from 'lucide-react';\n\nexport default function")

old_profit_td = """<td
                    className={`py-2 px-3 text-right font-medium ${!t.profit ? "text-slate-400" : t.profit > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
                  >
                    {" "}
                    {t.profit !== null && t.profit !== undefined
                      ? `$${t.profit.toFixed(2)}`
                      : "—"}{" "}
                  </td>"""

new_profit_td = """<td className={`py-2 px-3 text-right font-medium ${!t.profit ? "text-slate-400" : t.profit > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                    <div className="flex items-center justify-end gap-1">
                    {t.profit !== null && t.profit !== undefined ? (
                      <>
                        {t.profit > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        {t.profit > 0 ? '+' : ''}${Math.abs(t.profit).toFixed(2)}
                      </>
                    ) : "—"}
                    </div>
                  </td>"""

import re
# Regex replace the td
content = re.sub(r'<td\s+className=\{`py-2 px-3 text-right font-medium \$\{!t\.profit \? "text-slate-400" : t\.profit > 0 \? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"\}`\}>\s*\{" "\}\s*\{t\.profit !== null && t\.profit !== undefined\s*\?\s*`\$\{t\.profit\.toFixed\(2\)\}`\s*:\s*"—"\}\{" "\}\s*</td>', new_profit_td, content, flags=re.DOTALL)

with open('src/components/TradesList.jsx', 'w') as f:
    f.write(content)
