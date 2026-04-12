const HEALTH_EMOJIS = {
  'Exercise':      '💪',
  'Supplement':    '💊',
  'Sleep':         '😴',
  'Nutrition':     '🥗',
  'Mental Health': '🧘',
  'Hydration':     '💧',
  'Posture':       '🪑',
  'Recovery':      '🛁',
}

export function healthEmoji(category) {
  return HEALTH_EMOJIS[category] ?? '🌿'
}

function isMarketOpen() {
  const now = new Date()
  const eastern = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const day = eastern.getDay()
  const minutes = eastern.getHours() * 60 + eastern.getMinutes()
  if (day === 0 || day === 6) return false
  return minutes >= 9 * 60 + 30 && minutes < 16 * 60
}

function formatPrice(price, isCrypto) {
  if (isCrypto) {
    return price >= 1000
      ? price.toLocaleString('en-US', { maximumFractionDigits: 0 })
      : price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// SVG semicircle gauge — pure visual, text rendered outside
function GaugeDial({ data, label, gradId }) {
  if (!data) return null

  const { value, rating, previousClose } = data
  const cx = 45, cy = 40, r = 31, sw = 7
  const needleLen = r - sw / 2 - 1

  // value 0 = left (red), value 100 = right (green)
  const angle = (1 - value / 100) * Math.PI
  const nx = cx + needleLen * Math.cos(angle)
  const ny = cy - needleLen * Math.sin(angle)

  const hue = Math.round((value / 100) * 120)
  const valueColor = `hsl(${hue}, 70%, 52%)`

  return (
    <div
      className="gauge-dial"
      title={`${label} Fear & Greed: ${value}${previousClose != null ? ` — was ${previousClose} yesterday` : ''}`}
    >
      <svg width="90" height="46" viewBox="0 0 90 46" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#d43f3f" />
            <stop offset="28%"  stopColor="#d97320" />
            <stop offset="50%"  stopColor="#c8a800" />
            <stop offset="72%"  stopColor="#7ec030" />
            <stop offset="100%" stopColor="#2db55d" />
          </linearGradient>
        </defs>
        {/* Track */}
        <path
          d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={sw}
          strokeLinecap="round"
          opacity="0.12"
        />
        {/* Colored arc */}
        <path
          d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={sw}
          strokeLinecap="round"
        />
        {/* Needle */}
        <line
          x1={cx} y1={cy}
          x2={nx} y2={ny}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.85"
        />
        {/* Center dot */}
        <circle cx={cx} cy={cy} r="2.8" fill="currentColor" opacity="0.8" />
      </svg>
      <div className="gauge-meta">
        <span className="gauge-label">{label}</span>
        <span className="gauge-value" style={{ color: valueColor }}>{value}</span>
        <span className="gauge-rating">{rating}</span>
      </div>
    </div>
  )
}

export default function StocksBar({ stocks, stockFearGreed, btcFearGreed, loading, error }) {
  const open = isMarketOpen()

  if (loading) return (
    <div className="stocks-bar">
      <span className="muted">Loading market data…</span>
    </div>
  )

  if (error || stocks.length === 0) return (
    <div className="stocks-bar">
      <span className="muted">Market data unavailable</span>
    </div>
  )

  return (
    <div className="stocks-bar">
      <div className="stocks-chips">
        {stocks.map(s => {
          const href = s.isCrypto
            ? `https://finance.yahoo.com/quote/BTC-USD/`
            : `https://finance.yahoo.com/quote/${s.symbol}/`
          return (
            <a
              key={s.symbol}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`stock-chip ${s.change >= 0 ? 'stock-up' : 'stock-down'}${s.isCrypto ? ' stock-crypto' : ''}`}
            >
              <span className="stock-symbol">{s.isCrypto ? '₿' : s.symbol}</span>
              <span className="stock-price">${formatPrice(s.price, s.isCrypto)}</span>
              <span className="stock-change">
                {s.change >= 0 ? '▲' : '▼'}{Math.abs(s.changePct).toFixed(2)}%
              </span>
            </a>
          )
        })}
      </div>
      <div className="stocks-right">
        <span className={`market-status ${open ? 'market-open' : 'market-closed'}`}>
          {open ? '● Open' : '○ Closed'}
        </span>
        <GaugeDial data={stockFearGreed} label="Market" gradId="gauge-grad-market" />
        <GaugeDial data={btcFearGreed} label="₿" gradId="gauge-grad-btc" />
      </div>
    </div>
  )
}
