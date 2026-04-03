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

  const { food, exercise, learn } = suggestions

  return (
    <div className="suggestions-bar">
      <div className="suggestion-col">
        <div className="suggestion-label">🍽️ Today's food</div>
        <div className="suggestion-name">{food.name}</div>
        <div className="suggestion-detail muted">{food.cuisine} · {food.description}</div>
        {food.tip && <div className="suggestion-tip muted">💡 {food.tip}</div>}
      </div>
      <div className="suggestion-divider" />
      <div className="suggestion-col">
        <div className="suggestion-label">💪 Exercise</div>
        <div className="suggestion-name">{exercise.name}</div>
        <div className="suggestion-detail muted">{exercise.duration}{exercise.equipment && exercise.equipment !== 'None' ? ` · ${exercise.equipment}` : ''}</div>
        <div className="suggestion-tip muted">{exercise.description}</div>
      </div>
      <div className="suggestion-divider" />
      <div className="suggestion-col">
        <div className="suggestion-label">🧠 Learn something</div>
        <div className="suggestion-name">{learn.topic}</div>
        <div className="suggestion-detail muted">{learn.description}</div>
        {learn.why && <div className="suggestion-tip muted">💡 {learn.why}</div>}
      </div>
    </div>
  )
}
