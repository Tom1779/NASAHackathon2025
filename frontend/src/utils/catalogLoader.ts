import type { Asteroid } from '../types/asteroid'

export interface CatalogEntry {
  id: string
  name: string
}

export interface CatalogSearchResult {
  entries: CatalogEntry[]
  hasMore: boolean
  scanned: number
}

export interface CatalogQueryOptions {
  query?: string
  limit?: number
  cursorId?: string | null
  signal?: AbortSignal
}

const DEFAULT_LIMIT = 100
const CSV_URL = new URL('../data/sbdb_query_results.csv', import.meta.url).href

const memoryCache = new Map<string, CatalogSearchResult>()
const pendingCache = new Map<string, Promise<CatalogSearchResult>>()

const sanitizeValue = (value: string) => value.replace(/"/g, '').trim()

const matchesQuery = (entry: CatalogEntry, query: string) => {
  if (!query) return true
  const q = query.toLowerCase()
  return entry.name.toLowerCase().includes(q) || entry.id.includes(q)
}

const buildCacheKey = (query: string, limit: number, cursorId: string | null) =>
  `${query.toLowerCase()}__${limit}__${cursorId ?? ''}`

const parseLine = (line: string): CatalogEntry | null => {
  if (!line) return null

  const commaIdx = line.indexOf(',')
  if (commaIdx === -1) return null

  const rawId = line.slice(0, commaIdx)
  const rawName = line.slice(commaIdx + 1)

  const id = sanitizeValue(rawId)
  const name = sanitizeValue(rawName)

  if (!id || !name) return null

  return { id, name }
}

const streamSearch = async ({
  query = '',
  limit = DEFAULT_LIMIT,
  cursorId = null,
  signal,
}: CatalogQueryOptions): Promise<CatalogSearchResult> => {
  const response = await fetch(CSV_URL, {
    cache: 'force-cache',
    signal,
  })

  if (!response.ok || !response.body) {
    throw new Error(`Failed to fetch catalog CSV: ${response.status} ${response.statusText}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let scanned = 0
  let hasMore = false
  const entries: CatalogEntry[] = []
  const maxResults = limit + 1 // fetch one extra to determine hasMore
  let isHeader = true
  let collecting = cursorId === null
  let cursorFound = cursorId === null

  const processLine = (line: string): boolean => {
    if (isHeader) {
      isHeader = false
      return false
    }

    const entry = parseLine(line)
    if (!entry) return false
    scanned += 1

    if (!collecting) {
      if (entry.id === cursorId) {
        collecting = true
        cursorFound = true
      }
      return false
    }

    if (!matchesQuery(entry, query)) return false

    entries.push(entry)
    if (entries.length >= maxResults) {
      hasMore = true
      return true
    }
    return false
  }

  try {
    while (true) {
      if (signal?.aborted) {
        await reader.cancel()
        throw new DOMException('Aborted', 'AbortError')
      }

      const { value, done } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split(/\r?\n/)
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (processLine(line)) break
      }

      if (hasMore) break
    }

    if (!hasMore && buffer) {
      const remaining = buffer.split(/\r?\n/)
      for (const line of remaining) {
        if (!line) continue
        if (processLine(line)) break
      }
    }
  } finally {
    try {
      await reader.cancel()
    } catch (e) {
      // Ignore cancellation errors
      void e
    }
  }

  if (!collecting && !cursorFound) {
    return { entries: [], hasMore: false, scanned }
  }

  if (hasMore) {
    entries.pop()
  }

  return { entries, hasMore, scanned }
}

export const fetchCatalogEntries = async (options: CatalogQueryOptions = {}): Promise<CatalogSearchResult> => {
  const { query = '', limit = DEFAULT_LIMIT, cursorId = null } = options
  const key = buildCacheKey(query, limit, cursorId)

  if (memoryCache.has(key)) {
    const cached = memoryCache.get(key)!
    return {
      entries: [...cached.entries],
      hasMore: cached.hasMore,
      scanned: cached.scanned,
    }
  }

  if (pendingCache.has(key)) {
    return pendingCache.get(key)!
  }

  const pending = streamSearch({ query, limit, cursorId, signal: options.signal })
    .then(result => {
      memoryCache.set(key, result)
      pendingCache.delete(key)
      return {
        entries: [...result.entries],
        hasMore: result.hasMore,
        scanned: result.scanned,
      }
    })
    .catch(error => {
      pendingCache.delete(key)
      throw error
    })

  pendingCache.set(key, pending)
  return pending
}

export const preloadCatalog = (limit = DEFAULT_LIMIT) => {
  return fetchCatalogEntries({ limit }).catch(() => undefined)
}

export const catalogEntriesToAsteroids = (entries: CatalogEntry[]): Asteroid[] =>
  entries.map(entry => ({
    links: { self: '' },
    id: entry.id,
    neo_reference_id: entry.id,
    name: entry.name,
    nasa_jpl_url: '',
    absolute_magnitude_h: 0,
    estimated_diameter: {},
    is_potentially_hazardous_asteroid: false,
    close_approach_data: [],
    is_sentry_object: false,
  }))

export const clearCatalogCache = () => {
  memoryCache.clear()
  pendingCache.clear()
}
