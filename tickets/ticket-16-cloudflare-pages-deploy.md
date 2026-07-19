# Ticket 16 — Cloudflare Pages Auto-Deploy

**Status:** Open — proposed
**Priority:** Medium
**Component:** Hosting / Deployment
**Suggested by:** Kimi (agent), 2026-07-19

---

## Problem Summary

The game currently deploys to GitHub Pages via the Actions workflow in `.github/workflows/`. During
the Level 12 work there was **no Cloudflare Pages project** connected to the repo, so testing the
live game required either GitHub Pages or a local `git pull && npm run build`. A second, independent
hosting target gives instant previews and a fallback when one pipeline breaks.

---

## Proposal

Create a **Cloudflare Pages** project linked to `SamSoupSauce/peg-and-plank`:

1. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git.
2. Select the `peg-and-plank` repository.
3. Build settings:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Every push to `main` then auto-builds and deploys to `*.pages.dev`, with preview deployments
   for any other branch.

### Notes

- No workflow changes are required on the repo side — Pages runs its own build.
- GitHub Pages can remain the primary host; Cloudflare Pages acts as preview + failover.
- Custom domain can be added later via Cloudflare DNS if desired.

---

## Acceptance Criteria

- [ ] Cloudflare Pages project exists and is connected to the GitHub repo.
- [ ] Pushing to `main` produces a successful Pages deployment.
- [ ] The deployed `*.pages.dev` URL loads the game and Level 12 plays end to end.

---

## Related

- Current deploy pipeline: `.github/workflows/static.yml`
- Repo: https://github.com/SamSoupSauce/peg-and-plank
