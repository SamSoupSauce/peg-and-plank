import type { LevelDef, GridDef } from './types'
import { slotIndex as si } from './types'

// Shared 9x6 slot lattice on the wall.
//   col x: 120 .. 840 (step 90)
//   row y:  90 .. 490 (step 80)
// All layouts verified with a headless Matter.js simulation:
// every "wrong" starting state fails, every intended solution wins.
const G: GridDef = { cols: 9, rows: 6, x: 120, y: 90, dx: 90, dy: 80 }

export const LEVELS: LevelDef[] = [
  {
    name: 'First Steps',
    hint: 'Move the high peg down into the glowing slot, re-drop the plank, then drop the ball.',
    grid: G,
    // solve: move peg si(0,4) -> si(2,4)
    pegs: [si(1, 1), si(0, 4)],
    hintSlots: [si(2, 4)],
    planks: [{ x: 339, y: 104, w: 320, h: 16, angle: -16.5 }],
    ball: { x: 260, y: 20 },
    cup: { x: 700, y: 540, w: 150, h: 60 },
  },
  {
    name: 'Double Decker',
    hint: "The lower plank can't be caught — one peg floats too high. Drop it two rows into the glowing slot.",
    grid: G,
    // solve: move peg si(2,6) -> si(4,6)
    pegs: [si(1, 1), si(2, 3), si(3, 4), si(2, 6)],
    hintSlots: [si(4, 6)],
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
    grid: G,
    // solve: si(1,3) -> si(2,3) and si(5,0) -> si(2,5)
    pegs: [si(0, 0), si(1, 2), si(1, 3), si(5, 0), si(3, 6), si(4, 8)],
    hintSlots: [si(2, 3), si(2, 5)],
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
    grid: G,
    // solve: si(1,3) -> si(2,3) and si(5,0) -> si(2,5)
    pegs: [si(1, 1), si(1, 3), si(1, 7), si(5, 0)],
    hintSlots: [si(2, 3), si(2, 5)],
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
    grid: G,
    // solve: si(5,8) -> si(3,4) and si(5,0) -> si(4,2)
    pegs: [si(1, 0), si(2, 2), si(5, 8), si(5, 0)],
    hintSlots: [si(3, 4), si(4, 2)],
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
    grid: G,
    // solve: si(0,6) -> si(2,6), si(1,8) -> si(3,8), si(5,0) -> si(4,6)
    pegs: [si(0, 1), si(1, 3), si(2, 4), si(0, 6), si(1, 8), si(5, 0)],
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
    grid: G,
    // solve: si(5,0) -> si(4,6)
    pegs: [si(0, 1), si(1, 3), si(3, 4), si(5, 0)],
    hintSlots: [si(4, 6)],
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
    grid: G,
    // solve: si(5,0) -> si(1,2) and si(5,8) -> si(2,5)
    pegs: [si(3, 5), si(4, 7), si(5, 0), si(5, 8)],
    hintSlots: [si(1, 2), si(2, 5)],
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
    grid: G,
    // solve: si(5,0) -> si(2,3) and si(5,8) -> si(2,4)
    pegs: [si(0, 7), si(1, 5), si(5, 0), si(5, 8)],
    hintSlots: [si(2, 3), si(2, 4)],
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
    grid: G,
    // solve: si(1,5) -> si(2,5), si(2,7) -> si(3,7), si(5,0) -> si(4,5)
    pegs: [si(0, 0), si(1, 2), si(2, 3), si(1, 5), si(2, 7), si(5, 0)],
    planks: [
      { x: 210, y: 60, w: 280, h: 16 },
      { x: 480, y: 215, w: 280, h: 16 },
      { x: 660, y: 290, w: 280, h: 16 },
    ],
    ball: { x: 160, y: 15 },
    cup: { x: 420, y: 540, w: 140, h: 60 },
  },
]
