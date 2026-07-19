import { useCallback, useMemo, useState } from 'react'
import { loadLevelsFromURL, type LevelDef } from '@/game/levels'
import {
  addPack,
  deletePack,
  getPackStats,
  loadCurrentPackId,
  loadPacks,
  loadProgress,
  makePackId,
  parsePackJSON,
  recordLoss,
  recordWin,
  saveCurrentPackId,
  type LevelPack,
  type PackProgress,
  type PackStats,
} from '@/game/packs'

export interface UsePacksResult {
  packs: LevelPack[]
  currentPackId: string | null
  currentPack: LevelPack | null
  progress: PackProgress
  stats: PackStats
  getStatsForPack: (pack: LevelPack) => PackStats
  selectPack: (id: string) => void
  addPackFromURL: (url: string, name?: string) => Promise<void>
  addPackFromFile: (file: File, name?: string) => Promise<void>
  addPackFromJSON: (text: string, name?: string) => void
  removePack: (id: string) => boolean
  winLevel: (levelIndex: number, stars?: number) => void
  loseBall: () => void
  loading: boolean
}

function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`))
    reader.readAsText(file)
  })
}

function initPackState() {
  const loadedPacks = loadPacks()
  const id = loadCurrentPackId()
  const pack = loadedPacks.find((p) => p.id === id) ?? loadedPacks[0] ?? null
  return {
    packs: loadedPacks,
    currentPackId: pack?.id ?? null,
    progress: pack ? loadProgress(pack.id, pack.levels.length) : { unlocked: 0, completed: [], stars: [], losses: 0 },
  }
}

export function usePacks(): UsePacksResult {
  const init = initPackState()
  const [packs, setPacks] = useState<LevelPack[]>(init.packs)
  const [currentPackId, setCurrentPackId] = useState<string | null>(init.currentPackId)
  const [progress, setProgress] = useState<PackProgress>(init.progress)
  const [loading, setLoading] = useState(false)

  const currentPack = useMemo(
    () => packs.find((p) => p.id === currentPackId) ?? null,
    [packs, currentPackId],
  )

  const stats = useMemo(() => {
    if (!currentPack) return { completed: 0, total: 0, losses: 0 }
    return getPackStats(currentPack, progress)
  }, [currentPack, progress])

  const getStatsForPack = useCallback(
    (pack: LevelPack) => getPackStats(pack, loadProgress(pack.id, pack.levels.length)),
    [],
  )

  const selectPack = useCallback(
    (id: string) => {
      const pack = packs.find((p) => p.id === id)
      if (!pack) return
      saveCurrentPackId(id)
      setCurrentPackId(id)
      setProgress(loadProgress(id, pack.levels.length))
    },
    [packs],
  )

  const refreshPacks = useCallback(() => {
    const refreshed = loadPacks()
    setPacks(refreshed)
    const stillExists = refreshed.some((p) => p.id === currentPackId)
    if (!stillExists && refreshed.length > 0) {
      const first = refreshed[0]
      saveCurrentPackId(first.id)
      setCurrentPackId(first.id)
      setProgress(loadProgress(first.id, first.levels.length))
    }
  }, [currentPackId])

  const createPack = useCallback(
    (levels: LevelDef[], source: LevelPack['source'], suggestedName?: string): LevelPack => {
      const name = suggestedName?.trim() || levels[0]?.name || 'Imported pack'
      return {
        id: makePackId(),
        name,
        levels,
        source,
        createdAt: Date.now(),
      }
    },
    [],
  )

  const addPackFromURL = useCallback(
    async (url: string, name?: string) => {
      setLoading(true)
      try {
        const levels = await loadLevelsFromURL(url)
        const pack = createPack(levels, 'url', name)
        addPack(pack)
        saveCurrentPackId(pack.id)
        refreshPacks()
        selectPack(pack.id)
      } finally {
        setLoading(false)
      }
    },
    [createPack, refreshPacks, selectPack],
  )

  const addPackFromFile = useCallback(
    async (file: File, name?: string) => {
      setLoading(true)
      try {
        const text = await readFileText(file)
        const { name: parsedName, levels } = parsePackJSON(text)
        const pack = createPack(levels, 'upload', name || parsedName || file.name.replace(/\.json$/i, ''))
        addPack(pack)
        saveCurrentPackId(pack.id)
        refreshPacks()
        selectPack(pack.id)
      } finally {
        setLoading(false)
      }
    },
    [createPack, refreshPacks, selectPack],
  )

  const addPackFromJSON = useCallback(
    (text: string, name?: string) => {
      setLoading(true)
      try {
        const { name: parsedName, levels } = parsePackJSON(text)
        const pack = createPack(levels, 'paste', name || parsedName)
        addPack(pack)
        saveCurrentPackId(pack.id)
        refreshPacks()
        selectPack(pack.id)
      } finally {
        setLoading(false)
      }
    },
    [createPack, refreshPacks, selectPack],
  )

  const removePack = useCallback(
    (id: string) => {
      const ok = deletePack(id)
      if (ok) refreshPacks()
      return ok
    },
    [refreshPacks],
  )

  const winLevel = useCallback(
    (levelIndex: number, stars?: number) => {
      if (!currentPack) return
      const next = recordWin(currentPack.id, levelIndex, currentPack.levels.length, stars)
      setProgress(next)
    },
    [currentPack],
  )

  const loseBall = useCallback(() => {
    if (!currentPack) return
    const next = recordLoss(currentPack.id, currentPack.levels.length)
    setProgress(next)
  }, [currentPack])

  return {
    packs,
    currentPackId,
    currentPack,
    progress,
    stats,
    getStatsForPack,
    selectPack,
    addPackFromURL,
    addPackFromFile,
    addPackFromJSON,
    removePack,
    winLevel,
    loseBall,
    loading,
  }
}
