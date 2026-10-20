# SG-FOREARM-INTEGRATION-20261019 — Manus forearm integration: checklist and ledger

**Input:** `sports-genome-forearm-anatomy-claude-handoff.zip`, kept unmodified outside the repo.
- Zip SHA-256: `2b974a4fb2550b17adcb2e2e5f72d9b74f89ea8c44e19a9acc34326ced7ceb44`.
- GLB SHA-256: `9a8b824935a399aef750c7b78bacdccfb54ae7104c3065147de0f37f69d82dfe`. This matches the supplied `SHA256SUMS.txt`.

**Start state:**
- Branch `full-merge`, from `main` at `3986178b` (17 Oct 2026, "Specialization atlas report…", #97). The atlas came from #96, `20d664a9`.
- Atlas route: `/?workspace=specialization&region=forearm` (Body Lab → Specialize). The page is `client/src/components/specialization/SpecializationPanel.tsx`, a lazy chunk. It drew an SVG diagram and read the device-side calculator `useSpecializationSummary`.

**Design:** [README.md](README.md).

## Completion ledger

| Item | Status | Files or evidence | Completed at | Remaining issue |
|---|---|---|---|---|
| IMPORT | Done | `package.json`: `three@0.179.0`, `@types/three@0.179.0` (lockfile updated by pnpm, not replaced). `client/public/assets/anatomy/` (GLB, `SHA256SUMS.txt`, `README.txt`). `client/public/draco/` (byte-identical to three 0.179 `libs/draco/gltf`). `client/src/components/specialization/anatomy3d/*`. Scoped CSS `anatomy3d.css`, every rule `.sg-anatomy3d-*`, no global styles, the app's type. Lazy chunk `ForearmModelView` (613 kB / 158 kB gz) loads only for the 3D stage. Credits in `AnatomyModelCredits.tsx`. | 20 Oct 2026 | None. |
| VISUAL | Done | Baseline of the supplied demo built in isolation (it typechecked and built clean, with no inherited failures): `evidence/baseline-supplied-demo-390-*.png`. Before: `evidence/before-page-*.png`. After: `evidence/after-*.png` at 320, 375, 390, 430 and 1280, showing a superficial muscle (FCU), a deep one (FDP), overview, left-arm mirror, the sheet and the missing-model state. Texture, lighting and orange selection are unchanged. Overview is re-centred. Left camera is mirrored. `depthTest` reviewed (front faces only while selected). | 20 Oct 2026 | None. |
| MAPPING | Done | `modelIdentity.ts`: 20 explicit rows, anconeus kept separate, exact two-way lookups. `modelIdentity.test.ts`: 9 tests pass, including every mesh name present in the shipped GLB and the checksum. Multi-head: FDS, FCU, PT and ECU light every head. An unknown source id is ignored; an unknown canonical id in the URL shows a readable "not a muscle in this atlas" note. Picking on the mirrored model was verified in the browser. Choose muscle lists every structure. | 20 Oct 2026 | None. |
| DATA | Done | `viewerData.ts` (field-by-field table in the README). `viewerData.test.ts`: 14 tests pass, traced from real logged workouts through `useSpecializationSummary`. They cover drop sets, two-handed work, side leakage, holds, planned mode, and zero/missing/partial/loading/error/unavailable. Targets: none by default, and compared only over the same period. | 20 Oct 2026 | None. |
| UX | Done | `SpecializationPanel.tsx`: 3D model / Drawing switch, selection bar and Choose muscle, stage, `ModelMusclePanel`. `ChooseMuscleSheet.tsx`: Back closes it first. `MuscleSheet` opens at its ledger for "View contributions". Add exercise uses the existing add flow (week and day shown). View resolves the catalog id. Overview. The URL `fig` parameter keeps the choice. Targets are ≥ 44 px. Controls on the stage are solid and visible at rest. | 20 Oct 2026 | None. |
| QA | Done | `Atlas3d.render.test.ts`: 23 tests pass. Full suite 443 files: 4,048 passed, 6 skipped (the skips were already there). Typecheck clean. Build clean. `evidence/browser-checks.json`: 13 browser checks pass. The recording is `evidence/recording-390-select-volume-contributions-return.mp4`. | 20 Oct 2026 | Headless only, not a device: see below. |
| DELIVERY | Done | This ledger, `README.md`, the asset README, the report-only CSP (`'wasm-unsafe-eval'`), the commit, and the push to the branch and to `main`. The deploy is checked through Vercel. | 20 Oct 2026 | Owner: the licence review before commercial redistribution (CC-BY-SA share-alike). |

## Checklist (brief §3–§11)

- [x] Recorded the start branch and commit, and the atlas route (above).
- [x] Inspected the host: React 19.2, Vite 7, pnpm, tRPC, wouter workspaces, lazy page chunk, design-system style tests. The existing atlas is the SVG drawing on Specialize.
- [x] Ran the supplied project in isolation: `tsc` and `vite build` both passed, so no failures were inherited. Its React (19.1) and Vite (6.3) were not brought in. The host already runs React 19.
- [x] Kept the ZIP unmodified; extracted it into a scratch folder only.
- [x] Kept the textures, materials, geometry, lighting, orange selection and transitions.
- [x] Copied the Draco decoder. Paths are deployment-safe (`BASE_URL`) and configurable by env.
- [x] Styles are scoped. The demo header, pill rail, event log, global styles and Google Fonts are removed. Credits are kept.
- [x] The viewer loads lazily, on the atlas route only.
- [x] Explicit source-to-canonical adapter, one to one, with reverse lookup. 20 structures, anconeus separate.
- [x] Multi-head structures fully highlight. Unknown ids get a readable state, never stale data.
- [x] Labels, geometry, exercises and contributions all resolve through the same canonical id.
- [x] Left arm is the mirrored model, with the camera mirrored; picking verified. Each arm's data is read separately. The mirror is labelled as such.
- [x] A list-based way to every structure: Choose muscle, plus the page's muscle list.
- [x] Every number comes from the existing summary. No demo values. Nothing is invented. The forearm total is never split across muscles.
- [x] Zero, missing, partial, loading and error are distinct. No default target. Targets are compared only over the matching period.
- [x] Data updates keep the GLB and the camera. Checked in the browser: the stage pixels are identical after window and mode changes.
- [x] Layout in the brief's order. The list is in a sheet. Return state lives in the URL. Deep links work. Overview. Back closes the sheet. Safe areas come from the existing sheets. Focus, accessible names, and a non-3D way to every muscle.
- [x] Reduced motion jumps (3 frames against 8 when eased). No orbit, tracer or "Show function". Manual rotation cancels automatic moves.
- [x] The renderer stays mounted across data changes. The stage is a stable size. Model errors are reported apart from data errors. Retry works. WebGL init failure and context loss are handled. Rendering pauses when hidden. Cleanup is complete (one canvas after four revisits). Pixel ratio is capped at 1.7. Model and decoder requests were checked against the production build. No speculative compression.
- [x] Licence and attribution are recorded. The checksum is tested. Third-party code is marked apart from new code. The stale supplied docs are corrected in the README.
- [x] Before and after screenshots, superficial and deep. The recording. Tests, typecheck and build.

## Deviations from the supplied component

- The demo shell (`ForearmAnatomy.tsx`) was not used. Its focus rail of 20 pills, `?? 0` fallbacks, number-key shortcuts, legend and "Selected structure" box are replaced by:
  - the page's selection bar;
  - Choose muscle;
  - `ModelMusclePanel`, which shows "—" and a reason rather than 0 for unknown values.
- The supplied `MuscleData` held numbers only. The adapter keeps its field names but makes every number nullable and adds units, the reason for each state, and `matchesWindow` for targets.
- The tracer code was removed. It was never created, and the brief rules out tracers.
- The overview target changed from the centre of the whole file to the centre of the forearm and hand it shows (see README).
- The selected mesh draws front faces only while it is drawn without the depth test.

## Verification environment, honestly stated

- The browser checks, screenshots and recording ran in **headless Chromium 141.0.7390.37** with SwiftShader software WebGL. The phone was emulated: viewport 390 × 844 (also 320, 375, 430 and 1280 for screenshots), device scale 3, `isMobile`, `hasTouch`, an iOS user agent.
- Nothing was run on an iPhone or in Safari or WebKit.
- Headless Chromium hands out queued animation frames only when something draws. The camera checks spend the drag's damping by taking screenshots until two in a row match, then compare.
- Frame rates and GPU memory on a real phone were not measured.

## Open item

- **Licence review (owner):** the model is CC-BY-SA (BodyParts3D 2.1 JP, Z-Anatomy 4.0), with share-alike. The supplied attribution note advises a legal review before commercial redistribution. Credits are shown in the app and documented here. Accepting the terms is the owner's decision.
