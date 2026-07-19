# Ticket 14 — One-Way Gate (Ghost Peg Mechanic)

**Status:** Fixed  
**Priority:** High  
**Component:** Physics Engine / One-Way Peg Mechanics  
**Level Affected:** 12 — One-Way Gate  

---

## Problem Summary

The original level 12 used a unidirectional collision mechanic for "one-way pegs" — blue arrow pegs that blocked the ball from one direction but allowed it through from the other. This mechanic was:

1. **Frustrating to understand**: Players had to guess which direction the arrow allowed.
2. **Physically fragile**: The rectangular collision wall used for one-way pegs caused jitter and unpredictable bounces.
3. **Broken geometry**: The ball spawned at x=120 (too far left to reach the plank), the plank angle was +22° (causing the ball to roll left, away from the cup), and the cup at x=700 was unreachable.

---

## Redesign: Ghost Peg Mechanic

The one-way peg is now a **ghost peg** that:

1. Starts as a solid blue peg blocking the ball's path.
2. When the ball touches it, the peg becomes **mostly transparent** (30% opacity).
3. The peg **stops colliding entirely** (becomes a sensor).
4. The peg **relocates** to its highlighted destination slot.
5. The ball continues through the cleared path.

### Data Structure Changes

```typescript
// BEFORE: direction-based barrier
interface OneWayPeg {
  slot: number
  direction: 'up' | 'down' | 'left' | 'right'
}

// AFTER: ghost relocation
interface OneWayPeg {
  slot: number
  destinationSlot: number
}
```

### Physics Engine Changes

- `makeOneWayPeg()` now creates a **circle body** (like a regular peg) instead of a rectangular wall.
- `handleBallOneWayPegContact()` detects ball→one-way peg collisions and marks the peg as `ghosted`.
- `processGhostedPegs()` runs in `afterUpdate` to:
  - Teleport the peg body to its `destinationSlot` position.
  - Set `body.isSensor = true` to disable all collisions.
- Rendering: ghosted pegs are drawn at the destination slot with 30% opacity.
- The arrow now points **from the original slot toward the destination slot**, serving as a visual hint.

---

## Level 12 Geometry Fixes

| Property | Before | After | Reason |
|----------|--------|-------|--------|
| Ball x | 120 | 260 | Ball was too far left to land on the plank |
| Plank angle | +22° | **-22°** | Positive angle made ball roll left (away from cup); negative rolls right |
| One-way peg | slot 20 (dir: right) | **slot 11** (dest: slot 20) | Ghost peg now sits on the plank's path |
| Cup | x=700, w=150 | **x=520, w=200** | Widened and moved to catch the ball's trajectory |
| Hint slot | 11 | **20** | Highlights where the ghost peg will relocate |

### Intended Solution

1. Move peg from slot 45 to slot 10 (supports left end of plank).
2. Move peg from slot 30 to slot 21 (supports right end of plank).
3. Drop plank — it rests on the two pegs, slanting down to the right.
4. Drop ball — it lands on the plank and rolls right.
5. Ball hits the blue ghost peg at slot 11 — peg becomes transparent and relocates to slot 20.
6. Ball continues through the cleared path and into the cup.

---

## Acceptance Criteria

- [x] One-way pegs use `destinationSlot` instead of `direction`.
- [x] Ball touches one-way peg → peg becomes transparent and non-colliding.
- [x] Peg relocates to its `destinationSlot` when touched.
- [x] Level 12 ball can reach the plank.
- [x] Level 12 plank angle guides ball toward the cup.
- [x] Level 12 cup catches the ball after the ghost peg clears.
- [x] No physics jitter or unpredictable bounces from rectangular collision walls.

---

## Related

- Entity design doc: `peg-and-plank-entity-design.md`
- Level validation: `src/game/levels.ts`
- Physics engine: `src/game/engine.ts`
- Type definitions: `src/game/types.ts`
- Previous fixed-peg ticket (Level 11): `tickets/ticket-12.md`
