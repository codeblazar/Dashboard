import Header from './components/Header'
import WeatherCard from './components/WeatherCard'
import SuggestionsCard from './components/SuggestionsCard'
import NewsSection from './components/NewsSection'
import { useWeather } from './hooks/useWeather'
import { useFeeds } from './hooks/useFeeds'
import { getDailySuggestions } from './data/suggestions'
import './App.css'

const CATEGORIES = ['us-politics', 'au-politics', 'world', 'ai', 'btc']

export default function App() {
  const { weather, loading: weatherLoading, error: weatherError } = useWeather()
  const { loading: feedsLoading, error: feedsError, generatedAt, getCategory } = useFeeds()
  const suggestions = getDailySuggestions()

  return (
    <div className="app">
      <Header generatedAt={generatedAt} />
      <main className="grid">
        <WeatherCard weather={weather} loading={weatherLoading} error={weatherError} />
        <SuggestionsCard suggestions={suggestions} />
        {CATEGORIES.map(cat => (
          <NewsSection
            key={cat}
            category={cat}
            items={getCategory(cat)}
            loading={feedsLoading}
          />
        ))}
      </main>
      {feedsError && (
        <div className="error-banner">
          Could not load feeds: {feedsError}
        </div>
      )}
      <footer className="site-footer">
        Dashboard · Open-Meteo weather · RSS news ·{' '}
        <a
          href="https://github.com/codeblazar/Dashboard"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </footer>
    </div>
  )
}
