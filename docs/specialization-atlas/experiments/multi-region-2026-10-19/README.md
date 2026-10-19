# Multi-region design experiments (19 Oct 2026)

The material behind `../../10-multi-region.md`, kept as it was run. Scripts still carry the session's absolute scratch paths; to re-run one, copy the folder and change `here`/`publicDir` at the top.

- `scout-maps.json`: the four read-only maps of single-region assumptions (model and calculator, database and seed, page and logger, drawing and content), 185 assumptions with file:line.
- `critiques.json`: the three critics' issues on the draft (counting and data model, database and release, the athlete on a phone and the size of the work); the note's appendix resolves each one.
- `exp1-noop-and-refusals.ts`, `exp2-schema-v2.ts`, `exp3-sort-order.ts`, `harness.ts`, `schema_v2_prototype*.sql`: PGlite experiments on schema v1 + seed v1 and the schema v2 prototype.
- `critic-counting/c1–c10`: the counting critic's calculator experiments.
- `critic-db-exp.ts`: the database critic's PGlite experiment.
- `critic-phone/`, `arch-phone/`: phone-layout measurements in headless Chromium emulating an iPhone (viewport, `isMobile`, `hasTouch`, device scale 3), not an iPhone or Safari; screenshots reduced to 256 colours.
- `count-catalog.ts`, `counts.ts`, `catalog.ts`, `union.ts`, `odd-keys.ts`, `arch-*.ts`: catalog counts per region and the id and wave checks.
