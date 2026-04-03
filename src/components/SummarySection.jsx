import SummaryArticle from './SummaryArticle'

const CATEGORY_CONFIG = {
  'us-politics': { title: '🇺🇸 US Politics',  showLean: true },
  'au-politics': { title: '🇦🇺 AU Politics',  showLean: true },
  'world':       { title: '🌍 World Events',  showLean: false },
  'ai':          { title: '🤖 AI & Tech',     showLean: false },
  'btc':         { title: '₿ Bitcoin',        showLean: false },
}

export default function SummarySection({ category, articles, loading }) {
  const config = CATEGORY_CONFIG[category]

  return (
    <div className="card summary-section">
      <h2 className="card-title">{config.title}</h2>

      {loading && <p className="muted">Generating briefing…</p>}

      {!loading && (!articles || articles.length === 0) && (
        <p className="muted">No briefing available yet.</p>
      )}

      {!loading && articles?.length > 0 && (
        <div className="summary-list">
          {articles.map((article, i) => (
            <SummaryArticle
              key={i}
              article={article}
              showLean={config.showLean}
            />
          ))}
        </div>
      )}
    </div>
  )
}
