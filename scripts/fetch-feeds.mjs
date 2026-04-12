import { XMLParser } from 'fast-xml-parser'
import { writeFile, mkdir } from 'fs/promises'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const FEED_SOURCES = [
  // ── US Politics (balanced: left / center-left / center / right) ──
  {
    id: 'npr-politics',
    url: 'https://feeds.npr.org/1014/rss.xml',
    category: 'us-politics',
    source: 'NPR',
    lean: 'left',
  },
  {
    id: 'washingtonpost-politics',
    url: 'https://feeds.washingtonpost.com/rss/politics',
    category: 'us-politics',
    source: 'Washington Post',
    lean: 'center-left',
  },
  {
    id: 'thehill',
    url: 'https://thehill.com/feed/',
    category: 'us-politics',
    source: 'The Hill',
    lean: 'center',
  },
  {
    id: 'washingtontimes-politics',
    url: 'https://www.washingtontimes.com/rss/headlines/news/politics/',
    category: 'us-politics',
    source: 'Washington Times',
    lean: 'right',
  },
  {
    id: 'fox-politics',
    url: 'https://moxie.foxnews.com/google-publisher/politics.xml',
    category: 'us-politics',
    source: 'Fox News',
    lean: 'right',
  },

  // ── AU Politics (balanced: left / center-left / right) ──
  {
    id: 'abc-au',
    url: 'https://www.abc.net.au/news/feed/51120/rss.xml',
    category: 'au-politics',
    source: 'ABC Australia',
    lean: 'center-left',
  },
  {
    id: 'guardian-au',
    url: 'https://www.theguardian.com/australia-news/rss',
    category: 'au-politics',
    source: 'Guardian AU',
    lean: 'left',
  },
  {
    id: 'spectator-au',
    url: 'https://spectator.com.au/feed/',
    category: 'au-politics',
    source: 'Spectator AU',
    lean: 'right',
  },

  // ── World Events ──
  {
    id: 'bbc-world',
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    category: 'world',
    source: 'BBC World',
    lean: null,
  },
  {
    id: 'aljazeera',
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    category: 'world',
    source: 'Al Jazeera',
    lean: null,
  },
  {
    id: 'dw-world',
    url: 'https://rss.dw.com/rdf/rss-en-world',
    category: 'world',
    source: 'DW News',
    lean: null,
  },

  // ── AI & Tech ──
  {
    id: 'theverge-ai',
    url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
    category: 'ai',
    source: 'The Verge',
    lean: null,
  },
  {
    id: 'techcrunch-ai',
    url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    category: 'ai',
    source: 'TechCrunch',
    lean: null,
  },
  {
    id: 'wired-ai',
    url: 'https://www.wired.com/feed/tag/ai/latest/rss',
    category: 'ai',
    source: 'Wired',
    lean: null,
  },
  {
    id: 'mit-tech-review',
    url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed',
    category: 'ai',
    source: 'MIT Tech Review',
    lean: null,
  },
  {
    id: 'venturebeat-ai',
    url: 'https://venturebeat.com/category/ai/feed/',
    category: 'ai',
    source: 'VentureBeat',
    lean: null,
  },
  {
    id: 'ars-technica',
    url: 'https://feeds.arstechnica.com/arstechnica/index',
    category: 'ai',
    source: 'Ars Technica',
    lean: null,
  },
  {
    id: 'hackernews',
    url: 'https://news.ycombinator.com/rss',
    category: 'ai',
    source: 'Hacker News',
    lean: null,
  },

  // ── Bitcoin ──
  {
    id: 'coindesk',
    url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
    category: 'btc',
    source: 'CoinDesk',
    lean: null,
  },
  {
    id: 'cointelegraph',
    url: 'https://cointelegraph.com/rss',
    category: 'btc',
    source: 'CoinTelegraph',
    lean: null,
  },
  {
    id: 'bitcoinmagazine',
    url: 'https://bitcoinmagazine.com/.rss/full/',
    category: 'btc',
    source: 'Bitcoin Magazine',
    lean: null,
  },
  {
    id: 'decrypt',
    url: 'https://decrypt.co/feed',
    category: 'btc',
    source: 'Decrypt',
    lean: null,
  },
  {
    id: 'theblock',
    url: 'https://www.theblock.co/rss.xml',
    category: 'btc',
    source: 'The Block',
    lean: null,
  },
]

const DEFAULT_HOURS = 12
const AI_HOURS = 24   // AI news publishes less frequently
const TIMEOUT_MS = 12000

// Decode common HTML/XML entities (processEntities:false means parser leaves them raw)
function decodeEntities(str) {
  if (!str || typeof str !== 'string') return str
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
}

// processEntities: false prevents entity expansion limit errors (e.g. Fox News)
// htmlEntities: true handles HTML entities in content safely
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => ['item', 'entry'].includes(name),
  processEntities: false,
  htmlEntities: true,
})

async function fetchFeed(source) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(source.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PersonalDashboard/1.0; +https://github.com/codeblazar/Dashboard)',
        'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      },
    })
    clearTimeout(timer)

    if (!res.ok) {
      console.warn(`  [${source.id}] HTTP ${res.status} — skipping`)
      return []
    }

    const xml = await res.text()
    const parsed = parser.parse(xml)

    // Support RSS 2.0 (rss.channel.item), Atom (feed.entry), and RDF/RSS 1.0 (rdf:RDF.item)
    const channel = parsed?.rss?.channel ?? parsed?.feed
    const rdf = parsed?.['rdf:RDF']
    if (!channel && !rdf) {
      console.warn(`  [${source.id}] Unexpected feed structure — skipping`)
      return []
    }

    // RDF items are direct children of rdf:RDF, not nested in channel
    const rawItems = channel?.item ?? channel?.entry ?? rdf?.item ?? []
    const items = Array.isArray(rawItems) ? rawItems : [rawItems]

    return items.map(item => {
      const link =
        item.link?.['@_href'] ??
        (typeof item.link === 'string' ? item.link : null) ??
        item.guid?.['#text'] ??
        (typeof item.guid === 'string' ? item.guid : null) ??
        ''

      const title =
        item.title?.['#text'] ??
        (typeof item.title === 'string' ? item.title : '') ??
        ''

      const published =
        item.pubDate ??
        item.published ??
        item.updated ??
        item['dc:date'] ??
        null

      return {
        title: decodeEntities(title.trim()),
        url: link.trim(),
        published,
        source: source.source,
        lean: source.lean,
        category: source.category,
      }
    }).filter(item => item.title && item.url)

  } catch (err) {
    clearTimeout(timer)
    if (err.name === 'AbortError') {
      console.warn(`  [${source.id}] Timed out after ${TIMEOUT_MS}ms`)
    } else {
      console.warn(`  [${source.id}] Error: ${err.message}`)
    }
    return []
  }
}

function filterRecent(items, hours = DEFAULT_HOURS) {
  const cutoff = Date.now() - hours * 60 * 60 * 1000
  return items.filter(item => {
    if (!item.published) return false
    const ts = new Date(item.published).getTime()
    return !isNaN(ts) && ts > cutoff
  })
}

async function main() {
  console.log(`Fetching RSS feeds (last ${DEFAULT_HOURS}h, AI last ${AI_HOURS}h)...\n`)

  const allItems = []

  for (const source of FEED_SOURCES) {
    process.stdout.write(`  Fetching ${source.id}... `)
    const items = await fetchFeed(source)
    const hours = source.category === 'ai' ? AI_HOURS : DEFAULT_HOURS
    const recent = filterRecent(items, hours)
    // BTC sources cover all crypto — keep only Bitcoin-specific articles
    const filtered = source.category === 'btc'
      ? recent.filter(item => /bitcoin|\bbtc\b|satoshi|lightning network|bitcoin etf/i.test(item.title))
      : recent
    console.log(`${items.length} items → ${recent.length} recent → ${filtered.length} kept`)
    allItems.push(...filtered)
  }

  // Sort newest-first
  allItems.sort((a, b) => new Date(b.published) - new Date(a.published))

  const output = {
    generatedAt: new Date().toISOString(),
    itemCount: allItems.length,
    items: allItems,
  }

  const outDir = path.join(__dirname, '..', 'public', 'data')
  await mkdir(outDir, { recursive: true })
  await writeFile(path.join(outDir, 'feeds.json'), JSON.stringify(output, null, 2), 'utf8')

  console.log(`\nWrote ${allItems.length} items to public/data/feeds.json`)
  console.log(`Generated at: ${output.generatedAt}`)

  const categories = {}
  for (const item of allItems) {
    categories[item.category] = (categories[item.category] ?? 0) + 1
  }
  console.log('\nBreakdown:')
  for (const [cat, count] of Object.entries(categories)) {
    console.log(`  ${cat}: ${count}`)
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
