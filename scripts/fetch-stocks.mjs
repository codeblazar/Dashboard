import { writeFile, mkdir } from 'fs/promises'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const SYMBOLS = [
  { symbol: 'AAPL',  name: 'Apple' },
  { symbol: 'NVDA',  name: 'NVIDIA' },
  { symbol: 'TSLA',  name: 'Tesla' },
  { symbol: 'GOOGL', name: 'Alphabet' },
  { symbol: 'AMZN',  name: 'Amazon' },
  { symbol: 'MSFT',  name: 'Microsoft' },
  { symbol: 'MSTR',  name: 'Strategy' },
  { symbol: 'PLTR',  name: 'Palantir' },
]

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; PersonalDashboard/1.0; +https://github.com/codeblazar/Dashboard)',
  'Accept': 'application/json',
}

const TIMEOUT_MS = 10000

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    clearTimeout(timer)
    return res
  } catch (err) {
    clearTimeout(timer)
    throw err
  }
}

async function fetchQuote({ symbol, name }) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`
    const res = await fetchWithTimeout(url, { headers: HEADERS })
    if (!res.ok) {
      console.warn(`  [${symbol}] HTTP ${res.status}`)
      return null
    }
    const json = await res.json()
    const meta = json?.chart?.result?.[0]?.meta
    if (!meta) {
      console.warn(`  [${symbol}] unexpected response structure`)
      return null
    }
    const price = meta.regularMarketPrice
    const prevClose = meta.chartPreviousClose
    const change = price - prevClose
    const changePct = (change / prevClose) * 100
    console.log(`  [${symbol}] $${price.toFixed(2)} (${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%)`)
    return { symbol, name, price, change, changePct, prevClose }
  } catch (err) {
    console.warn(`  [${symbol}] ${err.name === 'AbortError' ? 'timed out' : err.message}`)
    return null
  }
}

async function fetchStockFearGreed() {
  try {
    const res = await fetchWithTimeout('https://production.dataviz.cnn.io/index/fearandgreed/graphdata', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://edition.cnn.com',
        'Referer': 'https://edition.cnn.com/markets/fear-and-greed',
      },
    })
    if (!res.ok) {
      console.warn(`  [stock-fear-greed] HTTP ${res.status}`)
      return null
    }
    const json = await res.json()
    const fg = json?.fear_and_greed
    if (!fg) {
      console.warn('  [stock-fear-greed] unexpected response structure')
      return null
    }
    const value = Math.round(fg.score)
    const rating = fg.rating.replace(/\b\w/g, c => c.toUpperCase())
    const previousClose = Math.round(fg.previous_close)
    console.log(`  [stock-fear-greed] ${value} (${rating})`)
    return { value, rating, previousClose }
  } catch (err) {
    console.warn(`  [stock-fear-greed] ${err.name === 'AbortError' ? 'timed out' : err.message}`)
    return null
  }
}

async function fetchBtcPrice() {
  try {
    const res = await fetchWithTimeout('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT', { headers: HEADERS })
    if (!res.ok) {
      console.warn(`  [BTC] HTTP ${res.status}`)
      return null
    }
    const json = await res.json()
    const price = parseFloat(json.lastPrice)
    const changePct = parseFloat(json.priceChangePercent)
    const change = parseFloat(json.priceChange)
    const prevClose = price - change
    console.log(`  [BTC] $${price.toLocaleString('en-US', { maximumFractionDigits: 0 })} (${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%)`)
    return { symbol: 'BTC', name: 'Bitcoin', price, change, changePct, prevClose, isCrypto: true }
  } catch (err) {
    console.warn(`  [BTC] ${err.name === 'AbortError' ? 'timed out' : err.message}`)
    return null
  }
}

async function fetchBtcFearGreed() {
  try {
    const res = await fetchWithTimeout('https://api.alternative.me/fng/?limit=1', { headers: HEADERS })
    if (!res.ok) {
      console.warn(`  [btc-fear-greed] HTTP ${res.status}`)
      return null
    }
    const json = await res.json()
    const entry = json?.data?.[0]
    if (!entry) {
      console.warn('  [btc-fear-greed] unexpected response structure')
      return null
    }
    const value = parseInt(entry.value, 10)
    const rating = entry.value_classification
    console.log(`  [btc-fear-greed] ${value} (${rating})`)
    return { value, rating }
  } catch (err) {
    console.warn(`  [btc-fear-greed] ${err.name === 'AbortError' ? 'timed out' : err.message}`)
    return null
  }
}

async function main() {
  console.log('Fetching stock quotes...\n')

  const [quoteResults, btcPrice, stockFearGreed, btcFearGreed] = await Promise.all([
    Promise.allSettled(SYMBOLS.map(fetchQuote)),
    fetchBtcPrice(),
    fetchStockFearGreed(),
    fetchBtcFearGreed(),
  ])

  const stocks = quoteResults
    .map(r => (r.status === 'fulfilled' ? r.value : null))
    .filter(Boolean)

  // Append BTC at the end of the stocks list
  if (btcPrice) stocks.push(btcPrice)

  const output = {
    updatedAt: new Date().toISOString(),
    stocks,
    stockFearGreed,
    btcFearGreed,
  }

  const outDir = path.join(__dirname, '..', 'public', 'data')
  await mkdir(outDir, { recursive: true })
  await writeFile(path.join(outDir, 'stocks.json'), JSON.stringify(output, null, 2), 'utf8')

  const stockCount = stocks.filter(s => !s.isCrypto).length
  console.log(`\nWrote stocks.json (${stockCount}/${SYMBOLS.length} stocks, BTC: ${btcPrice ? 'ok' : 'n/a'}, stock F&G: ${stockFearGreed ? stockFearGreed.value : 'n/a'}, BTC F&G: ${btcFearGreed ? btcFearGreed.value : 'n/a'})`)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
