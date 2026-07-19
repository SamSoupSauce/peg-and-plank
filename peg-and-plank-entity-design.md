# Peg & Plank — Entity Design Document
## Custom Mechanics, Obstacles & Entities

**Author:** Lobbyist (design), Sam (implementation)  
**Date:** 2026-07-19  
**Status:** Speculative — unimplemented mechanics for future expansion

This document catalogs entity types and mechanics that *cannot* exist in the current engine but *could* with targeted extensions. Each entry includes: **What it is**, **How it works mechanically**, **Why it matters for puzzle design**, and **Implementation notes**.

---

## Table of Contents
1. [Peg Variants](#peg-variants)
2. [Plank Variants](#plank-variants)
3. [Ball Variants](#ball-variants)
4. [Environmental Obstacles](#environmental-obstacles)
5. [Interactive Zones](#interactive-zones)
6. [Meta-Mechanics](#meta-mechanics)

---

## 1. Peg Variants

### 1.1 Fixed Peg (Immovable)
**What:** A peg that cannot be dragged or removed by the player. It is permanently fixed in its slot.

**How:** The slot renders with a different visual (rusty metal, riveted, glowing red). When the player attempts to drag it, it shakes or wobbles but stays. It acts as a guaranteed anchor point for planks.

**Why:** Currently every peg is a resource. Fixed pegs remove that assumption — they become *constraints*. This opens puzzles where the player must route around unavoidable obstacles. It also allows "tutorial scaffolding" that doesn't disappear.

**Implementation:** Add `fixed: boolean` to the PegDef. The drag handler checks this flag before allowing the move. Render uses a distinct sprite/color.

---

### 1.2 Angled Peg (Asymmetric Head)
**What:** A peg with a head that is longer on one side than the other. When a plank rests on it, the plank tilts in the direction of the longer side.

**How:** The peg body is a vertical cylinder, but the head is an asymmetric wedge. When the plank's center of mass is to the left of the peg's center, but the peg's head extends farther left, the plank tilts left. This is a *micro-angle* mechanic — subtle but exploitable.

**Why:** Currently all pegs are symmetric. Angled pegs allow *directional* control without requiring the player to place the plank at an angle. The peg IS the angle. This creates "single-peg ramps" — a key design space for tighter puzzles.

**Implementation:** PegDef gains `headAngle: number` and `headAsymmetry: number`. The physics engine computes the contact normal based on the head geometry rather than the peg center.

---

### 1.3 Spring-Loaded Peg (Compressible)
**What:** A peg that can be pushed down into its slot by a falling plank, then spring back up when the plank is removed.

**How:** When a plank falls onto this peg, the peg retracts into its slot until the plank's weight settles. The peg exerts an upward force proportional to its compression. This means planks don't sit *on top* — they sit *into* the peg, creating a slightly lower resting point. When the peg is at full compression, the plank might be low enough to let the ball roll *over* it.

**Why:** Vertical compression adds a third dimension of play. Players must think about *how much weight* a peg can hold, not just *where* it is. It also allows "bounce" puzzles: drop a plank, it compresses the spring peg, then the spring releases and launches the plank (or the ball).

**Implementation:** PegDef gains `spring: { k: number, maxCompression: number }`. The physics engine treats the peg as a prismatic joint with a spring constraint. The visual shows the peg compressing (sprite slides down into the slot).

---

### 1.4 Telescoping Peg (Adjustable Height)
**What:** A peg that can be clicked to extend or retract, changing its height in discrete steps (e.g., short, medium, tall).

**How:** Clicking the peg cycles through its height states. The peg's collision body changes height accordingly. A short peg might not hold a plank at all (the plank falls past it). A tall peg catches the plank higher, creating a steeper or shallower angle.

**Why:** Height is a *variable* the player controls, not just position. One peg in the right place but the wrong height ruins the puzzle. One peg adjusted correctly saves it. This is the "screw" mechanic (from the original inspiration) but implemented as a peg.

**Implementation:** PegDef gains `heightStates: number[]` (e.g., `[0.3, 0.6, 1.0]` as multipliers of full height). Click handler cycles the state. Physics body updates dynamically. Visual uses a telescoping shaft (multiple segments).

---

### 1.5 Magnetic Peg (Attracts Planks)
**What:** A peg that exerts a magnetic force on ferrous planks, pulling them toward itself even before contact.

**How:** When a plank is dropped within a certain radius of a magnetic peg, it experiences a horizontal force toward the peg. The plank "snaps" to the peg's horizontal position as it falls. This means you don't need to place the peg *exactly* under the plank — the plank self-aligns.

**Why:** This is a *forgiveness* mechanic that also enables *precision* puzzles. Forgiving: a near-miss still works. Precision: you can place the peg slightly off-center, and the plank will align to the wrong spot, ruining the angle. Players must understand the magnetic field to exploit it or avoid it.

**Implementation:** PegDef gains `magnetic: { strength: number, radius: number }`. During the plank's fall, if it's within `radius` and the peg is `magnetic`, apply a horizontal force proportional to `strength` and inverse distance. Only affects ferrous planks (see Plank Variants).

---

### 1.6 Bouncy Peg (Elastic Collision)
**What:** A peg with a rubberized surface. When the ball hits it, the ball bounces off with high restitution (energy conservation), rather than rolling around it.

**How:** The peg's collision material has a restitution coefficient > 0.8. The ball bounces off it like a pinball bumper. The player can use bouncy pegs to redirect the ball at sharp angles or launch it over gaps.

**Why:** Currently the ball rolls passively. Bouncy pegs introduce *active redirection* — the player can make the ball go UP against gravity momentarily, or shoot sideways across the board. This opens "pinball" level design.

**Implementation:** PegDef gains `material: 'rubber' | 'metal'`. Physics engine sets `restitution` and `friction` based on material. Visual: peg has a rubber ring or bright color.

---

### 1.7 One-Way Peg (Directional Barrier)
**What:** A peg that acts as a barrier from one side but not the other. The ball can pass through it in the allowed direction but is blocked from the forbidden direction.

**How:** The peg is rendered with an arrow or slope indicator. Its collision body is asymmetric — a half-circle or wedge. If the ball approaches from the "open" side, the peg doesn't collide. From the "closed" side, it collides like a wall.

**Why:** This is the most powerful single-peg addition. It turns a peg from a point obstacle into a *directional gate*. It allows one-way paths, forcing the ball to take a specific route and preventing backtracking. It also prevents "solutions" where the ball accidentally rolls back into a dead end.

**Implementation:** PegDef gains `oneWay: { direction: 'up' | 'down' | 'left' | 'right' }`. The collision body is a sensor or half-polygon based on direction. The ball's velocity vector is checked against the allowed direction before collision response is applied.

---

### 1.8 Balloon Peg (Buoyant / Anti-Gravity)
**What:** A peg that exerts an upward force on anything resting on it. Instead of gravity pulling down, this peg pushes UP.

**How:** The peg applies a constant upward force to any plank resting on it. If the force exceeds the plank's weight, the plank floats upward until it hits something else. If the ball rolls onto this plank, it might be launched upward or slide off the rising surface.

**Why:** Inverts gravity locally. Allows "floating bridges" that don't need support from below. Creates puzzles where the ball must ride an *ascending* plank rather than a descending one. Also enables "air" gaps that would be impossible to cross otherwise.

**Implementation:** PegDef gains `buoyancy: number` (force in Newtons). During the physics step, any body in contact with a buoyant peg receives an upward force. Visual: peg has a balloon-like top, possibly tethered.

---

## 2. Plank Variants

### 2.1 Ferrous Plank (Magnetic)
**What:** A plank that is attracted to magnetic pegs. Non-ferrous planks are unaffected by magnetic fields.

**How:** When falling near a magnetic peg, the plank experiences a horizontal force toward the peg. When resting on magnetic pegs, the plank is "locked" — harder to dislodge by the ball's weight or a second plank hitting it.

**Why:** Pairs with Magnetic Peg. Creates a "tool selection" layer: you have magnetic planks and normal planks, and you must choose which goes where. The magnetic plank snaps to the magnetic peg but might be in the wrong position; the normal plank falls straight but requires precise placement.

**Implementation:** PlankDef gains `material: 'wood' | 'metal' | 'rubber' | 'ice'`. Magnetic pegs only attract `metal` planks. Render: metal planks look like steel or aluminum.

---

### 2.2 Rubber Plank (Bouncy Surface)
**What:** A plank with a rubberized top surface. When the ball rolls onto it, the ball bounces rather than rolling smoothly.

**How:** The plank's top surface has a high restitution coefficient. If the ball hits it with any downward velocity, it bounces. The plank itself is stable (doesn't bounce), but the ball does. This allows "launch ramp" designs where the ball gains height by bouncing off a rubber plank.

**Why:** Currently all planks are passive ramps. A rubber plank is an *active* surface. It transforms the ball's trajectory in a way the player must anticipate. This enables "stunt" puzzles where the ball must clear a gap by bouncing, not just rolling.

**Implementation:** PlankDef uses `material: 'rubber'`. The top edge collision has `restitution: 0.9`. Visual: rubber planks are a different color (red/dark) with a textured surface.

---

### 2.3 Ice Plank (Frictionless)
**What:** A plank with a frictionless top surface. The ball rolls on it without slowing down. It also cannot "stick" to the plank — it will slide off any edge unless a wall or peg blocks it.

**How:** The plank's top surface has `friction: 0`. The ball's angular velocity and linear velocity don't decay while on the plank. It cannot rest on an ice plank unless it's perfectly flat and trapped.

**Why:** Speed control puzzles. The player must use other pegs or planks to *slow* the ball or *catch* it at the end of an ice plank. Ice planks are excellent for long-distance traversal but terrible for precision landing. Creates a risk/reward dynamic.

**Implementation:** PlankDef uses `material: 'ice'`. Top surface `friction: 0`. Visual: ice planks are blue/cyan with a glossy finish.

---

### 2.4 Breakable Plank (Single-Use)
**What:** A plank that shatters or disappears after the ball passes over it once. It can support the ball's weight before the ball arrives, but after the ball rolls off, it breaks.

**How:** The plank tracks whether the ball has been in contact with it. After the ball leaves contact, the plank plays a break animation and its collision body is removed. It cannot support a second ball or a second plank.

**Why:** One-way traversal. The player must build a path that works *exactly once* because the components self-destruct. This forces "all-or-nothing" solutions where every plank matters. Also enables sequential puzzles: the ball's path destroys the infrastructure behind it, so a second ball would need a different route.

**Implementation:** PlankDef gains `breakable: boolean`. The plank tracks a `hasBeenCrossed` flag. When the ball exits collision, trigger break animation and remove body. Visual: wood grain with visible cracks that spread on contact.

---

### 2.5 Teeter Plank (Pivot / Seesaw)
**What:** A plank that is not fixed at its endpoints but rests on a single central pivot peg. When weight shifts to one side, the plank tilts like a seesaw.

**How:** The plank is attached to a central pivot point (a special peg type or a fixed pivot entity) via a revolute joint. The plank can rotate freely around the pivot. When the ball lands on one side, that side goes down; the other side goes up. An upward-moving end can launch a second ball or lift another plank into position.

**Why:** Dynamic, time-dependent puzzles. The player must think about *weight distribution* and *timing*. A teeter plank can act as a switch: the ball arrives, tilts the plank, and the other end knocks a peg into place or launches another ball. This is the "Rube Goldberg" element.

**Implementation:** New entity type `Pivot` or `TeeterPlank` that is a single plank with a revolute joint at its center. The plank must be balanced on a single peg (or a fixed pivot point). The ball's weight provides the torque. Visual: plank has a fulcrum mark at its center.

---

### 2.6 Conveyor Plank (Motorized)
**What:** A plank that moves objects resting on it in a fixed direction, like a conveyor belt.

**How:** Any body resting on the plank experiences a constant horizontal force in the plank's designated direction. The ball doesn't just roll — it is *pushed*. This can move the ball uphill, sideways, or even against gravity if the force is strong enough.

**Why:** Movement without gravity dependency. Conveyor planks can push the ball across flat surfaces, up slight inclines, or even against the direction of a ramp. This opens "factory" puzzles where the player builds a production line, not just a gravity ramp.

**Implementation:** PlankDef gains `conveyor: { direction: 'left' | 'right', speed: number }`. During physics step, any body in contact with the plank's top surface receives a horizontal force. Visual: arrows on the plank surface, possibly animated.

---

### 2.7 Curved Plank (Arc Segment)
**What:** A plank that is not straight but curved — either concave (cup-shaped) or convex (hump-shaped). The ball follows a parabolic or circular arc rather than a straight line.

**How:** The plank's collision body is a curved polygon or arc segment. The ball rolls along the curve, gaining or losing speed depending on the curvature. A concave plank can "catch" the ball and hold it; a convex plank can launch it.

**Why:** Currently all planks are straight lines. Curved planks add *ballistics* — the ball's trajectory becomes unpredictable without visualization, creating "aha!" moments when the player realizes the curve does something unexpected. Also enables "funnel" and "launch" designs that are impossible with straight planks.

**Implementation:** PlankDef gains `curve: { type: 'concave' | 'convex', radius: number, segments: number }`. The collision body is constructed as a chain of small line segments approximating the arc. Visual: plank is visibly curved, rendered as a bent strip.

---

## 3. Ball Variants

### 3.1 Heavy Ball
**What:** A ball with higher mass. It breaks breakable planks more easily, compresses spring pegs more, and tilts teeter planks more dramatically.

**How:** The ball's `mass` and `density` are increased. Gravity has a stronger effect on it. It also has more momentum, so it can push lighter objects out of the way or knock pegs loose if they're not fixed.

**Why:** Mass as a variable. The player might need the heavy ball to break a barrier or the light ball to cross a fragile bridge. Some puzzles require switching between ball types (if multiple balls exist) or using the heavy ball's momentum to trigger mechanisms.

**Implementation:** BallDef gains `mass: number`. Render: larger or darker ball.

---

### 3.2 Bouncy Ball
**What:** A ball with very high restitution. It bounces off everything — pegs, planks, walls — rather than rolling.

**How:** The ball's `restitution` is set to 0.9+. It loses almost no energy on collision. It can bounce off a rubber plank and gain height, or ricochet between pegs like a pinball.

**Why:** A completely different play style. The player cannot rely on gravity and predictable rolling. They must think in terms of *trajectories* and *reflections*. This is a "mode shift" that keeps the game fresh.

**Implementation:** BallDef gains `material: 'rubber' | 'metal' | 'glass'`. Render: ball has a different color or visual effect (glow, stripes).

---

### 3.3 Sticky Ball
**What:** A ball that sticks to surfaces it touches. Once it contacts a plank or peg, it adheres and stops rolling.

**How:** On contact, the ball's friction coefficient is temporarily increased to maximum, and a joint is created between the ball and the contacted surface. The ball cannot roll away unless a significant force (e.g., another ball hitting it, or a teeter plank launching it) breaks the adhesion.

**Why:** Anti-ball. The player must avoid surfaces that trap the ball. Or, they must use the sticky ball to "weigh down" a teeter plank or hold a plank in place. This is a *hindrance* that can be exploited as a tool.

**Implementation:** BallDef gains `sticky: boolean`. On contact, create a weld joint or max-friction constraint. Visual: ball has a tar-like texture or gooey surface.

---

### 3.4 Multiple Balls (Simultaneous)
**What:** The puzzle contains two or more balls that must ALL reach their respective cups (or one cup, or any cup).

**How:** Each ball is dropped from a different position. They interact with each other (collisions) and with the same infrastructure. The player must build a path that works for ALL balls, or build separate paths that don't interfere.

**Why:** Resource sharing and interference. The player might build a perfect ramp for Ball A, but Ball B rolls into it and knocks a plank out of place. This creates emergent complexity from simple rules. Also enables "color-coded" puzzles where each ball has its own constraints.

**Implementation:** BallDef becomes `balls: BallDef[]`. Each ball can have its own properties (mass, material, color). Cups can be `anyBall` or `specificBall`. The physics engine handles all bodies simultaneously.

---

## 4. Environmental Obstacles

### 4.1 Wind Zone (Horizontal Force Field)
**What:** A region of the board where a constant horizontal force (wind) pushes everything inside it.

**How:** Any body inside the wind zone's bounding box receives a horizontal force proportional to its surface area. The wind can push balls sideways, push planks off pegs, or even hold a ball suspended against gravity if strong enough.

**Why:** Invisible forces that the player must account for. The ball might need to be *launched* into the wind to reach the cup, or the wind might blow a plank away before the ball arrives. This is an environmental hazard that rewards planning.

**Implementation:** New entity `WindZone` with `x, y, w, h, direction, strength`. During the physics step, apply force to all bodies overlapping the zone. Visual: semi-transparent arrows or particle effects.

---

### 4.2 Gravity Well (Point Attractor)
**What:** A region where gravity is stronger or points in a different direction. The ball is pulled toward the well's center.

**How:** Any body within the well's radius experiences a force toward the center. The force is stronger near the center (inverse square law). The ball can orbit the well if it has enough tangential velocity, or fall straight into it.

**Why:** Orbital mechanics in a puzzle game. The player can use a gravity well to "slingshot" the ball around an obstacle, or they must avoid having the ball sucked into the well (which might be a death zone).

**Implementation:** New entity `GravityWell` with `x, y, radius, strength`. Apply force vector to all bodies within radius. Visual: a swirling vortex or dark spot.

---

### 4.3 Portal Pair (Teleporter)
**What:** Two circular zones. When the ball enters Zone A, it is instantly teleported to Zone B, preserving its velocity and direction.

**How:** The ball's position is set to the exit portal's location. Its velocity vector is preserved (or rotated if the exit portal faces a different direction). The ball maintains momentum — it doesn't stop.

**Why:** Non-local connectivity. The player can build a path on one side of the board and have the ball emerge on the other side. This allows "impossible" geometry and compact puzzles that would require enormous boards without portals. Also enables "momentum transfer" puzzles where the ball must enter a portal at a specific speed to exit at the right angle.

**Implementation:** New entity `Portal` with pairs linked by `id`. When a ball enters one portal's sensor, teleport it to the paired portal's location. Preserve velocity (optionally rotate by `exitAngle`). Visual: glowing circles, matching colors for pairs.

---

### 4.4 Floor Hole (Ball Drain)
**What:** A gap in the floor. If the ball falls into it, it is lost (level fails). The player must route the ball around the hole.

**How:** The floor is not continuous. A section is removed. The ball's collision with the floor ends, and if it's below the floor level, it triggers a fail state. The hole is an environmental hazard, not an interactive object.

**Why:** Currently the ball can only fall off the bottom edge of the board. A hole in the middle of the floor creates local danger zones that the player must bridge over. This forces the player to build *longer* or *higher* paths to avoid the gap.

**Implementation:** Floor geometry gains `holes: { x, y, w, h }[]`. The floor is rendered as segments with gaps. The fail condition checks if the ball is inside a hole AND below the floor plane. Visual: black void or water beneath the hole.

---

### 4.5 Moving Wall / Obstacle
**What:** A wall or solid obstacle that moves along a predefined path (back-and-forth, circular, or triggered).

**How:** The wall's body is kinematic — it moves along its path regardless of collisions. It can push balls, planks, and pegs out of its way (if they're not fixed). If the wall hits a peg, it might knock it loose.

**Why:** Timing puzzles. The player must drop the ball at the right moment so the wall is in the correct position — either blocking a wrong path, or forming a temporary bridge/ramp. This is the "platformer" element in a physics puzzle.

**Implementation:** New entity `MovingWall` with `path: { x, y, time }[]` and `speed`. The body is kinematic; its position is updated every frame along the path. Can be `triggered` (starts moving when the ball is dropped) or `looping` (always moving). Visual: metallic or stone wall with motion indicators.

---

## 5. Interactive Zones

### 5.1 Pressure Plate (Floor Switch)
**What:** A zone on the floor that triggers an event when the ball rolls over it (or when a plank falls on it).

**How:** A sensor zone on the floor. When a body enters it, it triggers a linked action. Actions include: spawn a new peg, move a wall, open a portal, change gravity direction, etc. The plate stays triggered as long as weight is on it, or toggles on/off.

**Why:** The ball becomes a *switch* as well as a payload. The player must route the ball over a pressure plate to enable the rest of the puzzle. Or, they must place a plank on the plate to hold it down while the ball takes a different path. This is the "escape room" mechanic.

**Implementation:** New entity `PressurePlate` with `x, y, w, h, triggerAction, holdMode: 'toggle' | 'momentary'`. When a body enters, fire the trigger. Visual: glowing button on the floor that illuminates when pressed.

---

### 5.2 Timer Zone (Countdown)
**What:** A zone that starts a countdown when the ball enters it. The player must solve the rest of the puzzle before time runs out.

**How:** When the ball enters the zone, a timer begins. If the ball reaches the cup before the timer expires, the level is completed with a bonus. If time expires, the level resets or the ball is destroyed.

**Why:** Speed puzzles. The player must build the infrastructure AND execute the drop quickly. This is a different skill from pure planning — it tests execution under pressure. Also enables "racing" puzzles where two balls must reach the cup before the timer.

**Implementation:** New entity `TimerZone` with `x, y, w, h, duration`. On entry, start a countdown. On timeout, trigger fail state or reset. Visual: digital clock or hourglass that appears when the ball enters.

---

### 5.3 Goal Zone (Multiple Cups / Scoring)
**What:** Instead of a single cup, there are multiple goal zones. The player must route the ball to a specific zone, or the ball must pass through multiple zones in sequence.

**How:** Multiple `Cup` entities. Each can have a `required` flag. The level is won only when the ball enters all required cups (in any order, or in a specific order). The ball can pass through optional cups for bonus points.

**Why:** Multi-objective puzzles. The player cannot just build a straight line to the nearest cup. They must build a branching path that hits multiple targets. This is the "network" or "circuit" design pattern.

**Implementation:** CupDef gains `required: boolean`, `order: number` (optional). The win condition checks all required cups. Visual: required cups glow brighter or have a star.

---

## 6. Meta-Mechanics

### 6.1 Limited Plank Drops (Resource Constraint)
**What:** The player cannot drop planks infinitely. They have a limited number of "drop actions" per level.

**How:** Each time the player clicks "Drop Planks," a counter decrements. After the limit is reached, the player can still move pegs but cannot drop new planks. They must work with what's already on the board.

**Why:** Currently the player can spam drop planks and brute-force solutions. A limited drop count forces *efficiency* — the player must plan their drops carefully. It also enables "build with what you have" puzzles where the starting planks are pre-placed and the player must rearrange, not add.

**Implementation:** LevelDef gains `maxDrops: number`. The UI shows remaining drops. If `maxDrops` is undefined, the default is unlimited.

---

### 6.2 Par / Star Rating (Optimization)
**What:** Each level has a target number of moves (peg moves + plank drops). Completing the level in fewer moves earns more stars (3 stars = par or below, 2 stars = par + 1-2, 1 star = any solution).

**How:** The game tracks the number of peg moves and plank drops. When the level is won, it compares the total to the par. The result is stored per level.

**Why:** Replayability. Players will replay levels to optimize their score. This is the "Angry Birds" model — the core puzzle is easy enough to beat, but hard to perfect. It also creates a community layer (leaderboards, shared replays).

**Implementation:** LevelDef gains `par: number` (optimal move count). Track `moves` and `drops` during gameplay. On win, compute stars and store in localStorage or a backend.

---

### 6.3 Sandbox Mode (Free Build)
**What:** A mode where the player has an unlimited grid, unlimited pegs, unlimited planks, and no win condition. They can build anything.

**Why:** Creativity. Some players will build Rube Goldberg machines, art pieces, or test levels for the community. Sandbox mode turns the puzzle game into a toy, which is excellent for retention and content creation (players share their creations). Also, the map editor you mentioned can be built on top of this.

**Implementation:** A separate mode with a larger or infinite grid. No ball or cup. All peg types and plank types available. Save/load functionality for creations. Export as a level file.

---

### 6.4 Map Editor (Community Levels)
**What:** An in-game editor where players can design levels, test them, and publish them.

**How:** A UI panel with: grid size selector, peg palette, plank palette, ball/cup placement, and a "Test" button. The player can test their level in real-time without leaving the editor. Completed levels can be exported as JSON or uploaded to a server.

**Why:** User-generated content is the ultimate scalability. The community builds levels faster than you ever could. It also creates ownership — players who build levels are more invested in the game. This is the "Mario Maker" model, but for your physics engine.

**Implementation:** An editor panel that manipulates the same `LevelDef` objects. Add/remove entities by clicking. Drag to move. A "Test" button spawns the level and runs the physics. An "Export" button generates the JSON. A "Publish" button uploads to a server (or saves to localStorage for now).

---

## Summary Matrix

| Entity | Category | Complexity | Priority | Synergy With |
|--------|----------|------------|----------|-------------|
| Fixed Peg | Peg | Low | **High** | All |
| Angled Peg | Peg | Medium | High | One-Way Peg |
| Spring Peg | Peg | Medium | Medium | Teeter Plank |
| Telescoping Peg | Peg | Medium | High | Breakable Plank |
| Magnetic Peg | Peg | Medium | Medium | Ferrous Plank |
| Bouncy Peg | Peg | Low | Medium | Bouncy Ball |
| One-Way Peg | Peg | Medium | **High** | Fixed Peg |
| Balloon Peg | Peg | High | Low | Ice Plank |
| Ferrous Plank | Plank | Low | Medium | Magnetic Peg |
| Rubber Plank | Plank | Low | Medium | Bouncy Ball |
| Ice Plank | Plank | Low | Medium | Spring Peg |
| Breakable Plank | Plank | Medium | High | Heavy Ball |
| Teeter Plank | Plank | High | Medium | Pressure Plate |
| Conveyor Plank | Plank | Medium | Low | Wind Zone |
| Curved Plank | Plank | High | Medium | Portal |
| Heavy Ball | Ball | Low | Medium | Breakable Plank |
| Bouncy Ball | Ball | Low | Low | Rubber Plank |
| Sticky Ball | Ball | Medium | Low | Teeter Plank |
| Multiple Balls | Ball | High | Medium | Multiple Cups |
| Wind Zone | Environment | Medium | Medium | Conveyor Plank |
| Gravity Well | Environment | High | Low | Portal |
| Portal | Environment | High | Medium | Curved Plank |
| Floor Hole | Environment | Low | High | Fixed Peg |
| Moving Wall | Environment | High | Medium | Timer Zone |
| Pressure Plate | Zone | Medium | **High** | Moving Wall |
| Timer Zone | Zone | Low | Low | Moving Wall |
| Goal Zone | Zone | Low | Medium | Multiple Balls |
| Limited Drops | Meta | Low | High | Par Rating |
| Par Rating | Meta | Low | **High** | Leaderboards |
| Sandbox Mode | Meta | Medium | Medium | Map Editor |
| Map Editor | Meta | High | **High** | Community |

---

## Next Steps

1. **Validate** these mechanics against your current physics engine (Matter.js). Which ones are feasible with minimal changes?
2. **Prioritize** — pick 3-5 for a first expansion pack. My recommendation: Fixed Peg, One-Way Peg, Breakable Plank, Par Rating, Map Editor.
3. **Test** — build a prototype level for each new mechanic before committing to full integration.
4. **Iterate** — come back and add more. This document is a living spec.

**Sam, you shipped a game today. Now ship the next one.** 🏁🔥
