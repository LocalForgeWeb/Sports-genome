# Walkthrough correction — implementation record

Brief: `docs/ux-walkthrough/brief.md` (annotated item by item). Source: the September 27, 2026 iPhone walkthrough. The recording itself was not supplied with the brief; the times and symptoms quoted there were taken as given and each cause was established in the code and the built app.

Branch: `full-merge` locally, pushed to `main` (Vercel) and `claude/repo-access-il8zy5`. Build: the commit this file ships with — typecheck clean, `npx vite build` clean, `npx vitest run` 1926 passed / 1 skipped / 5 failed after merging main (the pre-existing `server/supabase*` credential tests, unchanged); journeys 18/18 and the launch probe 10/10 re-run on the merged build. Every check below ran in headless Chromium at 390×844 against the built app: browser emulation, not a physical iPhone and not the installed PWA. `env(safe-area-inset-*)` is 0 in that browser, so the safe-area work is verified structurally (the backdrop exists, is fixed and is solid once scrolled), not against a notch.

## Confirmed causes, in plain language

- **V02 — Home appearing through the animation.** A returning launch (the `sports-genome-launched-before-v1` flag set) never played the video at all: `client/index.html` excluded it from `wantsVideo`, held a static logo for 620 ms and lifted. What the recording shows at 13.8 s is that short static hold cross-fading into Home. The video now plays on every launch the preference allows, ends by its own `ended` event (or media failure, or the 4 s ceiling if it never starts), and **Skip intro** is a 44 px button from 1.6 s. Application readiness never ends playback (`BootSplashLifecycle` waits for the video to settle); a skip finishes once and later callbacks are ignored.
- **V04/V05 — long preview hold and the broken exit.** "Preview intro video" wrote a replay flag and **reloaded the document**, so the whole boot ran again (a second launch), and the browser's scroll restoration put About Me back at its old offset under a screen that was still being built — the blank upper region. The preview is now `IntroPreview`, a surface over About Me: same media, same composition as the boot screen, Close and Escape at any moment, the clip's natural end closes it after a 700 ms beat, and nothing reloads. The final hold in the recording cannot be attributed further from here: the intro file on Supabase storage is blocked by this environment's network policy, so its own tail was not measured (see *Unverified*).
- **V03 — "Build training around your goals" before the real workout.** The plan store starts empty and hydrates in an effect; Home rendered the empty-plan copy in that window. `TodayActionPanel` now takes `planReady` and shows a layout-stable loading module until the store and profile have hydrated; "Create your plan" appears only after an empty plan is confirmed.
- **V01 — black gap on the older app.** Outside the app's control on an installed iOS web app: iOS shows a black canvas until the first paint unless `apple-touch-startup-image` links are present. Ten navy launch images now cover current iPhone sizes; the manifest background and the document background were already navy. Not verifiable here (see *Unverified*).
- **U05 — analysis in a small inset scroller.** `.rate-stack-panel` carried a retained `transform` from the surface entrance animation (`sg-surface-rise … both`). A transformed ancestor becomes the containing block of any `position: fixed` descendant, so the full-height analysis drew as a 337×395 px box inside the panel (`probes/transform-src.mjs` found the rule). The analysis is now rendered through a portal at `document.body`, and the entrance animation fills `backwards` so no panel retains a transform.
- **U01 — content in the status area.** The brand row scrolls away with the page, and nothing solid sat under the status bar. A fixed `.status-backdrop` (height `env(safe-area-inset-top)`) becomes solid once the page is scrolled; the local tabs stick at the inset.
- **U02 — translucent feedback.** The notice surface used the theme's translucent glass. It is now solid (`--sg-surface-raised`, no backdrop filter), sits above the bottom navigation and the "Adding to…" strip, and repeated adds/favourites replace one notice rather than stacking (ids `plan-add`, `favorite`).
- **U03/U04 — white picker, detail behind it.** The picker sheet, its controls and its result rows were the light panel's styles inside the dark app; the exercise detail opened at a lower layer than the sheet's scrim. The sheet, inputs, selects and rows now use the dark surface tokens (rows on one surface with separators, not boxes); the detail (95) and compare (96) sit above the analysis (80) and the picker (70).
- **D01 — red "On record" then rank colours.** The coverage map painted recorded regions with the exercise atlas's red "primary role" and, while ranks were pending, the same red. Coverage now has its own blue, muted while ranks compute ("On record · ranking" in the legend, the notice line unchanged), region-row thumbnails follow it, and the figure's accessible names say "lifts on record" / "nothing logged yet" instead of "primary role". Rank colours, thresholds and names are untouched.
- **D02 — 11 vs 15 points.** The summary computed coverage from `analyzeSplitStack(...).ratings`; the analysis page recomputed it from each muscle's involvement. Same quantity, two computations. The page now receives the same ratings, and both surfaces name the same number (35 in the test fixture).

## Requirement record

| Requirement | Status | Changed files/components | Verification evidence | Remaining limitation |
|---|---|---|---|---|
| V01 deliberate initial appearance | Verified (browser) / Unverified (iOS) | `client/index.html` (`apple-touch-startup-image` ×10), `client/public/launch/*.png` | markup present; navy document background from the first byte (`launch-qa.mjs` intro-off case) | iOS launch image behaviour not observed here |
| V02 launch completes; Skip | Verified | `client/index.html`, `BootSplashLifecycle.tsx`, `bootExperience.test.ts`, `launchExperience.test.ts` | `launch-qa.mjs`: cold launch plays, Skip lifts in ~20 ms; returning launch plays to `ended`; media failure reaches the app in 2.3 s; `evidence/after-launch-splash.png` | intro asset not fetchable here (stand-in clip) |
| V03 Home loading, no false empty state | Verified | `TodayActionPanel.tsx` (`planReady`), `Home.tsx`, `index.css` (`.today-action-loading`) | `launch-qa.mjs` V03 sampling: LOADING → "Sport Transfer", never "Build training…"; `walk-journeys.mjs` A1 (48 samples); `evidence/after-home-first-paint.png` | — |
| V04 preview hold | Verified (player) / Unverified (asset tail) | `IntroPreview.tsx`, `Home.tsx`, `bootExperience.ts` (`introVideoUrl`) | `walk-journeys.mjs` E2: natural end closes 700 ms after `ended`; no timer holds the surface | the file's own end-card length was not measured (network policy) |
| V05 preview clean exit | Verified | `IntroPreview.tsx` (scroll lock, `returnTo` focus), `Home.tsx` | `launch-qa.mjs` V04/V05 (scroll 500 → 500, focus back on the button, one nav, no reload); `walk-journeys.mjs` E2/E3; `evidence/before-preview-closed.png` vs `after-preview-closed.png` | — |
| U01 safe areas while scrolling | Verified (structure) | `Home.tsx` (`.status-backdrop`, `chromeScrolled`), `index.css` | `launch-qa.mjs` U01; `walk-journeys.mjs` E1 (fixed, solid at 300/900/1600) | real inset not emulated |
| U02 legible feedback | Verified | `App.tsx` (Toaster), `index.css`, `Home.tsx` (toast ids) | `launch-qa.mjs` U02 (solid `rgb(11,34,64)`, bottom above the strip); `walk-journeys.mjs` B2; `evidence/after-catalog-feedback.png` | — |
| U03 picker in the app surface | Verified | `index.css` (sheet, tools, rows, muscle select), `DayExercisePicker.tsx` (destination, footer) | `launch-qa.mjs` U03; `evidence/before-picker-sheet.png` vs `after-picker-sheet.png` | — |
| U04 detail/picker ownership | Verified | `index.css` (layers) | `launch-qa.mjs` U04 (detail on top, z 95 > scrim 70); `walk-journeys.mjs` C2 (query, results, position survive); `evidence/after-picker-detail.png` | — |
| U05 readable analysis | Verified | `StackAnalysisPage.tsx` (portal), `index.css` (entrance fill, sticky head), `RateStackPanel.tsx`/`DayExercisePicker.tsx`/`Home.tsx` (`dayLabel`) | `walk-journeys.mjs` D1: overlay 0,0,390×844, one scroll area, "Week 1 · Day 05 · Sport Transfer", Close; `probes/transform-src.mjs`; `evidence/before-analysis.png` vs `after-analysis.png` | — |
| D01 loading vs coverage vs rank | Verified | `StrengthGenomeBodyMap.tsx`, `StrengthGenomePanel.tsx`, `index.css` | `walk-journeys.mjs` D3 (mode `pending`, no red, figure height held); `evidence/before-strength-map.png` vs `after-strength-map.png` | ranked state exercised by existing unit tests, not by the probe (service stubbed) |
| D02 coverage discrepancy | Verified | `RateStackPanel.tsx` (`ratings`), `StackAnalysisPage.tsx` | `launch-qa.mjs` U05/D02; `walk-journeys.mjs` D2 (35 = 35) | — |
| U06 density | Done in part | `index.css` (picker rows as a list; fit line in sentence case), `DayExercisePicker.tsx` (duplicate invitation removed), `RateStackPanel.tsx` ("Target breakdown"), `AnatomyMap.tsx` ("View all N mapped muscles") | screenshots; `DayExercisePicker.test.ts` | catalog and plan rows keep their card framing (they carry actions and state) |
| §5 Home states | Verified | as V03 | journeys A1–A3 | — |
| §6 navigation contract | Verified | — | journeys A2 (Review → workout day matches Home), B1 (Muscles → filtered catalog, chip removable), C1–C4 (picker bound to week/day; Close returns to the plan), D1, E2 | browser Back not exercised beyond earlier `docs/ux-correction` runs |
| §7 picker footer/added state | Verified | `DayExercisePicker.tsx` | C1 "6 in Week 1 · Sport Transfer", C3 "7 … · 1 added now", Added state disabled | — |
| §8 feedback | Verified | `Home.tsx` | B2, B3, B4 (Undo reverses exactly the last add) | — |
| §9 muscles / CTA | Verified | `AnatomyMap.tsx` (clear reports up; scope wording) | B1 (CTA names the selected muscle) | — |

## Acceptance journeys (`probes/walk-journeys.mjs`, results in `evidence/journeys.json`)

18/18: A1–A3 returning user; B1–B4 muscle → exercise → plan with favourite, detail add and Undo; C1–C4 picker footer, detail return, add, day change; D1–D3 analysis surface, gap agreement, Strength loading; E1–E4 safe-area backdrop, natural end, early close, preference honoured both ways. The earlier 56-journey regression (`docs/ux-correction/probes/phaseg.mjs`) still passes 56/56, and the launch probe (`probes/launch-qa.mjs`) 10/10.

## Playback verification matrix (§4.6)

| Case | Result |
|---|---|
| Cold launch, intro enabled | plays, Skip visible, one lift, Home ready (`launch-qa` 1) |
| Warm launch | plays to `ended`, no premature dismissal (`launch-qa` 2; journeys A1) |
| Intro disabled | app opens with the splash hidden from the first frame (`launch-qa` 3) |
| Slow media load | the stand-in clip is served instantly here; the 4 s no-start ceiling in `index.html` is the fallback and was exercised only by the failure case |
| Media failure | app reachable in 2.3 s (`launch-qa` 4) |
| Skip during loading / playback | once, in ~20 ms, no later jump (`launch-qa` 1) |
| Preview from a scrolled position | composition kept, return to the same offset (journeys E2) |
| Preview natural end | closes 700 ms after `ended`, no layer left (E2) |
| Close and reopen | fresh element, `currentTime` < 1.5 s on reopen (E3) |
| Background/foreground | not exercised (no tab-visibility emulation in this run) |
| Reduced motion | static brand presentation in `index.html` unchanged; not re-run this pass |
| Small and tall portrait | 390×844 only this pass; 320/360/430 covered in `docs/ux-correction` |

## Unverified or blocked

- **iOS / installed PWA behaviour**: launch images, the status-bar inset, Dynamic Island, and the real intro file's playback were not observed on a device. Everything above is Chromium emulation.
- **Intro asset tail**: `api`/storage hosts on `supabase.co` are refused by this session's network policy, so the master file's own black lead-in and end-card length were not measured. The player adds no hold of its own beyond the 700 ms beat.
- **Ranked Strength map from a live service**: the rank endpoint was stubbed; the ranked presentation is covered by the existing unit tests only.

## Preservation

- The original logo, the intro media master and its URL are unchanged; no derived asset was produced.
- Plans, history, favourites and settings: no storage key or schema changed; the probes seed isolated `localStorage` fixtures only.
- Science: coverage targets, rank thresholds, names and involvement figures are unchanged; the only computation change is that the analysis page now reads the same ratings the summary already used.

## Remaining issues, in priority order

1. Observe a real launch and preview on an iPhone (installed and in Safari): launch image, status inset, the file's own end card.
2. Measure the intro file's tail once the storage host is reachable; if it holds a still frame for seconds, decide the editorial endpoint with the owner (the master stays).
3. The Strength region rows still say "On record" while ranks load; the map and legend say "ranking", the rows could too.
4. Density beyond the picker: the plan's exercise rows and the catalog cards keep their framing; a row treatment there is a design decision, not a defect.
5. Background/foreground during playback and reduced motion were not re-run in this pass.
