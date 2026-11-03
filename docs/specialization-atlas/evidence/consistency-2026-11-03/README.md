# The consistency pass, 3 Nov 2026: phone evidence

Headless Chromium with iPhone emulation (viewport, `isMobile`, `hasTouch`, device scale 3), not an iPhone or Safari. The production build is served from a local folder, at a fixed clock of 16 Oct 2026, seeded with the forearm test week (`../cleanup-2026-10-26/week.json`) and a four-day plan that includes the new rows (437, 421, 422, 442, 441, 423, 425, 433).

At 390 × 844 and 375 × 667 (`390-…`, `375-…`); no screen scrolls sideways at either width.

- `review-week`: Train → Review's body map now uses the same red scale as the Specialize drawing, from light rose (1–2 sets) to very dark red (15+).
- `detail-437`: Plate-Loaded Incline Chest Press, "How a set is logged". The load line opens with the logger's own label ("Plates per arm"), and Setup lists only what the logger asks for.
- `detail-435-mapped`: Isometric Neck Lateral Flexion — Manual Resistance, "How this is mapped". Sources are titled links, with what each one supports underneath.
- `forearm-ledger`: Brachioradialis's sheet. Its counts and ledger rows use the list's words: Direct sets, Other sets, Holds, Grip.

`node capture.cjs <build dir> <out dir>` takes them.
