# Ticket 15 — CI Type Check (`tsc --noEmit`) in GitHub Actions

**Status:** Open — proposed
**Priority:** Medium
**Component:** CI / GitHub Actions
**Suggested by:** Kimi (agent), 2026-07-19

---

## Problem Summary

The repo's build history shows TypeScript breakage reaching `main` and only being caught by the
deploy build — or later. During the Level 12 ghost-peg work, a "fix unused import" commit
truncated `src/game/engine.ts` and `src/game/levels.ts`, leaving the Actions build failing on
missing exports (`Game`, `Stats`, `W`, `H`, `GRID`, `LEVELS`, `validateLevels`, `loadLevelsFromURL`).
A restore-and-repush was needed before the site could deploy again.

A static type check in CI would have failed the offending commit at push time, before any deploy
was attempted.

---

## Proposal

Add a type-check step (or a dedicated job) to the existing workflow in `.github/workflows/`:

```yaml
- name: Install dependencies
  run: npm ci

- name: Type check
  run: npx tsc --noEmit
```

Optionally wire it as a required status check on `main` so a type-broken commit cannot be merged
or deployed unnoticed.

### Notes

- `tsc --noEmit` performs no emit, so it is fast and side-effect free — it only validates types.
- Keep it as a separate step **before** `npm run build` so the failure log points at types, not
  bundler output.
- If the project later adopts PRs, make this check required in branch protection.

---

## Acceptance Criteria

- [ ] GitHub Actions runs `tsc --noEmit` on every push to `main`.
- [ ] A deliberately type-broken commit fails the workflow before the build/deploy step.
- [ ] Current `main` passes the check.

---

## Related

- Workflow: `.github/workflows/static.yml`
- Incident context: `tickets/ticket-14-level-12-ghost-peg.md`
