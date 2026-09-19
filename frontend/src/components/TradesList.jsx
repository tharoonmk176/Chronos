export default function TradesList({ trades }) {
  if (!trades?.length) return <p className="muted">No trades executed for this run.</p>

  return (
    <div className="trades-card">
      <h3>Trades ({trades.length})</h3>
      <div className="trades-scroll">
        <table>
          <thead>
            <tr>
              <th>#</th><th>Type</th><th>Date</th><th>Price</th><th>Shares</th><th>Profit</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => (
              <tr key={t.trade_number} className={t.type === 'BUY' ? 'buy' : 'sell'}>
                <td>{t.trade_number}</td>
                <td>{t.type}</td>
                <td>{t.date}</td>
                <td>{t.price.toFixed(2)}</td>
                <td>{t.shares.toFixed(4)}</td>
                <td>{t.profit !== null && t.profit !== undefined ? t.profit.toFixed(2) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
