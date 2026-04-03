const LEAN_BADGE = {
  'left':         { bg: 'rgba(26,58,107,0.8)',  text: '#7eb8f7', label: 'Left' },
  'center-left':  { bg: 'rgba(26,74,90,0.8)',   text: '#7ecfef', label: 'Centre-Left' },
  'center':       { bg: 'rgba(60,60,60,0.8)',   text: '#c0c0c0', label: 'Centre' },
  'center-right': { bg: 'rgba(90,58,26,0.8)',   text: '#efb87e', label: 'Centre-Right' },
  'right':        { bg: 'rgba(107,26,26,0.8)',  text: '#f77e7e', label: 'Right' },
}

export default function SummaryArticle({ article, showLean }) {
  const paragraphs = article.body
    ? article.body.split('\n').filter(p => p.trim())
    : []

  return (
    <div className="summary-article">
      <h3 className="summary-headline">{article.headline}</h3>
      <div className="summary-body">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {article.sources?.length > 0 && (
        <div className="summary-sources">
          <span className="sources-label">Sources: </span>
          {article.sources.map((src, i) => {
            const badge = showLean && src.lean ? LEAN_BADGE[src.lean] : null
            return (
              <span key={i} className="source-ref">
                <a href={src.url} target="_blank" rel="noopener noreferrer">
                  {src.source}
                </a>
                {badge && (
                  <span className="lean-badge-small" style={{ background: badge.bg, color: badge.text }}>
                    {badge.label}
                  </span>
                )}
                {i < article.sources.length - 1 && ', '}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
