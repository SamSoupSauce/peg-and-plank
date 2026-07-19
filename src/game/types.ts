export interface Vec {
  x: number
  y: number
}

export interface GridDef {
  cols: number
  rows: number
  x: number // x of first column
  y: number // y of first row
  dx: number // column spacing
  dy: number // row spacing
}

export interface PlankDef {
  x: number // spawn center x
  y: number // spawn center y
  w: number
  h: number
  angle?: number // initial angle in degrees
  breakable?: boolean // shatters after the ball crosses it
}

export interface CupDef {
  x: number // center x of the cup opening
  y: number // y of the cup opening (top)
  w: number // inner width
  h: number // depth
}

export interface OneWayPeg {
  slot: number
  destinationSlot: number
}

export interface TutorialBubble {
  id: string
  message: string
  buttonText: string
  highlight?: {
    type: 'slot'
    target: { slot: number }
    color: { r: number; g: number; b: number }
  }
}

export interface LevelDef {
  name: string
  hint: string
  grid: GridDef
  pegs: number[] // slot indices that start occupied by normal movable pegs
  fixedPegs?: number[] // slot indices for immovable pegs
  oneWayPegs?: OneWayPeg[] // ghost pegs that relocate when touched
  planks: PlankDef[]
  ball: Vec // ball spawn point
  cup: CupDef
  hintSlots?: number[] // slots that pulse as a hint
  par?: number // target moves (peg moves + plank drops) for 3 stars
  maxDrops?: number // max number of plank drops allowed
  tutorials?: TutorialBubble[] // intro bubbles shown once for new mechanics
}

export function slotPos(grid: GridDef, index: number): Vec {
  const c = index % grid.cols
  const r = Math.floor(index / grid.cols)
  return { x: grid.x + c * grid.dx, y: grid.y + r * grid.dy }
}

export function slotIndex(row: number, col: number, cols = 9): number {
  return row * cols + col
}
