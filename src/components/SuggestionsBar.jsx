import { healthEmoji } from './StocksBar'

function searchUrl(query, suffix = '') {
  return `https://www.google.com/search?q=${encodeURIComponent(query + (suffix ? ' ' + suffix : ''))}`
}

function wikiUrl(topic) {
  return `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(topic)}`
}

function healthUrl(health) {
  if (health.category === 'Supplement') return `https://examine.com/search/?q=${encodeURIComponent(health.name)}`
  return searchUrl(health.name, health.category === 'Exercise' ? 'how to' : '')
}

export default function SuggestionsBar({ suggestions, loading }) {
  if (loading) return (
    <div className="suggestions-bar">
      <div className="suggestion-col"><span className="muted">Loading suggestions…</span></div>
    </div>
  )

  if (!suggestions) return (
    <div className="suggestions-bar">
      <div className="suggestion-col"><span className="muted">Suggestions will appear after first AI run.</span></div>
    </div>
  )

  const { food, learn } = suggestions
  const health = suggestions.health ?? (suggestions.exercise ? {
    category: 'Exercise',
    name: suggestions.exercise.name,
    description: [suggestions.exercise.duration, suggestions.exercise.equipment && suggestions.exercise.equipment !== 'None' ? suggestions.exercise.equipment : null].filter(Boolean).join(' · '),
    tip: suggestions.exercise.description,
  } : null)

  return (
    <div className="suggestions-bar">
      <div className="suggestion-col">
        <div className="suggestion-label">🍽️ Today's food</div>
        <div className="suggestion-name">
          <a href={searchUrl(food.name, 'recipe')} target="_blank" rel="noopener noreferrer">{food.name}</a>
        </div>
        <div className="suggestion-detail muted">{food.cuisine} · {food.description}</div>
        {food.tip && <div className="suggestion-tip muted"><span className="tip-emoji">💡</span> {food.tip}</div>}
      </div>
      <div className="suggestion-divider" />
      <div className="suggestion-col">
        {health ? (
          <>
            <div className="suggestion-label">
              {healthEmoji(health.category)} Health · <span className="suggestion-category">{health.category}</span>
            </div>
            <div className="suggestion-name">
              <a href={healthUrl(health)} target="_blank" rel="noopener noreferrer">{health.name}</a>
            </div>
            <div className="suggestion-detail muted">{health.description}</div>
            {health.tip && <div className="suggestion-tip muted"><span className="tip-emoji">💡</span> {health.tip}</div>}
          </>
        ) : (
          <span className="muted">Health tip loading…</span>
        )}
      </div>
      <div className="suggestion-divider" />
      <div className="suggestion-col">
        <div className="suggestion-label">🧠 Learn something</div>
        <div className="suggestion-name">
          <a href={wikiUrl(learn.topic)} target="_blank" rel="noopener noreferrer">{learn.topic}</a>
        </div>
        <div className="suggestion-detail muted">{learn.description}</div>
        {learn.why && <div className="suggestion-tip muted"><span className="tip-emoji">💡</span> {learn.why}</div>}
      </div>
    </div>
  )
}
