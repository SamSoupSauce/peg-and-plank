# Ticket 12 — Collision Friction

**Status:** Open  
**Priority:** High  
**Component:** Physics Engine / Fixed Peg Mechanics  
**Level Affected:** 11 — Fixed Point  
**Reference Image:** `images/77d03ffa67e62f6b4d949ee92f1a5d0995f68c39ff85ca7f0f3eb64b79d59328.png`

---

## Problem Summary

Level 11 introduces the Fixed Peg mechanic. Visually, the bronze fixed peg and the hint text are working correctly. However, the physics behavior is broken in three ways:

1. The plank is not attached to the fixed peg — it slides and spins off.
2. The plank collides with multiple pegs simultaneously, causing jitter and launch behavior.
3. The plank rests beside the movable peg instead of on top of it.

Without these fixes, the level is unplayable — the plank flies off into space or jitters uncontrollably.

---

## Bug 1: No Hinge Joint Between Fixed Peg and Plank

**Observed:** The plank rests against the fixed peg via collision only. It can slide, rotate freely, and fall off.

**Expected:** The fixed peg acts as an immovable anchor. The plank should pivot around it as if bolted in place.

**Fix:** Add a rigid constraint (hinge joint) between the fixed peg body and the plank body using `Matter.Constraint.create()`.

```js
const hinge = Matter.Constraint.create({
  bodyA: fixedPegBody,
  bodyB: plankBody,
  pointA: { x: 0, y: -10 },          // top of peg where plank rests
  pointB: { x: -plankWidth / 2 + 10, y: 0 }, // near left end of plank
  stiffness: 1,                       // rigid, no spring
  length: 0                           // touching, no gap
});
Matter.Composite.add(world, hinge);
```

**Note:** Without a constraint, the plank is only *colliding* with the peg. Collision alone cannot create a pivot.

---

## Bug 2: Plank Collides with Too Many Pegs

**Observed:** The plank is wide enough to touch both the fixed peg and one or more movable pegs at the same time. The physics engine resolves these conflicting contacts by launching the plank.

**Expected:** The plank should only contact the fixed peg (at the hinge) and the target movable peg at the far end. No intermediate pegs should interfere.

**Fix Options (pick one or combine):**

1. **Level Geometry:** Ensure the fixed peg and target movable peg are spaced so the plank spans exactly between them with no overlap on other pegs.

2. **Collision Filtering:** Disable collisions between the plank and non-supporting pegs:
   ```js
   plankBody.collisionFilter = {
     category: 0x0002,
     mask: 0x0001 // only collide with designated support pegs
   };
   ```

3. **Plank Sizing:** Calculate plank width dynamically as `distance(fixedPeg, targetPeg) + small_overlap`.

---

## Bug 3: Plank Rests Beside the Movable Peg, Not On Top

**Observed:** The plank's end appears at the same Y-level as the movable peg, or slightly below/inside it. The collision normal is horizontal, so the peg pushes the plank sideways instead of holding it up.

**Expected:** The plank end should land **on top of** the movable peg, with gravity pulling it down onto the peg.

**Fix:**
- Spawn the plank at a Y position **above** the movable peg (screen coords: higher up / smaller Y).
- Let gravity settle the plank onto the peg naturally.
- The movable peg should act as a support point at `peg.y - peg.radius`.

---

## Acceptance Criteria

- [ ] Plank is rigidly attached to the fixed peg via a hinge constraint.
- [ ] Plank does not collide with intermediate pegs (only fixed + target movable).
- [ ] Plank rests on top of the movable peg, supported from below by gravity.
- [ ] Ball rolls down the plank smoothly after drop.
- [ ] Level 11 is solvable without physics explosions or jitter.

---

## Related

- Level 11 design spec: `level-11-fixed-point-analysis.md`
- Entity design doc: `peg-and-plank-entity-design.md`
