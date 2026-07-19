import type { LevelDef, OneWayPeg, TutorialBubble } from './types'

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
  // ---------- entity mechanic showcase levels ----------
  {
    name: 'Fixed Point',
    hint: 'The bronze peg is bolted down. Use it as the anchor and place the spare peg under the glowing far end of the ramp.',
    grid: GRID,
    pegs: [45],
    fixedPegs: [10],
    // 140 px board (per v2.1 design) hinged at the fixed-peg CENTER (slot 10 =
    // 210,170). The hinged end sits exactly on the pivot so the zero-length
    // hinge starts satisfied with no snap, and the far end spans the 120 px to
    // the hint slot (slot 20 = 300,250), settling on top of the support peg.
    // A 96 px board cannot span slot 10 -> slot 20 from a center pivot, which
    // is what forced the old misaligned rim anchor.
    planks: [{ x: 270.6, y: 205, w: 140, h: 16, angle: 30 }],
    ball: { x: 230, y: 20 },
    // cup moved to the ball's verified landing point off the 140 px ramp
    // (headless sim: ball crosses rim height at x ~= 542)
    cup: { x: 545, y: 540, w: 140, h: 60 },
    hintSlots: [20],
    tutorials: [
      {
        id: 'fixed-peg-intro',
        message: 'New mechanic: FIXED PEGS!\n\nSome pegs are bolted down — you CANNOT move them. Look for the lock icon.',
        buttonText: 'Show Me!',
        highlight: { type: 'slot', target: { slot: 10 }, color: { r: 250, g: 204, b: 21 } },
      },
      {
        id: 'fixed-peg-anchor',
        message: 'Fixed pegs are ANCHORS.\n\nPlace the spare peg under the glowing far end of the ramp, then drop the planks.',
        buttonText: 'Got it!',
        highlight: { type: 'slot', target: { slot: 20 }, color: { r: 34, g: 211, b: 238 } },
      },
      {
        id: 'fixed-peg-tip',
        message: 'TIP: A plank needs at least two supports. The fixed peg counts as one — add the spare peg as the second.',
        buttonText: "Let's Play!",
      },
    ],
  },
  {
    name: 'One-Way Gate',
    hint: 'The blue arrow peg only lets the ball pass from left to right. Build a ramp that sends the ball through it.',
    grid: GRID,
    pegs: [45, 30],
    oneWayPegs: [{ slot: 20, direction: 'right' }],
    planks: [{ x: 300, y: 200, w: 220, h: 16, angle: 22 }],
    ball: { x: 120, y: 20 },
    cup: { x: 700, y: 540, w: 150, h: 60 },
    hintSlots: [11],
  },
  {
    name: 'Fragile Bridge',
    hint: 'The cracked plank will shatter after the ball crosses it. Make sure the ramp leads straight to the cup.',
    grid: GRID,
    pegs: [10, 30],
    planks: [{ x: 255, y: 130, w: 290, h: 16, angle: 16.6, breakable: true }],
    ball: { x: 120, y: 20 },
    cup: { x: 560, y: 540, w: 140, h: 60 },
    hintSlots: [20],
  },
  {
    name: 'Par Perfect',
    hint: 'Finish in 3 moves or fewer for a perfect score. Move the high peg into the glowing slot, drop, and roll.',
    grid: GRID,
    // solve: move peg (0,4) -> (2,4)
    pegs: [10, 4],
    hintSlots: [22],
    planks: [{ x: 339, y: 104, w: 320, h: 16, angle: -16.5 }],
    ball: { x: 260, y: 20 },
    cup: { x: 700, y: 540, w: 150, h: 60 },
    par: 3,
  },
  {
    name: 'Drop Budget',
    hint: 'You only get ONE plank drop. Position the spare peg perfectly before you click the button.',
    grid: GRID,
    pegs: [10, 45],
    hintSlots: [21],
    planks: [{ x: 300, y: 130, w: 240, h: 16, angle: -12 }],
    ball: { x: 230, y: 20 },
    cup: { x: 700, y: 540, w: 150, h: 60 },
    maxDrops: 1,
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

function validateOneWayPeg(value: unknown, path: string, index: number): { slot: number; direction: OneWayPeg['direction'] } {
  const obj = assertObject(value, path, index)
  const dir = assertString(obj.direction, `${path}.direction`, index)
  if (!['up', 'down', 'left', 'right'].includes(dir)) {
    throw new LevelValidationError(`${path}.direction must be up/down/left/right`, index)
  }
  return { slot: assertNumber(obj.slot, `${path}.slot`, index), direction: dir as OneWayPeg['direction'] }
}

function validateColor(value: unknown, path: string, index: number): { r: number; g: number; b: number } {
  const obj = assertObject(value, path, index)
  return {
    r: assertNumber(obj.r, `${path}.r`, index),
    g: assertNumber(obj.g, `${path}.g`, index),
    b: assertNumber(obj.b, `${path}.b`, index),
  }
}

function validateHighlight(
  value: unknown,
  path: string,
  index: number,
): NonNullable<TutorialBubble['highlight']> {
  const obj = assertObject(value, path, index)
  const type = assertString(obj.type, `${path}.type`, index)
  if (type !== 'slot') {
    throw new LevelValidationError(`${path}.type must be 'slot'`, index)
  }
  const targetObj = assertObject(obj.target, `${path}.target`, index)
  return {
    type: 'slot',
    target: { slot: assertNumber(targetObj.slot, `${path}.target.slot`, index) },
    color: validateColor(obj.color, `${path}.color`, index),
  }
}

function validateTutorialBubble(value: unknown, path: string, index: number): TutorialBubble {
  const obj = assertObject(value, path, index)
  return {
    id: assertString(obj.id, `${path}.id`, index),
    message: assertString(obj.message, `${path}.message`, index),
    buttonText: assertString(obj.buttonText, `${path}.buttonText`, index),
    highlight: obj.highlight === undefined ? undefined : validateHighlight(obj.highlight, `${path}.highlight`, index),
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
    breakable: obj.breakable === undefined ? undefined : Boolean(obj.breakable),
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
    fixedPegs:
      obj.fixedPegs === undefined
        ? undefined
        : assertArray(obj.fixedPegs, `levels[${index}].fixedPegs`, index, (v, p, i) =>
            assertNumber(v, p, i),
          ),
    oneWayPegs:
      obj.oneWayPegs === undefined
        ? undefined
        : assertArray(obj.oneWayPegs, `levels[${index}].oneWayPegs`, index, validateOneWayPeg),
    planks: assertArray(obj.planks, `levels[${index}].planks`, index, validatePlank),
    ball: validateVec(obj.ball, `levels[${index}].ball`, index),
    cup: validateCup(obj.cup, `levels[${index}].cup`, index),
    hintSlots:
      obj.hintSlots === undefined
        ? undefined
        : assertArray(obj.hintSlots, `levels[${index}].hintSlots`, index, (v, p, i) =>
            assertNumber(v, p, i),
          ),
    par: assertOptionalNumber(obj.par, `levels[${index}].par`, index),
    maxDrops: assertOptionalNumber(obj.maxDrops, `levels[${index}].maxDrops`, index),
    tutorials:
      obj.tutorials === undefined
        ? undefined
        : assertArray(obj.tutorials, `levels[${index}].tutorials`, index, validateTutorialBubble),
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
