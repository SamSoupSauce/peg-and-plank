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
}

export interface CupDef {
  x: number // center x of the cup opening
  y: number // y of the cup opening (top)
  w: number // inner width
  h: number // depth
}

export interface LevelDef {
  name: string
  hint: string
  grid: GridDef
  pegs: number[] // slot indices that start occupied by pegs
  planks: PlankDef[]
  ball: Vec // ball spawn point
  cup: CupDef
  hintSlots?: number[] // slots that pulse as a hint
}

export function slotPos(grid: GridDef, index: number): Vec {
  const c = index % grid.cols
  const r = Math.floor(index / grid.cols)
  return { x: grid.x + c * grid.dx, y: grid.y + r * grid.dy }
}

export function slotIndex(row: number, col: number, cols = 9): number {
  return row * cols + col
}
