import { useState, useEffect } from 'react'

// BASE_URL is '/Dashboard/' in both dev and prod (set by vite.config.js base)
// In production, VITE_FEEDS_URL overrides to GitHub raw URL so feeds update without rebuild
const FEEDS_URL = import.meta.env.VITE_FEEDS_URL
  ?? `${import.meta.env.BASE_URL}data/feeds.json`

export function useFeeds() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [generatedAt, setGeneratedAt] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    fetch(FEEDS_URL, { signal: controller.signal })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(data => {
        setItems(data.items ?? [])
        setGeneratedAt(data.generatedAt ?? null)
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

  // Helper: get deduplicated items for a category
  function getCategory(category) {
    const seen = new Set()
    return items.filter(item => {
      if (item.category !== category) return false
      if (seen.has(item.url)) return false
      seen.add(item.url)
      return true
    })
  }

  return { items, loading, error, generatedAt, getCategory }
}
