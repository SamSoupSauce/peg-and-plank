# peg-and-plank

A 2D physics puzzle game: pegs hold up planks, planks guide the ball.

## Play

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## How to play

1. **Move pegs** — drag or click a peg to move it to any empty wall slot.
2. **Drop planks** — planks fall and rest on your pegs, forming ramps and bridges.
3. **Drop the ball** — guide it into the glowing cup.

## Level packs

The game stores level packs in `localStorage`. Open the **🎒 Packs** menu to:

- Switch between packs.
- Download any pack as a JSON file.
- Add a new pack from a URL, a JSON file upload, or copy-pasted JSON.

Packs may be shared as either a raw array of levels or an object with `name` and `levels`:

```json
{
  "name": "My Pack",
  "levels": [
    {
      "name": "My Level",
      "hint": "A helpful hint",
      "grid": { "cols": 9, "rows": 6, "x": 120, "y": 90, "dx": 90, "dy": 80 },
      "pegs": [10, 20],
      "planks": [{ "x": 165, "y": 130, "w": 122, "h": 16, "angle": 41.6 }],
      "ball": { "x": 120, "y": 20 },
      "cup": { "x": 360, "y": 540, "w": 140, "h": 60 }
    }
  ]
}
```

Progress (unlocked levels, completed levels, and ball losses) is tracked per pack.

## Included packs

- **Peg & Plank** — the main built-in campaign.
- **Example Pack** — a single super-simple ramp level, useful as a template for authoring your own packs.

## Build

```bash
npm run build
```
