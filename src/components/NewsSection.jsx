import NewsCard from './NewsCard'

const CATEGORY_CONFIG = {
  'us-politics': { title: '🇺🇸 US Politics', showLean: true },
  'au-politics': { title: '🇦🇺 AU Politics', showLean: true },
  'world':       { title: '🌍 World Events', showLean: false },
  'ai':          { title: '🤖 AI & Tech',    showLean: false },
  'btc':         { title: '₿ Bitcoin',       showLean: false },
}

const LEAN_ORDER = ['left', 'center-left', 'center', 'center-right', 'right']

export default function NewsSection({ category, items, loading }) {
  const config = CATEGORY_CONFIG[category]

  // For political sections, interleave items by lean for balance display
  let displayItems = items
  if (config.showLean && items.length > 0) {
    displayItems = interleavedByLean(items)
  }

  return (
    <div className="card news-section">
      <h2 className="card-title">{config.title}</h2>

      {loading && <p className="muted">Loading…</p>}

      {!loading && displayItems.length === 0 && (
        <p className="muted">No articles in the last 12 hours.</p>
      )}

      {!loading && displayItems.length > 0 && (
        <div className="news-list">
          {displayItems.slice(0, 20).map((item, i) => (
            <NewsCard
              key={`${item.url}-${i}`}
              item={item}
              showLean={config.showLean}
            />
          ))}
        </div>
      )}

      {!loading && displayItems.length > 20 && (
        <p className="muted small">{displayItems.length - 20} more articles not shown</p>
      )}
    </div>
  )
}

// Round-robin interleave by political lean for visual balance
function interleavedByLean(items) {
  const buckets = {}
  for (const lean of LEAN_ORDER) {
    buckets[lean] = items.filter(i => i.lean === lean)
  }

  const result = []
  const maxLen = Math.max(...Object.values(buckets).map(b => b.length))
  for (let i = 0; i < maxLen; i++) {
    for (const lean of LEAN_ORDER) {
      if (buckets[lean][i]) result.push(buckets[lean][i])
    }
  }
  return result
}
