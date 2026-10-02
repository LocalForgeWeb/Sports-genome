# Probes

The scripts that produced the evidence in `../evidence/`. They drive the built app in headless Chromium through Playwright; none of them is part of the test suite.

Requirements: a build served at `http://localhost:4173` (`npx vite build && npx vite preview --port 4173 --strictPort`), Playwright and a Chromium binary. The scripts import Playwright from `/opt/node22/lib/node_modules/playwright/index.mjs` and launch `/opt/pw-browsers/chromium`, which is where this session's environment keeps them; change the two paths at the top of each script for another machine.

| Script | What it does |
| --- | --- |
| `home.mjs` | Shared `boot(page, { draft })`: routes exercise media to `logo.png`, answers every tRPC call with `null` (the app then runs on its device stores), seeds the athlete profile (wrestling · max strength · 5 days) and drafts Week 1. |
| `baseline.mjs` | Phase A baseline of the symptoms in the brief's §2. |
| `shellprobe.mjs` | Phase B: tab widths at 320/360/390, utilities, titles, LOC-06/07, the `genome` deep link. |
| `homeprobe.mjs` | Phase C: Home in its ordinary and live states, the three Explore rows, the record after a workout and a lift. |
| `phased.mjs` | Phase D: editing label, resume from the strip, add destination and feedback, the strip policy on Home. |
| `phasee.mjs` | Phase E: one pass over every page for §11. |
| `phasef.mjs` | Phase F: width sweep 320/360 (20px root)/390/430/1280 — overflow, target sizes, last row vs the strip. |
| `phaseg.mjs` | Journeys A–H (§16), the §18 screenshots and the transition recording; writes `phaseg-results.json`. |
| `extras.mjs` | Contrast of every visible text run, rapid tab switching, 200% text at 360px, desktop captures. |
| `overflow32.mjs` | Lists elements that push the page wider than 360px at a 32px root font. |
| `misc.mjs` | Scrolled chrome, Smart Draft apply and Undo, the empty-day prestart, a double tap on Log set. |

All of it is browser emulation, not a physical phone.
