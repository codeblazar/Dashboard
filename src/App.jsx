import Header from './components/Header'
import WeatherBar from './components/WeatherBar'
import SuggestionsBar from './components/SuggestionsBar'
import SummarySection from './components/SummarySection'
import { useWeather } from './hooks/useWeather'
import { useSummaries } from './hooks/useSummaries'
import './App.css'

const CATEGORIES = ['us-politics', 'au-politics', 'world', 'ai', 'btc']

export default function App() {
  const { weather, loading: weatherLoading, error: weatherError } = useWeather()
  const { summaries, suggestions, generatedAt, loading, error } = useSummaries()

  return (
    <div className="app">
      <Header generatedAt={generatedAt} />
      <WeatherBar weather={weather} loading={weatherLoading} error={weatherError} />
      <SuggestionsBar suggestions={suggestions} loading={loading} />
      <main className="news-grid">
        {CATEGORIES.map(cat => (
          <SummarySection
            key={cat}
            category={cat}
            articles={summaries[cat]}
            loading={loading}
          />
        ))}
      </main>
      {error && (
        <div className="error-banner">Could not load briefing: {error}</div>
      )}
      <footer className="site-footer">
        Dashboard · AI briefing by Claude Sonnet via OpenRouter · Weather by Open-Meteo ·{' '}
        <a href="https://github.com/codeblazar/Dashboard" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
      </footer>
    </div>
  )
}
