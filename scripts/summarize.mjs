import { readFile, writeFile, mkdir } from 'fs/promises'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const MODEL = 'anthropic/claude-3.5-haiku'
const BASE_URL = 'https://openrouter.ai/api/v1/chat/completions'

const CATEGORY_CONFIG = {
  'us-politics': {
    label: 'US Politics',
    balanced: true,
    prompt: 'US political news. Present all perspectives (left, centre, right) fairly and without bias.',
  },
  'au-politics': {
    label: 'Australian Politics',
    balanced: true,
    prompt: 'Australian political news. Present all perspectives fairly and without bias.',
  },
  'world': {
    label: 'World Events',
    balanced: false,
    prompt: 'major world events and international news.',
  },
  'ai': {
    label: 'AI & Technology',
    balanced: false,
    prompt: 'artificial intelligence, technology, and related developments.',
  },
  'btc': {
    label: 'Bitcoin',
    balanced: false,
    prompt: 'Bitcoin specifically. Focus only on Bitcoin (BTC) - price moves, adoption, regulation, and technology. Do not cover altcoins, Ethereum, or other cryptocurrencies.',
  },
}

async function callOpenRouter(messages) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://codeblazar.github.io/Dashboard/',
      'X-Title': 'Personal Dashboard',
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.3,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OpenRouter API error ${res.status}: ${text}`)
  }

  const data = await res.json()
  let content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('Empty response from API')

  // Strip markdown code fences if model wraps response despite json_object format
  content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()

  // Extract the JSON object in case the model prepends/appends prose
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (jsonMatch) content = jsonMatch[0]

  try {
    return JSON.parse(content)
  } catch {
    throw new Error(`Invalid JSON from API: ${content.slice(0, 200)}`)
  }
}

async function summariseCategory(category, articles) {
  const config = CATEGORY_CONFIG[category]

  if (articles.length === 0) {
    return [{
      headline: `No recent ${config.label} news`,
      body: 'No articles were published in this category in the past 24 hours.',
      sources: [],
    }]
  }

  const articleList = articles
    .slice(0, 30)
    .map((a, i) => `[${i + 1}] ${a.title} — ${a.source}${a.lean ? ` (${a.lean})` : ''}\nURL: ${a.url}`)
    .join('\n\n')

  const balanceNote = config.balanced
    ? 'This is political news. Give equal weight to all sides. Do not favour left or right. Where views differ, say so plainly.'
    : ''

  const today = new Date().toLocaleDateString('en-AU', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  })

  const prompt = `Today is ${today}. You are writing a daily news briefing on ${config.prompt}

Articles from the past 24 hours:

${articleList}

${balanceNote}

Group into 2-4 major stories. For each one write:
- A sharp headline (under 12 words)
- A tight summary in 2-3 short paragraphs, roughly 120-150 words total

Writing rules - follow these carefully:
- Write like a sharp journalist, not a press release
- Use plain hyphens (-) instead of em dashes or en dashes. Never use -- or - - either. Just rewrite the sentence if needed.
- Vary sentence length deliberately and often. Short sentences punch. Longer ones build context and carry the detail that makes a story land. Then cut back short. Vary the rhythm across every paragraph - never two sentences of the same length back to back.
- Vary sentence structure: mix simple, compound, and complex. Start some sentences mid-thought. Lead with the news, not the actor. Occasionally flip the structure.
- Cut anything that doesn't add information. No throat-clearing, no "it is worth noting that", no "in a significant development", no "this comes as", no "meanwhile"
- Synthesise across sources. Do not just restate headlines.
- Use active voice. Keep verbs strong.
- Sound like a person wrote this, not a machine. Read it back - if it sounds robotic, rewrite it.
- Paraphrase direct quotes rather than quoting verbatim. Do not use quotation marks around speech.

Return ONLY valid JSON:
{
  "topics": [
    {
      "headline": "...",
      "body": "...",
      "sourceIndices": [1, 3, 5]
    }
  ]
}`

  const result = await callOpenRouter([{ role: 'user', content: prompt }])

  const topics = result.topics ?? []
  return topics.map(topic => ({
    headline: topic.headline ?? '',
    body: topic.body ?? '',
    sources: (topic.sourceIndices ?? [])
      .map(i => articles[i - 1])
      .filter(Boolean)
      .map(a => ({ title: a.title, url: a.url, source: a.source, lean: a.lean })),
  }))
}

async function generateSuggestions() {
  const today = new Date().toLocaleDateString('en-AU', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const prompt = `Today is ${today}. Generate three suggestions for a personal dashboard.

Be specific. Be interesting. Avoid the obvious.

1. FOOD: A dish worth cooking or trying today. Give it a name, one-line description, cuisine type, and one practical tip.

2. EXERCISE: A specific session for today. Name it, give duration, list any equipment needed, and describe it in one sentence.

3. LEARN: One genuinely interesting topic, concept, or rabbit hole. Could be science, history, philosophy, tech, culture - anything. Write 1-2 sentences on what it is and why it's worth an hour of your time today.

Return ONLY valid JSON:
{
  "food": { "name": "...", "cuisine": "...", "description": "...", "tip": "..." },
  "exercise": { "name": "...", "duration": "...", "equipment": "...", "description": "..." },
  "learn": { "topic": "...", "description": "...", "why": "..." }
}`

  return callOpenRouter([{ role: 'user', content: prompt }])
}

async function main() {
  if (!OPENROUTER_API_KEY) {
    console.error('OPENROUTER_API_KEY environment variable is not set')
    process.exit(1)
  }

  // Load feeds.json
  const feedsPath = path.join(__dirname, '..', 'public', 'data', 'feeds.json')
  const feedsRaw = await readFile(feedsPath, 'utf8')
  const feeds = JSON.parse(feedsRaw)
  const allItems = feeds.items ?? []

  console.log(`Summarising ${allItems.length} articles using ${MODEL}...\n`)

  const summaries = {}

  for (const [category, config] of Object.entries(CATEGORY_CONFIG)) {
    const items = allItems.filter(a => a.category === category)
    console.log(`  ${config.label}: ${items.length} articles → summarising...`)
    try {
      summaries[category] = await summariseCategory(category, items)
      console.log(`    ✓ ${summaries[category].length} topics`)
    } catch (err) {
      console.error(`    ✗ Failed: ${err.message}`)
      summaries[category] = [{
        headline: `${config.label} summary unavailable`,
        body: 'Could not generate summary at this time.',
        sources: [],
      }]
    }
  }

  console.log('\n  Generating daily suggestions...')
  let suggestions
  try {
    suggestions = await generateSuggestions()
    console.log('  ✓ Suggestions generated')
  } catch (err) {
    console.error(`  ✗ Suggestions failed: ${err.message}`)
    suggestions = {
      food: { name: 'Shakshuka', cuisine: 'Middle Eastern', description: 'Eggs poached in spiced tomato sauce', tip: 'Add feta on top' },
      exercise: { name: '30-min walk', duration: '30 min', equipment: 'None', description: 'Easy active recovery' },
      learn: { topic: 'The Fermi Paradox', description: 'Why haven\'t we found alien life?', why: 'One of the biggest unanswered questions in science' },
    }
  }

  const output = {
    generatedAt: new Date().toISOString(),
    model: MODEL,
    summaries,
    suggestions,
  }

  const outDir = path.join(__dirname, '..', 'public', 'data')
  await mkdir(outDir, { recursive: true })
  await writeFile(path.join(outDir, 'summaries.json'), JSON.stringify(output, null, 2), 'utf8')

  console.log(`\nWrote summaries.json`)
  console.log(`Generated at: ${output.generatedAt}`)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
