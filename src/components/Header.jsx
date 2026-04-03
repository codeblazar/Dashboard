import { useState, useEffect } from 'react'

const THEMES = ['system', 'light', 'dark']
const THEME_ICONS = { system: '⚙️', light: '☀️', dark: '🌙' }
const THEME_LABELS = { system: 'System', light: 'Light', dark: 'Dark' }

function applyTheme(theme) {
  const root = document.documentElement
  if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark')
  } else if (theme === 'light') {
    root.setAttribute('data-theme', 'light')
  } else {
    root.removeAttribute('data-theme')
  }
}

export default function Header({ generatedAt }) {
  const [now, setNow] = useState(new Date())
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') ?? 'system')

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const dateStr = now.toLocaleDateString('en-AU', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
  const timeStr = now.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })

  const nextTheme = () => setTheme(t => THEMES[(THEMES.indexOf(t) + 1) % THEMES.length])

  return (
    <header className="site-header">
      <div className="header-left">
        <h1 className="site-title">Dashboard</h1>
        <span className="header-datetime">{dateStr} — {timeStr}</span>
      </div>
      <div className="header-right">
        {generatedAt && (
          <span className="feeds-age">Briefing updated {relativeTime(generatedAt)}</span>
        )}
        <button className="theme-toggle" onClick={nextTheme} title={`Theme: ${THEME_LABELS[theme]}`}>
          {THEME_ICONS[theme]} {THEME_LABELS[theme]}
        </button>
      </div>
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
