export default function WeatherBar({ weather, loading, error }) {
  return (
    <div className="weather-bar">
      {loading && <span className="muted">Detecting location…</span>}
      {error && <span className="weather-error">{error}</span>}
      {weather && (
        <>
          <span className="weather-location">📍 {weather.city}{weather.country ? `, ${weather.country}` : ''}</span>
          <span className="weather-sep">·</span>
          <span className="weather-icon">{weather.icon}</span>
          <span className="weather-temp">{weather.temp}°C</span>
          <span className="weather-desc">{weather.description}</span>
          <span className="weather-sep">·</span>
          <span className="weather-detail">Feels like {weather.feelsLike}°C</span>
          <span className="weather-sep">·</span>
          <span className="weather-detail">💨 {weather.wind} km/h</span>
          <span className="weather-sep">·</span>
          <span className="weather-detail">💧 {weather.humidity}%</span>
        </>
      )}
    </div>
  )
}
