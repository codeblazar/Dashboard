import { useState, useEffect } from 'react'

const SUMMARIES_URL = import.meta.env.VITE_SUMMARIES_URL
  ?? `${import.meta.env.BASE_URL}data/summaries.json`

export function useSummaries() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    fetch(SUMMARIES_URL, { signal: controller.signal })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(json => {
        setData(json)
        setLoading(false)
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          setError(err.message)
          setLoading(false)
        }
      })

    return () => controller.abort()
  }, [])

  return {
    summaries: data?.summaries ?? {},
    suggestions: data?.suggestions ?? null,
    generatedAt: data?.generatedAt ?? null,
    loading,
    error,
  }
}
