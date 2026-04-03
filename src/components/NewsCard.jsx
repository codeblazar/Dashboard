const LEAN_BADGE = {
  'left':         { bg: 'rgba(26,58,107,0.8)',  text: '#7eb8f7', label: 'Left' },
  'center-left':  { bg: 'rgba(26,74,90,0.8)',   text: '#7ecfef', label: 'Centre-Left' },
  'center':       { bg: 'rgba(60,60,60,0.8)',   text: '#c0c0c0', label: 'Centre' },
  'center-right': { bg: 'rgba(90,58,26,0.8)',   text: '#efb87e', label: 'Centre-Right' },
  'right':        { bg: 'rgba(107,26,26,0.8)',  text: '#f77e7e', label: 'Right' },
}

function relativeTime(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 2) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  return `${hrs}h ago`
}

export default function NewsCard({ item, showLean }) {
  const badge = showLean && item.lean ? LEAN_BADGE[item.lean] : null

  return (
    <div className="news-card">
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="news-title"
      >
        {item.title}
      </a>
      <div className="news-meta">
        <span className="news-source">{item.source}</span>
        {badge && (
          <span
            className="lean-badge"
            style={{ background: badge.bg, color: badge.text }}
          >
            {badge.label}
          </span>
        )}
        <span className="news-time muted">{relativeTime(item.published)}</span>
      </div>
    </div>
  )
}
