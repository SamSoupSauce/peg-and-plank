import { useEffect, useState } from 'react'
import { LEVELS, loadLevelsFromURL, validateLevels, type LevelDef } from '@/game/levels'

const LEVELS_PARAM = 'levels'

export interface UseLevelsResult {
  levels: LevelDef[]
  loading: boolean
  error: string | null
  source: 'built-in' | 'url'
}

function getLevelsURL(): string | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  const url = params.get(LEVELS_PARAM)
  return url?.trim() || null
}

export function useLevels(): UseLevelsResult {
  const [levels, setLevels] = useState<LevelDef[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<'built-in' | 'url'>('built-in')

  useEffect(() => {
    let cancelled = false

    async function load() {
      const url = getLevelsURL()
      if (url) {
        try {
          const fetched = await loadLevelsFromURL(url)
          if (!cancelled) {
            setLevels(fetched)
            setSource('url')
            setError(null)
          }
        } catch (err) {
          if (!cancelled) {
            const message = err instanceof Error ? err.message : String(err)
            setError(`Failed to load levels from URL: ${message}`)
            setLevels(LEVELS)
            setSource('built-in')
          }
        }
      } else {
        setLevels(LEVELS)
        setSource('built-in')
      }
      if (!cancelled) setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return { levels, loading, error, source }
}

/**
 * Validate an arbitrary JSON value as a level pack. Useful for drag-and-drop
 * or file-input importers without needing to fetch from a URL.
 */
export { validateLevels }
