export default function WeatherCard({ weather, loading, error }) {
  return (
    <div className="card weather-card">
      <h2 className="card-title">Weather</h2>
      {loading && <p className="muted">Detecting location…</p>}
      {error && <p className="muted error-text">{error}</p>}
      {weather && (
        <>
          <div className="weather-main">
            <span className="weather-icon">{weather.icon}</span>
            <div>
              <div className="weather-temp">{weather.temp}°C</div>
              <div className="weather-desc">{weather.description}</div>
            </div>
          </div>
          <div className="weather-location">
            📍 {weather.city}{weather.country ? `, ${weather.country}` : ''}
          </div>
          <div className="weather-details">
            <span>Feels like {weather.feelsLike}°C</span>
            <span>💨 {weather.wind} km/h</span>
            <span>💧 {weather.humidity}%</span>
          </div>
          <p className="muted small">Updates on page load · via Open-Meteo</p>
        </>
      )}
    </div>
  )
}
