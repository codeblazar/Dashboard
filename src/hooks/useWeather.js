import { useState, useEffect } from 'react'

// WMO weather interpretation codes → description + emoji
const WMO = {
  0:  { label: 'Clear sky',          icon: '☀️' },
  1:  { label: 'Mainly clear',       icon: '🌤️' },
  2:  { label: 'Partly cloudy',      icon: '⛅' },
  3:  { label: 'Overcast',           icon: '☁️' },
  45: { label: 'Fog',                icon: '🌫️' },
  48: { label: 'Icy fog',            icon: '🌫️' },
  51: { label: 'Light drizzle',      icon: '🌦️' },
  53: { label: 'Moderate drizzle',   icon: '🌦️' },
  55: { label: 'Heavy drizzle',      icon: '🌧️' },
  61: { label: 'Slight rain',        icon: '🌧️' },
  63: { label: 'Moderate rain',      icon: '🌧️' },
  65: { label: 'Heavy rain',         icon: '🌧️' },
  66: { label: 'Freezing rain',      icon: '🌨️' },
  67: { label: 'Heavy freezing rain',icon: '🌨️' },
  71: { label: 'Slight snow',        icon: '🌨️' },
  73: { label: 'Moderate snow',      icon: '❄️' },
  75: { label: 'Heavy snow',         icon: '❄️' },
  77: { label: 'Snow grains',        icon: '🌨️' },
  80: { label: 'Slight showers',     icon: '🌦️' },
  81: { label: 'Moderate showers',   icon: '🌧️' },
  82: { label: 'Violent showers',    icon: '🌧️' },
  85: { label: 'Snow showers',       icon: '🌨️' },
  86: { label: 'Heavy snow showers', icon: '❄️' },
  95: { label: 'Thunderstorm',       icon: '⛈️' },
  96: { label: 'Thunderstorm + hail',icon: '⛈️' },
  99: { label: 'Thunderstorm + heavy hail', icon: '⛈️' },
}

export function useWeather() {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by this browser')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude, longitude } = coords
        try {
          // Fetch weather and reverse geocode in parallel
          const [meteoRes, geoRes] = await Promise.all([
            fetch(
              `https://api.open-meteo.com/v1/forecast` +
              `?latitude=${latitude}&longitude=${longitude}` +
              `&current=temperature_2m,apparent_temperature,weathercode,windspeed_10m,relativehumidity_2m` +
              `&temperature_unit=celsius&windspeed_unit=kmh&timezone=auto`
            ),
            fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
              { headers: { 'User-Agent': 'PersonalDashboard/1.0 (codeblazar)' } }
            )
          ])

          if (!meteoRes.ok) throw new Error(`Open-Meteo error ${meteoRes.status}`)

          const [meteo, geo] = await Promise.all([meteoRes.json(), geoRes.json()])
          const c = meteo.current
          const wmo = WMO[c.weathercode] ?? { label: 'Unknown', icon: '🌡️' }

          const addr = geo?.address ?? {}
          const city =
            addr.city ?? addr.town ?? addr.village ?? addr.suburb ??
            addr.county ?? addr.state ?? 'Your Location'

          setWeather({
            city,
            country: addr.country_code?.toUpperCase() ?? '',
            temp: Math.round(c.temperature_2m),
            feelsLike: Math.round(c.apparent_temperature),
            description: wmo.label,
            icon: wmo.icon,
            wind: Math.round(c.windspeed_10m),
            humidity: c.relativehumidity_2m,
          })
        } catch (err) {
          setError(`Weather unavailable: ${err.message}`)
        } finally {
          setLoading(false)
        }
      },
      (err) => {
        const msgs = {
          1: 'Location access denied — please allow location in your browser',
          2: 'Location unavailable',
          3: 'Location request timed out',
        }
        setError(msgs[err.code] ?? 'Could not get location')
        setLoading(false)
      },
      { timeout: 10000, maximumAge: 300000 }
    )
  }, [])

  return { weather, loading, error }
}
