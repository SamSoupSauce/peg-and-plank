# Changelog

All notable changes to peg-and-plank.

## v2 — Level packs & sharing

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
