import { useState, useEffect } from 'react'

const STOCKS_URL = import.meta.env.VITE_STOCKS_URL
  ?? `${import.meta.env.BASE_URL}data/stocks.json`

export function useStocks() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    fetch(STOCKS_URL, { signal: controller.signal })
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
    stocks: data?.stocks ?? [],
    stockFearGreed: data?.stockFearGreed ?? null,
    btcFearGreed: data?.btcFearGreed ?? null,
    updatedAt: data?.updatedAt ?? null,
    loading,
    error,
  }
}
