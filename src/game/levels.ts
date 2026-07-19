import type { LevelDef } from './types'

export type { LevelDef }

/**
 * Shared 9x6 slot lattice on the wall.
 *   col x: 120 .. 840 (step 90)
 *   row y:  90 .. 490 (step 80)
 * All layouts verified with a headless Matter.js simulation:
 * every "wrong" starting state fails, every intended solution wins.
 */
export const GRID: LevelDef['grid'] = {
  cols: 9,
  rows: 6,
  x: 120,
  y: 90,
  dx: 90,
  dy: 80,
}

/**
 * Built-in level data. This array is intentionally plain JSON-serializable:
 * it can be `JSON.stringify`-ed, saved to disk, or served from any URL and
 * loaded back with `loadLevelsFromURL`. Slot indices are written as literal
 * numbers so the data does not depend on runtime helpers.
 */
export const LEVELS: LevelDef[] = [
  {
    name: 'First Steps',
    hint: 'Move the high peg down into the glowing slot, re-drop the plank, then drop the ball.',
    grid: GRID,
    // solve: move peg (0,4) -> (2,4)
    pegs: [10, 4],
    hintSlots: [22],
    planks: [{ x: 339, y: 104, w: 320, h: 16, angle: -16.5 }],
    ball: { x: 260, y: 20 },
    cup: { x: 700, y: 540, w: 150, h: 60 },
  },
  {
    name: 'Double Decker',
    hint: "The lower plank can't be caught — one peg floats too high. Drop it two rows into the glowing slot.",
    grid: GRID,
    // solve: move peg (2,6) -> (4,6)
    pegs: [10, 21, 31, 24],
    hintSlots: [42],
    planks: [
      { x: 300, y: 140, w: 300, h: 16 },
      { x: 570, y: 300, w: 300, h: 16 },
    ],
    ball: { x: 230, y: 20 },
    cup: { x: 830, y: 480, w: 140, h: 60 },
  },
  {
    name: 'Mind the Gap',
    hint: 'The bridge has nothing to rest on — one peg sits a row too high, and a spare is parked in the corner.',
    grid: GRID,
    // solve: (1,3) -> (2,3) and (5,0) -> (2,5)
    pegs: [0, 11, 12, 45, 33, 44],
    hintSlots: [21, 23],
    planks: [
      { x: 210, y: 60, w: 280, h: 16 },
      { x: 480, y: 215, w: 320, h: 16 },
      { x: 750, y: 300, w: 280, h: 16 },
    ],
    ball: { x: 130, y: 15 },
    cup: { x: 860, y: 540, w: 140, h: 60 },
  },
  {
    name: 'The Funnel',
    hint: 'Build a V above the cup: one arm peg is a row too high, the other is parked in the corner.',
    grid: GRID,
    // solve: (1,3) -> (2,3) and (5,0) -> (2,5)
    pegs: [10, 12, 16, 45],
    hintSlots: [21, 23],
    planks: [
      { x: 300, y: 120, w: 240, h: 16 },
      { x: 660, y: 120, w: 240, h: 16 },
    ],
    ball: { x: 350, y: 15 },
    cup: { x: 560, y: 470, w: 140, h: 60 },
  },
  {
    name: 'Spare Parts',
    hint: 'Both pegs of the lower ramp are parked in the bottom corners. Put them to work.',
    grid: GRID,
    // solve: (5,8) -> (3,4) and (5,0) -> (4,2)
    pegs: [9, 20, 53, 45],
    hintSlots: [31, 38],
    planks: [
      { x: 210, y: 140, w: 280, h: 16 },
      { x: 390, y: 300, w: 280, h: 16 },
    ],
    ball: { x: 170, y: 20 },
    cup: { x: 150, y: 540, w: 120, h: 60 },
  },
  {
    name: 'Grand Contraption',
    hint: 'Three planks, three wrong pegs. Rebuild the ramp, the bridge and the slide — no glowing help this time.',
    grid: GRID,
    // solve: (0,6) -> (2,6), (1,8) -> (3,8), (5,0) -> (4,6)
    pegs: [1, 12, 22, 6, 17, 45],
    planks: [
      { x: 300, y: 60, w: 280, h: 16 },
      { x: 570, y: 215, w: 320, h: 16 },
      { x: 742, y: 300, w: 280, h: 16 },
    ],
    ball: { x: 250, y: 10 },
    cup: { x: 480, y: 540, w: 140, h: 60 },
  },
  {
    name: 'Thread the Needle',
    hint: 'A spare peg is parked in the corner. The second ramp has a gap to jump — and it needs that peg.',
    grid: GRID,
    // solve: (5,0) -> (4,6)
    pegs: [1, 12, 31, 45],
    hintSlots: [42],
    planks: [
      { x: 300, y: 60, w: 280, h: 16 },
      { x: 570, y: 300, w: 280, h: 16 },
    ],
    ball: { x: 230, y: 15 },
    cup: { x: 840, y: 540, w: 140, h: 60 },
  },
  {
    name: 'The Drop',
    hint: 'Both bridge pegs are parked in the corners. Build the shallow bridge first, then let gravity do the rest.',
    grid: GRID,
    // solve: (5,0) -> (1,2) and (5,8) -> (2,5)
    pegs: [32, 43, 45, 53],
    hintSlots: [11, 23],
    planks: [
      { x: 441, y: 183, w: 320, h: 16, angle: 16.5 },
      { x: 668, y: 344, w: 280, h: 16, angle: 24.1 },
    ],
    ball: { x: 350, y: 15 },
    cup: { x: 860, y: 540, w: 170, h: 60 },
  },
  {
    name: 'High Dive',
    hint: 'Everything flows right-to-left here. Both bridge pegs are parked — set them under the ghost plank.',
    grid: GRID,
    // solve: (5,0) -> (2,3) and (5,8) -> (2,4)
    pegs: [7, 14, 45, 53],
    hintSlots: [21, 22],
    planks: [
      { x: 660, y: 60, w: 280, h: 16 },
      { x: 390, y: 215, w: 280, h: 16 },
    ],
    ball: { x: 740, y: 15 },
    cup: { x: 200, y: 540, w: 140, h: 60 },
  },
  {
    name: 'Grand Finale',
    hint: 'A ramp, a bridge and a switchback slide. Three pegs are out of place — no glowing help this time.',
    grid: GRID,
    // solve: (1,5) -> (2,5), (2,7) -> (3,7), (5,0) -> (4,5)
    pegs: [0, 11, 21, 14, 25, 45],
    planks: [
      { x: 210, y: 60, w: 280, h: 16 },
      { x: 480, y: 215, w: 280, h: 16 },
      { x: 660, y: 290, w: 280, h: 16 },
    ],
    ball: { x: 160, y: 15 },
    cup: { x: 420, y: 540, w: 140, h: 60 },
  },
]

// ---------------------------------------------------------------------------
// JSON loading / validation
// ---------------------------------------------------------------------------

export class LevelValidationError extends Error {
  readonly index: number

  constructor(message: string, index: number) {
    super(message)
    this.name = 'LevelValidationError'
    this.index = index
  }
}

function assertNumber(value: unknown, path: string, index: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new LevelValidationError(`${path} must be a finite number`, index)
  }
  return value
}

function assertOptionalNumber(value: unknown, path: string, index: number): number | undefined {
  if (value === undefined) return undefined
  return assertNumber(value, path, index)
}

function assertString(value: unknown, path: string, index: number): string {
  if (typeof value !== 'string') {
    throw new LevelValidationError(`${path} must be a string`, index)
  }
  return value
}

function assertObject(value: unknown, path: string, index: number): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new LevelValidationError(`${path} must be an object`, index)
  }
  return value as Record<string, unknown>
}

function assertArray<T>(
  value: unknown,
  path: string,
  index: number,
  itemGuard: (v: unknown, p: string, i: number) => T,
): T[] {
  if (!Array.isArray(value)) {
    throw new LevelValidationError(`${path} must be an array`, index)
  }
  return value.map((v, i) => itemGuard(v, `${path}[${i}]`, index))
}

function validateVec(value: unknown, path: string, index: number): { x: number; y: number } {
  const obj = assertObject(value, path, index)
  return {
    x: assertNumber(obj.x, `${path}.x`, index),
    y: assertNumber(obj.y, `${path}.y`, index),
  }
}

function validateGrid(value: unknown, path: string, index: number): LevelDef['grid'] {
  const obj = assertObject(value, path, index)
  return {
    cols: assertNumber(obj.cols, `${path}.cols`, index),
    rows: assertNumber(obj.rows, `${path}.rows`, index),
    x: assertNumber(obj.x, `${path}.x`, index),
    y: assertNumber(obj.y, `${path}.y`, index),
    dx: assertNumber(obj.dx, `${path}.dx`, index),
    dy: assertNumber(obj.dy, `${path}.dy`, index),
  }
}

function validatePlank(value: unknown, path: string, index: number): LevelDef['planks'][number] {
  const obj = assertObject(value, path, index)
  return {
    x: assertNumber(obj.x, `${path}.x`, index),
    y: assertNumber(obj.y, `${path}.y`, index),
    w: assertNumber(obj.w, `${path}.w`, index),
    h: assertNumber(obj.h, `${path}.h`, index),
    angle: assertOptionalNumber(obj.angle, `${path}.angle`, index),
  }
}

function validateCup(value: unknown, path: string, index: number): LevelDef['cup'] {
  const obj = assertObject(value, path, index)
  return {
    x: assertNumber(obj.x, `${path}.x`, index),
    y: assertNumber(obj.y, `${path}.y`, index),
    w: assertNumber(obj.w, `${path}.w`, index),
    h: assertNumber(obj.h, `${path}.h`, index),
  }
}

export function validateLevel(value: unknown, index: number): LevelDef {
  const obj = assertObject(value, `levels[${index}]`, index)
  return {
    name: assertString(obj.name, `levels[${index}].name`, index),
    hint: assertString(obj.hint, `levels[${index}].hint`, index),
    grid: validateGrid(obj.grid, `levels[${index}].grid`, index),
    pegs: assertArray(obj.pegs, `levels[${index}].pegs`, index, (v, p, i) =>
      assertNumber(v, p, i),
    ),
    planks: assertArray(obj.planks, `levels[${index}].planks`, index, validatePlank),
    ball: validateVec(obj.ball, `levels[${index}].ball`, index),
    cup: validateCup(obj.cup, `levels[${index}].cup`, index),
    hintSlots:
      obj.hintSlots === undefined
        ? undefined
        : assertArray(obj.hintSlots, `levels[${index}].hintSlots`, index, (v, p, i) =>
            assertNumber(v, p, i),
          ),
  }
}

export function validateLevels(value: unknown): LevelDef[] {
  if (!Array.isArray(value)) {
    throw new LevelValidationError('Levels must be an array', -1)
  }
  return value.map((level, i) => validateLevel(level, i))
}

/**
 * Fetch a level pack from a URL and validate it.
 * The endpoint must return a JSON array of LevelDef-shaped objects.
 */
export async function loadLevelsFromURL(url: string): Promise<LevelDef[]> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to load levels from ${url}: ${res.status} ${res.statusText}`)
  }
  const data = await res.json()
  return validateLevels(data)
}
