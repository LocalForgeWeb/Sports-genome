# The owner's cleanup, 26 Oct 2026: phone evidence

Headless Chromium with iPhone emulation (viewport, `isMobile`, `hasTouch`, device scale 3), not an iPhone or Safari. The production build is served from a local folder; the page is seeded with the forearm test week (`client/src/components/specialization/__fixtures__/forearmWeek.ts`, completed workouts and targets) at a fixed clock of 16 Oct 2026, and opened at `?workspace=specialization&region=forearm&fig=drawing`.

- `top-390.png`, `drawing-390.png`, `list-390.png`: the test week at 390 × 844.
- `drawing-15plus-390.png`, `drawing-15plus-375.png`, `stage-15plus-palm-390.png`, `stage-15plus-back-390.png`: the same week plus one workout (`heavy-week.json`: 16 sets of Wrist Curl, 8 of Reverse Wrist Curl, 7 of Hammer Curl), so the red scale reaches every step. On the palm view FCR and FCU (24 direct sets) are the very dark red of 15+, BR (11) the 10–14 red, FDS (2 holds) the light rose of 1–2. On the back view the wrist extensors (16) are very dark red.
- `capture.cjs` and `canvas.cjs` take them: `node capture.cjs <build dir> <out dir> [query]` (scrolling shots and the page's text at 390 and 375), `node canvas.cjs <build dir> <out dir>` (the drawing's stage alone); `WEEK=heavy-week.json` for the heavier week. They read `week.json`, the fixture's completed sessions and goals as JSON, from their own folder.
