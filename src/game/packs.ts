import { EXAMPLE_PACK } from './examplePack'
import type { LevelDef } from './levels'
import { LEVELS, validateLevels } from './levels'

export type PackSource = 'built-in' | 'url' | 'upload' | 'paste'

export interface LevelPack {
  id: string
  name: string
  levels: LevelDef[]
  source: PackSource
  createdAt: number
}

export interface PackProgress {
  unlocked: number
  completed: boolean[]
  stars: number[] // 0-3 per level
  losses: number
}

const PACKS_KEY = 'pegplank_packs'
const CURRENT_PACK_KEY = 'pegplank_current_pack_id'
const PROGRESS_PREFIX = 'pegplank_progress_'
const BUILT_IN_ID = 'built-in'
const EXAMPLE_ID = 'example'

export const BUILT_IN_PACK: LevelPack = {
  id: BUILT_IN_ID,
  name: 'Peg & Plank',
  levels: LEVELS,
  source: 'built-in',
  createdAt: 0,
}

const SEED_IDS = new Set([BUILT_IN_ID, EXAMPLE_ID])

export function isSeedPack(pack: LevelPack): boolean {
  return SEED_IDS.has(pack.id)
}

export function isBuiltIn(pack: LevelPack): boolean {
  return pack.id === BUILT_IN_ID
}

function progressKey(packId: string): string {
  return `${PROGRESS_PREFIX}${packId}`
}

export function loadPacks(): LevelPack[] {
  if (typeof window === 'undefined') return [BUILT_IN_PACK, EXAMPLE_PACK]
  try {
    const raw = localStorage.getItem(PACKS_KEY)
    if (!raw) return [BUILT_IN_PACK, EXAMPLE_PACK]
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return [BUILT_IN_PACK, EXAMPLE_PACK]
    // Seed packs are always present and kept up to date from code.
    const userPacks = parsed.filter((p) => !isSeedPack(p as LevelPack))
    return [BUILT_IN_PACK, EXAMPLE_PACK, ...userPacks]
  } catch {
    return [BUILT_IN_PACK, EXAMPLE_PACK]
  }
}

export function savePacks(packs: LevelPack[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(PACKS_KEY, JSON.stringify(packs))
}

export function loadCurrentPackId(): string {
  if (typeof window === 'undefined') return BUILT_IN_ID
  const id = localStorage.getItem(CURRENT_PACK_KEY)
  return id && id.trim() ? id.trim() : BUILT_IN_ID
}

export function saveCurrentPackId(id: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CURRENT_PACK_KEY, id)
}

function emptyProgress(levelCount: number): PackProgress {
  return {
    unlocked: 0,
    completed: Array.from({ length: levelCount }, () => false),
    stars: Array.from({ length: levelCount }, () => 0),
    losses: 0,
  }
}

export function loadProgress(packId: string, levelCount: number): PackProgress {
  if (typeof window === 'undefined') return emptyProgress(levelCount)
  try {
    const raw = localStorage.getItem(progressKey(packId))
    if (!raw) return emptyProgress(levelCount)
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return emptyProgress(levelCount)
    }
    const p = parsed as Record<string, unknown>
    const unlocked =
      typeof p.unlocked === 'number' && Number.isFinite(p.unlocked)
        ? Math.max(0, Math.floor(p.unlocked))
        : 0
    const losses =
      typeof p.losses === 'number' && Number.isFinite(p.losses)
        ? Math.max(0, Math.floor(p.losses))
        : 0
    const completed = Array.isArray(p.completed)
      ? p.completed.map((v) => v === true)
      : []
    while (completed.length < levelCount) completed.push(false)
    if (completed.length > levelCount) completed.length = levelCount

    const stars = Array.isArray(p.stars)
      ? p.stars.map((v) => (typeof v === 'number' && v >= 0 && v <= 3 ? v : 0))
      : []
    while (stars.length < levelCount) stars.push(0)
    if (stars.length > levelCount) stars.length = levelCount

    return { unlocked: Math.min(unlocked, levelCount - 1), completed, stars, losses }
  } catch {
    return emptyProgress(levelCount)
  }
}

export function saveProgress(packId: string, progress: PackProgress): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(progressKey(packId), JSON.stringify(progress))
}

export function recordWin(
  packId: string,
  levelIndex: number,
  levelCount: number,
  stars?: number,
): PackProgress {
  const progress = loadProgress(packId, levelCount)
  if (levelIndex >= 0 && levelIndex < levelCount) {
    progress.completed[levelIndex] = true
    if (stars !== undefined) {
      progress.stars[levelIndex] = Math.max(progress.stars[levelIndex] ?? 0, stars)
    }
  }
  progress.unlocked = Math.max(progress.unlocked, Math.min(levelIndex + 1, levelCount - 1))
  saveProgress(packId, progress)
  return progress
}

export function recordLoss(packId: string, levelCount: number): PackProgress {
  const progress = loadProgress(packId, levelCount)
  progress.losses++
  saveProgress(packId, progress)
  return progress
}

export interface PackStats {
  completed: number
  total: number
  losses: number
}

export function getPackStats(pack: LevelPack, progress: PackProgress): PackStats {
  return {
    completed: progress.completed.filter(Boolean).length,
    total: pack.levels.length,
    losses: progress.losses,
  }
}

export function addPack(pack: LevelPack): void {
  const packs = loadPacks().filter((p) => p.id !== pack.id)
  packs.push(pack)
  savePacks(packs)
}

export function deletePack(id: string): boolean {
  if (SEED_IDS.has(id)) return false
  const packs = loadPacks().filter((p) => p.id !== id)
  savePacks(packs)
  if (typeof window !== 'undefined') {
    localStorage.removeItem(progressKey(id))
  }
  return true
}

export interface PackImportResult {
  name?: string
  levels: LevelDef[]
}

export function parsePackJSON(text: string): PackImportResult {
  const data = JSON.parse(text) as unknown
  if (Array.isArray(data)) {
    return { levels: validateLevels(data) }
  }
  const obj = data as Record<string, unknown>
  if (obj && typeof obj === 'object') {
    const levels = Array.isArray(obj.levels) ? validateLevels(obj.levels) : validateLevels(data)
    const name = typeof obj.name === 'string' ? obj.name : undefined
    return { name, levels }
  }
  throw new Error('JSON must be an array of levels or an object with a "levels" array')
}

export function makePackId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function formatValidationError(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = String((err as { message: unknown }).message)
    if (err instanceof Error && err.name === 'LevelValidationError' && 'index' in err) {
      return msg
    }
    return msg
  }
  return String(err)
}

export function downloadPack(pack: LevelPack): void {
  if (typeof window === 'undefined') return
  const payload = { name: pack.name, levels: pack.levels }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const safeName = pack.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'pack'
  a.download = `${safeName}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

