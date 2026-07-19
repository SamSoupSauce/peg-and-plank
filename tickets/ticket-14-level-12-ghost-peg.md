# Ticket 14 — One-Way Gate (Ghost Peg Mechanic)

**Status:** Fixed (v2 reimplementation)  
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

## Redesign: Ghost Peg Mechanic (v2)

The one-way peg is now a **ghost peg** that:

1. Starts as a **sensor** (non-colliding) blue peg at its original slot. The ball passes through it naturally.
2. When the ball touches it, the peg becomes **mostly transparent** (15% opacity).
3. The peg **immediately relocates** to its highlighted destination slot.
4. The ball continues through the cleared path without any bounce.

### Why Sensor-From-Start?

Previous attempts made the peg a solid collider that became a sensor on touch. The problem: Matter.js resolves the collision in the same frame it detects it, so the ball would bounce **before** the `isSensor = true` change took effect. The `afterUpdate` hook ran too late — the bounce already happened.

Making the peg a sensor from the start eliminates the bounce entirely while still triggering the `collisionStart` event. The visual effect is identical: the ball touches the peg, the peg ghosts and relocates.

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

### Physics Engine Changes (v2)

- `makeOneWayPeg()` now creates a **circle sensor body** (`isSensor: true`) from the start.
- `handleBallOneWayPegContact()` detects ball→one-way peg collisions and:
  - Sets `ghosted = true`
  - **Immediately** teleports the body to `destinationSlot` via `Matter.Body.setPosition()`
- No `processGhostedPegs()` or `afterUpdate` hook needed — everything happens in the same frame as the collision.
- `renderOneWayPeg()` draws ghosted pegs at **15% opacity** (down from 30% in v1).
- The arrow still points **from the original slot toward the destination slot**, serving as a visual hint.

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
- [x] One-way pegs are sensors from the start (no ball bounce).
- [x] Ball touches one-way peg → peg becomes transparent and relocates immediately.
- [x] Level 12 ball can reach the plank.
- [x] Level 12 plank angle guides ball toward the cup.
- [x] Level 12 cup catches the ball after the ghost peg clears.
- [x] No physics jitter or unpredictable bounces.

---

## Related

- Entity design doc: `peg-and-plank-entity-design.md`
- Level validation: `src/game/levels.ts`
- Physics engine: `src/game/engine.ts`
- Type definitions: `src/game/types.ts`
- Previous fixed-peg ticket (Level 11): `tickets/ticket-12.md`
