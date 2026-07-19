import { GRID } from './levels'
import type { LevelPack } from './packs'

/**
 * A tiny example pack with one deliberately simple level.
 * Useful as a template for players who want to author their own packs.
 */
export const EXAMPLE_PACK: LevelPack = {
  id: 'example',
  name: 'Example Pack',
  source: 'built-in',
  createdAt: 1,
  levels: [
    {
      name: 'Simple Ramp',
      hint: 'Two pegs already form a gentle ramp. Drop the plank, then drop the ball and watch it roll into the cup.',
      grid: GRID,
      // (1,1) and (2,2) hold the ramp
      pegs: [10, 20],
      planks: [{ x: 165, y: 130, w: 122, h: 16, angle: 41.6 }],
      ball: { x: 120, y: 20 },
      cup: { x: 360, y: 540, w: 140, h: 60 },
    },
  ],
}
