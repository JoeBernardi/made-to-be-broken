const SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search'
const FETCH_TIMEOUT_MS = 5000
const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const CACHE_MAX_ENTRIES = 500

// Each search costs 100 of the 10,000 daily quota units, so repeat searches are served from here.
const cache = new Map()

const isGoodCover = (title) =>
  /cover/i.test(title) &&
  /acoustic/i.test(title) &&
  !/live/i.test(title) &&
  !/lyrics/i.test(title)

const cacheKey = (term) => term.trim().toLowerCase().replace(/\s+/g, ' ')

const readCache = (key) => {
  const entry = cache.get(key)
  if (!entry) return null
  if (entry.expires <= Date.now()) {
    cache.delete(key)
    return null
  }
  return entry
}

const writeCache = (key, value) => {
  cache.delete(key)
  if (cache.size >= CACHE_MAX_ENTRIES) cache.delete(cache.keys().next().value)
  cache.set(key, { ...value, expires: Date.now() + CACHE_TTL_MS })
}

const noJamsError = () => {
  const err = new Error('noJams')
  err.code = 'noJams'
  return err
}

export async function searchCovers (term) {
  const key = cacheKey(term)
  const cached = readCache(key)
  if (cached?.noJams) throw noJamsError()
  if (cached) return cached.videoIds

  const url = new URL(SEARCH_URL)
  url.search = new URLSearchParams({
    part: 'snippet',
    q: `${term} acoustic cover`,
    maxResults: '50',
    type: 'video',
    videoEmbeddable: 'true',
    key: process.env.YOUTUBE_API_KEY
  })

  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
  if (!res.ok) {
    throw new Error(`YouTube search failed: ${res.status}`)
  }

  const { items = [] } = await res.json()
  const goodCovers = items
    .map((item) => ({ id: item.id?.videoId, title: item.snippet?.title ?? '' }))
    .filter((video) => video.id && isGoodCover(video.title))

  if (goodCovers.length < 2) {
    writeCache(key, { noJams: true })
    throw noJamsError()
  }

  const videoIds = goodCovers.slice(0, 5).map((video) => video.id)
  writeCache(key, { videoIds })
  return videoIds
}
