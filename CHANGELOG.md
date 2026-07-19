# Changelog

All notable changes to peg-and-plank.

## v2.1.3 — Level 11 hinge joint alignment fix

### Hinge joint on the plank is not aligned with the fixed peg

**Commit:** [`6f20b70`](https://github.com/SamSoupSauce/peg-and-plank/commit/6f20b70)

**What**  
Fixed the Level 11 ("Fixed Point") hinge so the plank's joint sits exactly on the fixed peg (0.00–0.06 px drift, previously ~29 px), and re-tuned the level geometry so the intended solution — plank hinged to the fixed peg, far end resting on the spare peg at the hint slot, ball rolling into the cup — actually works.

**Why**  
`attachFixedPegHinges()` passed the plank-end anchor as an unrotated body-local offset (`pointB: { x: ±hw, y: 0 }`), but Matter.js treats `pointB` as a **world-axis offset** from the body center at creation and only tracks rotation deltas afterwards (`Constraint.solve` rotates `pointB` by `bodyB.angle - constraint.angleB`). For Level 11's tilted plank, the hinge grabbed the plank ~35° away from its real end — a stable ~29 px gap between the plank's end and the peg, so the visible joint floated off the peg. The v2.1.2 rim anchor (`pointA: { x: PEG_R, y: 0 }`) had papered over a second problem: the 96 px board cannot span the 120 px from the fixed-peg center to the slot-20 support peg, which is what had forced the misaligned rim pivot in the first place.

**How**  
- In `src/game/engine.ts`:
  - `pointB` is now `Matter.Vector.rotate(bestLocal, bestPlank.angle)` — the world-axis offset Matter expects (root-cause fix).
  - `pointA` is now `{ x: 0, y: 0 }` — the pivot is the peg's bolt center instead of a point on its rim, so the joint is aligned with the peg regardless of which side the plank approaches from (the old hardcoded +x offset was side-blind).
- In `src/game/levels.ts` (Level 11):
  - Plank is now the 140 px board described in the v2.1 entry, spawned at `{ x: 270.6, y: 205, angle: 30 }` so the hinged end starts exactly on the pivot with no snap and the far end spans to the hint slot, settling on top of the support peg.
  - Cup moved from `x: 420` to `x: 545`, the ball's verified landing point off the fixed ramp (the old position was tuned for the broken physics).
- Verified with headless Matter.js simulations replicating the engine's spawn parameters: hinge drift ≤ 0.06 px under ball impact, plank settles at 32.5° resting on the support peg, ball lands in the cup in the solved state, and the unsolved state (no support peg) hangs stably from the hinge with no physics explosion.

## v2.1 — Fixed-peg tutorial & Level 11 stabilization

### One-time tutorial bubble system

**Commit:** [`55eeafe`](https://github.com/SamSoupSauce/peg-and-plank/commit/55eeafe)

**What**  
Added a one-time tutorial bubble system to introduce new mechanics without repeated hand-holding. `TutorialBubble` now carries an `id`, `message`, `buttonText`, and an optional slot highlight. Level 11 ("Fixed Point") uses three bubbles to explain fixed pegs, anchor strategy, and two-support plank stability.

**Why**  
Level 11 was unplayable without explanation: the fixed peg looked identical to movable pegs, the hint ring was too subtle, and the plank layout let the board destabilize. Players assumed the game was broken and quit. A dismissible, sequential bubble system gives clear context the first time a mechanic appears and then stays out of the way forever.

**How**  
- Added `TutorialBubble` to `src/game/types.ts` with a required `id` so progress can track what the player has already seen.
- Extended `PackProgress` in `src/game/packs.ts` with `seenTutorials`, migrated old saves that lacked the field, and added `hasSeenTutorial` / `markTutorialSeen` helpers.
- Created `src/components/TutorialOverlay.tsx` to render sequential bubbles, colored pulsing slot highlights, and a skip button. The whole sequence is marked as seen only when the player finishes or skips.
- Improved fixed-peg rendering in `src/game/engine.ts`: bronze metallic gradient, bright yellow pulsing ring, and a lock icon.
- Improved hint-slot rendering: switched from green to neon cyan with a pulsing scale animation.
- Added a brief screen shake and invalid flash when the player tries to drag a fixed peg.
- Fixed a placement bug: `tryPlace` and the snap-target highlight now reject slots occupied by fixed or one-way pegs, and `emptySlotCount` counts them as occupied.
- Reworked Level 11 in `src/game/levels.ts`:
  - The plank now spans from the fixed peg to the glowing hint slot with a longer, stable 140 px board.
  - Added three tutorial bubbles: fixed-peg intro, anchor strategy, and the two-support tip.
- Wired the overlay into `src/App.tsx` via `useMemo`, calling `markTutorialSeen` for the completed sequence.
- Added the ticket file `tickets/level-11-fixed-point-analysis.md` to the repo.

## v2.1.2 — Fixed-peg hinge-only collision & plank alignment

### Hinge-only collision for fixed pegs

**Commit:** [`fc405ef`](https://github.com/SamSoupSauce/peg-and-plank/commit/fc405ef)

**What**  
Fixed the remaining Level 11 physics issues: the fixed peg no longer collides with the plank it is hinged to, and the plank now sits flush against the fixed peg while resting slightly above the target movable peg.

**Why**  
The previous global collision filter disabled collisions between *all* planks and *all* fixed pegs, which was broader than necessary and still left the plank visually intersecting its anchor. The ticket also called out that the plank needed to be flush with the fixed peg and a little higher above the normal peg so gravity could settle it cleanly.

**How**  
- In `src/game/engine.ts`:
  - Replaced the global category/mask collision filter with a per-hinge negative `collisionFilter.group`. Each fixed peg and its connected plank share a unique negative group, so they ignore each other while still colliding with the ball, walls, and other pegs.
  - Moved the hinge anchor from the top of the fixed peg to its right side (`pointA: { x: PEG_R, y: 0 }`), making the plank flush with the peg instead of overlapping it.
  - Kept the zero-length, stiff constraint behavior in `attachFixedPegHinges()`.
- In `src/game/levels.ts`:
  - Recalculated the Level 11 plank spawn so the right end is a few pixels above the target peg top, letting gravity settle it on top.
- Added the ticket file `tickets/ticket-13.md`.

## v2.1.1 — Fixed-peg hinge & Level 11 collision fix

### Physics stability for fixed pegs

**Commit:** [`86d3101`](https://github.com/SamSoupSauce/peg-and-plank/commit/86d3101)

**What**  
Fixed the Level 11 physics so the plank no longer slides off the fixed peg, jitters against intermediate pegs, or embeds beside the movable peg. Fixed pegs now anchor planks via rigid hinge constraints, and planks ignore collisions with fixed pegs while still colliding with movable pegs, the ball, walls, and the cup.

**Why**  
The previous fixed-peg implementation relied only on collision friction. The plank would slide, spin, and launch because it had no true pivot and could simultaneously contact the fixed peg and other pegs. This made the level unsolvable regardless of player skill.

**How**  
- In `src/game/engine.ts`:
  - Added `attachFixedPegHinges()` to create zero-length, stiff `Matter.Constraint` hinges between each fixed peg and the nearest plank end.
  - Assigned fixed pegs to collision category `0x0002` and planks to mask `0xffffffff ^ 0x0002`, eliminating plank/fixed-peg collision jitter while keeping ball/fixed-peg and plank/movable-peg collisions.
  - Cleared and rebuilt constraints in `dropPlanks()` and on level reset.
- In `src/game/levels.ts`:
  - Respawned the Level 11 plank above the target movable peg so gravity settles it on top.
  - Moved the ball spawn to `x: 230` so it lands on the ramp.
- Added the ticket file `tickets/ticket-12.md`.

## v2 — Level packs & sharing

### Entity mechanics expansion

**Commit:** [`fedc89f`](https://github.com/SamSoupSauce/peg-and-plank/commit/fedc89f)

**What**  
Added five new entity/mechanic types from `peg-and-plank-entity-design.md`: fixed pegs, one-way pegs, breakable planks, par rating, and limited plank drops. Each mechanic received a dedicated built-in level.

**Why**  
The base game only had movable pegs and static planks. Introducing constraints (fixed pegs), directional gates (one-way pegs), single-use surfaces (breakable planks), and optimization pressure (par / limited drops) significantly expands the puzzle design space without requiring a full physics rewrite.

**How**  
- Extended `LevelDef` in `src/game/types.ts` with `fixedPegs`, `oneWayPegs`, `breakable` plank flag, `par`, and `maxDrops`.
- In `src/game/engine.ts`:
  - Fixed pegs are created with label `peg-fixed` and skipped by drag handlers; rendered in rusty red with a rivet ring.
  - One-way pegs render as a blue arrow and create a small static wall on the side where reverse traffic would arrive, blocking movement against the arrow while allowing passage with it.
  - Breakable planks track ball contact and shatter on separation, spawning debris particles.
  - `dropPlanks()` now increments a `drops` counter and respects `maxDrops`.
- Added `computeStars()` in `src/App.tsx` based on `moves + drops` vs `par` (3 stars ≤ par, 2 ≤ par+2, else 1).
- Extended `PackProgress` in `src/game/packs.ts` with a per-level `stars` array and migrated existing saves.
- Updated UI to show drops remaining, par, and stars on level buttons and in the win overlay.
- Added showcase levels in `src/game/levels.ts`:
  - **Fixed Point** — a bolted-down peg anchors the ramp.
  - **One-Way Gate** — a directional peg forces left-to-right flow.
  - **Fragile Bridge** — a cracked plank collapses after the ball crosses.
  - **Par Perfect** — a speed-run layout with `par: 3`.
  - **Drop Budget** — only one plank drop allowed.

---

### JSONified level format

**Commit:** [`75ce03f`](https://github.com/SamSoupSauce/peg-and-plank/commit/75ce03f)

**What**  
Refactored the built-in `LEVELS` array so each level definition is plain JSON-serializable data instead of TypeScript code that depends on runtime helpers. Added runtime validation and a URL loader for level data.

**Why**  
The original `levels.ts` built the slot-index arrays at module load time by calling `slotIndex(row, col)`. That made the array impossible to `JSON.stringify`, save to disk, or fetch from a remote URL. Turning levels into pure data is the prerequisite for user-authored packs, sharing, and any external level editor.

**How**  
- Replaced every `si(...)` call in `src/game/levels.ts` with the computed literal number, keeping the original coordinate comments for readability.
- Exported the shared `GRID` definition so importers can reference the same lattice.
- Added `validateLevels`, `validateLevel`, and `LevelValidationError` to guarantee that JSON fetched from a URL matches the expected `LevelDef` shape.
- Added `loadLevelsFromURL(url)` to fetch and validate a remote level pack.
- Re-exported `LevelDef` from `src/game/levels.ts` so consumers only need one import.
- Updated `src/App.tsx` to support an optional `?levels=<url>` query parameter that loads a custom pack, falling back to the built-in pack on error.

---

### Level pack manager with localStorage, sharing, and example pack

**Commit:** [`ac79348`](https://github.com/SamSoupSauce/peg-and-plank/commit/ac79348)

**What**  
Turned the single level list into a user-managed collection of level packs. Packs are persisted in `localStorage`, each pack tracks its own completion progress and ball-loss count, and a new UI lets players switch packs, download them, or add new ones from a URL, file upload, or copy-pasted JSON. Also added an example pack containing one simple ramp level.

**Why**  
Once levels were JSON data, the next step was to let players actually create, share, and swap level packs without editing code. Persisting packs locally keeps the app self-contained (no backend required), and per-pack progress lets players experiment with custom packs without losing their progress in the built-in campaign.

**How**  
- Created `src/game/packs.ts`:
  - Defined `LevelPack` and `PackProgress` types.
  - Added load/save helpers for packs, current-pack id, and per-pack progress.
  - Implemented `recordWin` and `recordLoss` to update progress independently for each pack.
  - Implemented `parsePackJSON` so packs can be imported either as a raw levels array or as `{ name, levels }`.
  - Added `downloadPack` to serialize `{ name, levels }` to a `.json` file via a Blob URL.
  - Marked the built-in and example packs as seed packs so they are always restored and cannot be deleted.
- Created `src/hooks/usePacks.ts`:
  - Initializes state from `localStorage` lazily to avoid setState-in-effect lint issues.
  - Exposes `selectPack`, `addPackFromURL`, `addPackFromFile`, `addPackFromJSON`, `removePack`, `winLevel`, and `loseBall`.
- Created `src/components/PackManager.tsx`:
  - Lists stored packs with completion stats.
  - Provides Select, Download, and Delete actions.
  - Exposes an **+ Add pack** menu with URL / Upload / Paste options.
- Created `src/components/AddPackDialog.tsx`:
  - Tabbed dialog for the three import methods.
  - Validates JSON on the fly and previews the number of levels found.
  - Lets the player edit the pack name before saving.
- Created `src/game/examplePack.ts`:
  - A single-level pack called **Example Pack** with a simple two-peg ramp, intended as a template for new authors.
- Updated `src/App.tsx`:
  - Replaced `useLevels` with `usePacks`.
  - Added a **🎒 Packs** button in the header.
  - Wired `onWin` and `onBallLost` to per-pack progress tracking.
  - Added a footer progress bar for the active pack.
- Removed `src/hooks/useLevels.ts` (replaced by `usePacks`).
- Updated `README.md` with pack format, sharing instructions, and example JSON.

---

## v1 — First playable release

### Initial project setup

**Commit:** [`9b73126`](https://github.com/SamSoupSauce/peg-and-plank/commit/9b73126)

Scaffolded the Vite + React + TypeScript + Tailwind project and committed the starter files.

### First working game

**Commit:** [`3ca809f`](https://github.com/SamSoupSauce/peg-and-plank/commit/3ca809f)

Implemented the first playable version of Peg & Plank:
- Matter.js physics engine integration.
- Canvas rendering for the wall, slots, pegs, planks, ball, and cup.
- Drag/click interaction for moving pegs.
- Drop-planks and drop-ball controls.
- Initial campaign of 10 built-in levels.

### GitHub Pages deployment

**Commit:** [`916d74a`](https://github.com/SamSoupSauce/peg-and-plank/commit/916d74a)

Added a GitHub Actions workflow to build and deploy the site to GitHub Pages on pushes to `main`.
