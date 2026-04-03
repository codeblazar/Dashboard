import { useState, useEffect } from 'react'

export default function Header({ generatedAt }) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const dateStr = now.toLocaleDateString('en-AU', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
  const timeStr = now.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })

  return (
    <header className="site-header">
      <div className="header-left">
        <h1 className="site-title">Dashboard</h1>
        <span className="header-datetime">{dateStr} — {timeStr}</span>
      </div>
      {generatedAt && (
        <div className="header-right">
          <span className="feeds-age">
            Feeds updated {relativeTime(generatedAt)}
          </span>
        </div>
      )}
    </header>
  )
}

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 2) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  return `${hrs}h ago`
}
