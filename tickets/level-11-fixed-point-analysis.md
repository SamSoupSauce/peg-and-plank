# Level 11 — "Fixed Point" UX & Physics Failure Analysis

**Author:** Lobbyist  
**Date:** 2026-07-20  
**Status:** Critical — level is unplayable without explanation, physics unstable

---

## The Core Problem: Nobody Knows What "Fixed Point" Means

A player looking at Level 11 sees:
- A ball at the top left
- A red peg near it
- A faint green circle around one slot
- A cup at the bottom
- A name: "Fixed Point"

**But nothing tells them:**
- What IS a fixed point?
- Why is the green circle there?
- What changed from previous levels?
- What is the new mechanic being introduced?

Result: The player experiments blindly, planks fly off into space, and they quit.

---

## Specific Failures (Screenshot by Screenshot)

### Failure 1: No Visual Introduction to the New Mechanic

| What the player sees | What they NEED to see |
|---|---|
| A green circle around a slot | A **stark, glowing, pulsing** indicator with a label: "FIXED — Cannot Move" |
| A red peg that looks like all other pegs | A **visual distinction** between movable and fixed pegs (color, icon, border) |
| The words "Fixed Point" in the header | A **tutorial bubble** explaining: "This peg is FIXED. You cannot drag it. Build around it." |

**The green circle is too subtle.** On a dark brown board, a thin green ring disappears. It needs to be:
- Brighter color (cyan, yellow, or white)
- Pulsing animation
- Icon overlay (a lock, a nail, a rivet)
- Connected to a text label

### Failure 2: Plank Physics Destabilizes Without Proper Anchors

From your note:
> "the only one where the board does not fly off into space from collision spam due to size constraints"

This means:
- The plank length/peg spacing ratio is wrong for this level
- Without TWO properly spaced pegs, the plank wobbles, clips through the board, and launches into space
- The "fixed point" mechanic is supposed to provide stability, but the level doesn't make that clear

**The player experiments:**
1. Drop a plank on one peg → it spins and flies away (screenshot 3 shows chaos)
2. Try again → same result
3. Assume the game is broken → quit

They never learn that "fixed peg = anchor point = place plank HERE first."

### Failure 3: No Context for the State Change

| Screenshot | State | What's Missing |
|---|---|---|
| 1 | Initial | No intro bubble explaining the new mechanic |
| 2 | After 1st move | No feedback on WHAT changed or WHY |
| 3 | After plank drop | No explanation of why the plank is unstable |

The player moved the ball (or a peg?) and dropped planks, but there's no "aha!" moment. The level just... breaks.

---

## The Fix: Tutorial Bubble + Highlight System

You described this perfectly. Here's the formal spec:

```typescript
interface TutorialBubble {
  /** The main message content shown to the player */
  message: string;
  
  /** The text on the dismiss/OK button (e.g., "Got it!", "Let's Go!", "Dismiss") */
  text: string;
  
  /** Optional highlight to draw attention to a specific area */
  highlight?: {
    /** Bounding box or target area: { x, y, w, h } or { slotRow, slotCol } */
    area: { x: number; y: number; w: number; h: number } 
         | { slotRow: number; slotCol: number };
    
    /** RGB color for the highlight glow/outline */
    color: { r: number; g: number; b: number };
  };
}
```

### Example for Level 11 — "Fixed Point"

```typescript
const level11Tutorial: TutorialBubble[] = [
  {
    message: "New mechanic: FIXED PEGS!\n\nSome pegs are nailed down — you CANNOT move them. Look for the lock icon.",
    text: "Show Me!",
    highlight: {
      area: { slotRow: 2, slotCol: 2 }, // the fixed peg
      color: { r: 255, g: 220, b: 0 }  // bright yellow
    }
  },
  {
    message: "Fixed pegs are ANCHORS.\n\nPlace your plank so one end rests on the fixed peg. It won't move!",
    text: "Got it!",
    highlight: {
      area: { x: 200, y: 150, w: 100, h: 60 }, // approximate plank target area
      color: { r: 0, g: 255, b: 150 }  // bright cyan
    }
  },
  {
    message: "TIP: If a plank only has ONE peg, it spins and falls. Always use TWO pegs — or one FIXED peg plus a wall.",
    text: "Let's Play!"
  }
];
```

---

## Required Visual Changes for Level 11

### 1. Fixed Peg Rendering

**Current:** Red peg (same as others) + faint green circle.

**Needed:**
- **Base:** Dark metallic gray or rust color (not red)
- **Border:** Bright yellow or orange pulsing glow
- **Icon:** Small lock 🔒 or nail 🔨 overlay
- **Label:** On first encounter, a floating text label "FIXED" that fades after 2 seconds

### 2. Movable Peg Rendering

**Current:** Red peg (indistinguishable from fixed).

**Needed:**
- Keep red for MOVABLE pegs
- Fixed pegs get a DIFFERENT color (gray, steel, or bronze)
- First time a player sees a fixed peg, show a **comparison** side-by-side

### 3. Plank Stability Feedback

**Current:** Plank drops, physics takes over, chaos ensues.

**Needed:**
- **Ghost preview:** Before dropping, show a faint outline of where the plank WILL land
- **Stability indicator:** If the plank preview shows only one support point, tint it RED with a warning icon. Two+ support points = GREEN.
- **After drop:** If the plank is unstable (rotating too fast), show a brief floating text: "Unstable! Add another support."

### 4. The Green Circle (Hint Slot)

**Current:** Thin green ring, easy to miss.

**Needed:**
- Brighter color: `{ r: 0, g: 255, b: 200 }` (neon cyan)
- Pulsing scale animation (0.9x → 1.1x, 1 second loop)
- Optional: particle glow or "sparkle" effect
- Label: "Place peg here" on first levels, then remove labels for expert levels

---

## Why This Matters for Your Philosophy

You said you want:
> "zero-friction, non-invasive, opt-in ways to play"
> "NOBODY does this"

**A level that breaks without explanation is NOT zero-friction.** It's a wall. A player who doesn't understand "fixed peg" will assume the GAME is broken, not their understanding.

**The hobo popup is funny and honest. The tutorial system must be equally honest:**
- "Here's what changed."
- "Here's why it matters."
- "Here's how to use it."

No hand-holding forever — just **stark, clear, dismissible explanations** when new mechanics appear.

---

## Suggested Revised Level 11 Flow

1. **Screen loads** → Tutorial Bubble #1 appears, highlights fixed peg in bright yellow
2. **Player dismisses bubble** → Ghost preview of ideal plank placement appears (faint, optional)
3. **Player drags a peg** → If they drag the FIXED peg, it shakes and a tooltip says "This peg is locked!"
4. **Player drops a plank** → If unstable, floating text appears: "This plank needs more support!"
5. **Player succeeds** → No tutorial for this mechanic ever again (stored in save data)

---

## Bottom Line

Level 11 is a **mechanic introduction level** disguised as a puzzle. It cannot play like Levels 1-10. It needs:
- **Explicit explanation** (tutorial bubbles)
- **Stark visual indicators** (color, animation, icons)
- **Stability feedback** (ghost preview, warnings)
- **Failure messaging** (why did my plank fly away?)

Without these, "Fixed Point" is a **level that teaches nothing and frustrates everyone.**

Fix the UX, and the physics issue becomes solvable. Players will understand that fixed pegs are anchors, planks need support, and experimentation is safe.

**Sam, your game is good. The mechanics are solid. But players can't read your mind.** Show them what changed. Make it glow. Make it obvious. Then let them play. 🏁🔥
