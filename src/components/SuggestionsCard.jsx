export default function SuggestionsCard({ suggestions }) {
  const today = new Date().toLocaleDateString('en-AU', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div className="card suggestions-card">
      <h2 className="card-title">Today's Suggestions</h2>
      <p className="muted small">{today}</p>

      <div className="suggestion-item">
        <div className="suggestion-label">✈️ Destination</div>
        <div className="suggestion-name">{suggestions.travel.emoji} {suggestions.travel.name}</div>
        <div className="suggestion-reason muted">{suggestions.travel.reason}</div>
      </div>

      <div className="suggestion-item">
        <div className="suggestion-label">🍽️ Try cooking</div>
        <div className="suggestion-name">{suggestions.food.emoji} {suggestions.food.name}</div>
        <div className="suggestion-reason muted">
          {suggestions.food.cuisine} · {suggestions.food.type}
        </div>
      </div>

      <div className="suggestion-item">
        <div className="suggestion-label">💪 Exercise</div>
        <div className="suggestion-name">{suggestions.exercise.name}</div>
        <div className="suggestion-reason muted">
          {suggestions.exercise.category} · {suggestions.exercise.duration}
          {suggestions.exercise.equipment !== 'None' && ` · ${suggestions.exercise.equipment}`}
        </div>
      </div>
    </div>
  )
}
