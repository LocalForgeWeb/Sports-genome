# Oct 2 readability, search, sharing and export repair: record

This records the repair made for the "UI readability + search + sharing/export repair" brief.

- **Branch:** `claude/vigilant-galileo-u91fr3`.
- **Base:** `main` at 6480a25.
- **Screenshots this brief referred to:** they did not reach this session, so every defect was reproduced in the current app first.
- **Seed data:** the brief's own example, Wrestling · Athleticism, Week 1 · Day 02 · Pull with 8 exercises ("4 × 3–6 · RPE 7 · 90 sec").
- **Images:** Chromium at 390×844 (DPR 2) unless a file name says otherwise.
- **Blocked in this sandbox:** the Supabase-hosted photos, logo and display font. Where the logo matters, a stand-in was used and is labelled.

## 1. Shared causes

### Readability
Opacity was not the cause. On every unreadable screen, opacity measured 1 from the text all the way up to `<html>`, with no filter or blend mode in between. The text had been **repainted**: a component built as a light surface was placed on a dark sheet, and the sheet converted it with descendant colour rules that moved some of its paint and not the rest. Contrast was measured from rendered pixels, comparing each text box with and without its text, so overlays and opacity are included.

| Where | What happened | Measured |
|---|---|---|
| Term explanation ("Hypertrophy potential") | The white card renders inside `.genome-panel`. The sheet's `.exercise-intelligence .genome-panel :is(h4, strong, p, span …)` gave it near-white and pale-blue ink. The same pattern under `[data-theme="dark"]` did the same in dark mode. | 1.04:1 heading, 1.48:1 body |
| Muscle Genome rows | The rows were made transparent for the dark sheet, but the stack behind them kept its light `#d8e3ef` divider ground. | 1.14:1 |
| Grade stamps (B, C …) | A stamp is a `<span>`, so the same rule repainted its letter. Tailwind v4 puts colour utilities in a cascade layer that any unlayered rule outranks, so the stamp's own class could not win. | pale on light |
| Add Exercises | A light sheet repainted dark later from `index.css`. Its light ink survived wherever the old rule was more specific (`workout-planner.css` is `@import`ed first). The "light surfaces own their text colour" list kept giving its rows navy ink and light-surface label tokens. | 1.0–3.5:1 |
| Analysis overlay, Review, catalog, Home tag, locked week | The analysis overlay renders at body level, outside the dark scopes, so its labels fell back to light-surface ink. Review had a later light rule of equal specificity. Catalog row metadata sat on the gradient's brightest part. The "Next" tag is small white type on brand orange. The locked week used the app-wide `button:disabled { opacity: .5 }`. | 2.4–4.4:1 |

### Search double border
The wrapper turned its border gold on focus. A contextual rule, `.catalog-discovery :is(input):focus-visible` (specificity 0,2,1), then outlined the input 2px outside itself, which beat the input's own `outline: none` (0,1,1). Add Exercises put the global 3px blue `input:focus-visible` ring inside a square label border. The Movement explorer's search had the same pattern.

### Share and PDF
The app had no share feature. The only way out was **Print sheet** (`window.print()` over the live page). Its print CSS hid the app with `visibility: hidden`, which keeps the full height of everything hidden. As a result:

- the dark app's length printed as empty navy pages;
- the page's dark ground printed with backgrounds on;
- the browser added its own URL, timestamp and "Page n of N".

Reproduced in Chromium: 2 pages, the second a navy rectangle; the reported Safari copy had 5. Anything sent to Messages was whatever the OS made of that page.

## 2. What changed

**Surface contract (`client/src/surfaces.css`, loaded after `index.css`):**
- A surface that paints a background declares its text colour together with `--sg-label-color` and `--sg-link-color`. The classes are `sg-surface-dark` and `sg-surface-light`.
- Light-default components inside a dark surface follow its ink.
- Modal layers render at `<body>`: the term explanation (`createPortal`), the share sheet, and the browser-print sheet. Nothing in the page they cover can reach them.
- The Muscle Genome stack gets dividers. Grade stamps set their letter's ink inline; D and F were also lifted to at least 4.5:1.
- The share sheet slides in and never fades. A modal's surface and text are opaque from the first frame.

**Term card.** The brief's hierarchy:
- an eyebrow, "GENOME TERM EXPLAINED", in blue;
- a large navy heading;
- labels set apart by weight (navy, 800) over body text at 16px in `#355774` (7.4:1 on white);
- an orange-bordered boundary note in dark red on a tint;
- a Close button that stays pinned while the card scrolls.

**One search field (`components/SearchField.tsx`, `search-field.css`):**
- The label is the control. It owns the ground, border, 12px radius and the single focus treatment: on `:focus-within` the border turns blue (`#5aa9ff`, 6.1:1) with a soft 3px halo.
- The input draws no border, outline or shadow, using a three-class selector that outranks every contextual focus rule.
- Text is 16px, so iOS Safari does not zoom. Safari's native search decoration is off. Forced-colours mode keeps a real outline.
- Used by the catalog, Add Exercises and the Movement explorer. The universal search sheet keeps its own pattern: a light sheet header with one control and no box.

**Add Exercises (`add-exercises.css`, one place):**
- The order follows the brief: title, Short in this day, search, Muscles and Equipment side by side, the Pull fit | All catalog switch, count, rows, Done.
- Deficit chips are compact: the muscle name plus "−60" in the deficit colour on a soft dark ground with a thin outline. Screen readers hear "Latissimus dorsi, 60 pts under target".
- Add buttons are whole, at least 44px tall. "Added" shows as a state, not a faded control.
- A visual-viewport keyboard inset lifts the sheet above the iOS keyboard and returns it to full height when the keyboard closes.
- The filters stack below 360px.

**Share (`components/WorkoutShareSheet.tsx`, `lib/workoutShare.ts`).** One **Share** button beside Reorder on the Training Day opens a sheet. Before anything is sent, it shows the PDF's first page in miniature, the file name and the exact note. It offers:
- **Share workout:** the system share sheet with the PDF attached and the note "Week 1 · Pull — Sports Genome / 8 exercises · Wrestling · Athleticism / Full workout attached." The workout itself is never written into the message. The PDF is prepared as the sheet opens, so the tap reaches `navigator.share` with nothing awaited in between, as Safari's user-gesture rule requires.
- **Save PDF**.
- **Copy workout summary:** the plain text from §14.

Behaviour around the sheet:
- Cancelling the system sheet is silent and changes nothing.
- A browser that cannot attach files to a share saves the PDF instead and says so.
- Nothing about the account travels: the export holds only the day, sport, goal and exercises.

**The PDF (`lib/pdf/pdfWriter.ts`, `lib/workoutPdf.ts`):**
- **How it's made:** a small deterministic PDF 1.4 writer (standard Helvetica faces, WinAnsi text, JPEG logo), so no dependency, no screenshot and no browser printing. The same plan always gives the same bytes.
- **Theme:** light, on US Letter.
- **First page:** the logo, "SPORTS GENOME / TRAINING PLAN", the day in large type, then sport, goal and exercise count.
- **Exercise blocks:** one block per exercise with its number, name, movement and muscles; Sets × Reps, Effort and Rest; a line per set to fill in (per-set targets and timed rounds included); and any coach note. A block never splits across pages.
- **Footer and metadata:** our own footer on every page (brand, "Week 1 · Pull · Generated Oct 2, 2026", "Page n of N"). The title metadata is "Sports Genome · Week 1 · Pull" and the file name "Sports Genome - Week 1 Pull.pdf".
- **Notes area:** a session-notes area appears only where the last page has room.
- **Source of values:** everything comes from `lib/workoutExport.ts`, built from the same expressions the Plan rows print.

**Browser printing (Cmd/Ctrl+P):**
- The print sheet renders at `<body>`, and print CSS removes the app with `display: none`. The ground is white.
- The ruled notes box that took a page of its own is gone.
- 8 exercises now print on one page.

**Not built: shareable web link / Open Graph preview (§13).** The app has no server-side store for shared plans. A real `/share/workout/[token]` page needs a new table, a migration and a preview-image renderer. The brief makes this optional and conditional on the existing architecture, so it is left for an owner decision. The share sheet therefore offers no "Copy link".

## 3. Acceptance results (§17)

`acceptance.mjs` ran against the built app at **320, 375, 390, 430 and 1280 px**, and at **320 px with 125% text**. All 27 checks passed at every size. The checks were:

- Muscle Genome and the term dialog read with no contrast failures, including the note at the bottom of the scrolled card.
- The dialog is opaque, on top and rendered at `<body>`, and its Close stays visible.
- The catalog search shows exactly one focus treatment, both when tapped and when reached with Tab. Typing "curl" filters to curls.
- Add Exercises:
  - shows its deficit chips at consistent heights, with one focus treatment on search;
  - the Cable equipment filter narrows the list, and Pull fit and All catalog switch the count;
  - Add is at least 44px, and adding moves the footer from "2 in Week 1 · Pull" to "3 in…";
  - the last row ends above Done, the Close button is visible, and Done closes the sheet with the day showing three exercises.
- The Share button is visible. The share sheet fits the viewport and reads cleanly.
- There is no horizontal overflow anywhere.

`share-test.mjs` covered the share flow with a stand-in for the system share sheet:

- `navigator.share` received one file, `Sports Genome - Week 1 Pull.pdf` (`application/pdf`), and the three-line note.
- A dismissed share left the plan byte-for-byte unchanged.
- Save PDF downloaded the same name.
- Copy produced the §14 text.
- Escape returned focus to Share.

**PDF.** Rendered with pdf.js:

| Case | Pages |
|---|---|
| 1 exercise | 1 |
| 8 exercises | 2 (5 + 3) |
| 20 exercises | 4 |
| 3-exercise day with timed, per-set and noted exercises | 1 |

On every page:
- each page holds exercises;
- no exercise splits across a page;
- no browser URL or timestamp appears;
- long names wrap inside their column;
- long prescriptions shrink, then wrap, inside theirs.

**Contrast sweep.** Rendered pixels on 21 screens and overlays, light and dark themes:

| | Light | Dark |
|---|---|---|
| Before | 65 failures | 70 failures |
| After | 4 flags | 4 flags |

The 4 remaining flags are:
- the intentionally disabled "Week 3 · Locked", now 3.5:1 (disabled controls are exempt, and it still reads);
- two probe artifacts on About me, where the text was confirmed readable on screen.

**Tests:**
- `tsc` is clean and the build passes.
- vitest: 2,813 passed, 1 skipped, 5 failed. All five need the Supabase network, which this sandbox refuses; they fail the same way on `main`.
- New tests:
  - `workoutExport.test.ts`: the rows' values, file name, the ≤3-line note, the summary format;
  - `workoutPdf.test.ts`: xref validity, metadata, page counts, no split blocks, order, footer, no browser artifacts, wrapping, encoding;
  - `WorkoutShareSheet.test.ts`: the preview, share data, cancel, the save fallback, copy, Escape, the modal layer;
  - `surfaces.styles.test.ts`: the contract, the portal, stamp ink ≥4.5:1, one focus treatment, the print CSS, the keyboard inset.
- The three Add Exercises tests that pinned the old light sheet were rewritten to hold the dark design. The print-button test now checks Share.

## 4. Not verified here

- **A real iPhone.** Only Chromium mobile emulation was used. Still to check on a device:
  - the native iOS share sheet and how Messages shows the PDF;
  - Safari's file-share support (`navigator.canShare({ files })`);
  - the on-screen keyboard inset;
  - the bottom safe area on a notched phone;
  - Safari's own input styling.
- **The real logo in the PDF.** The Supabase-hosted logo cannot be fetched from this sandbox. The embedding pipeline was verified with a stand-in PNG that has transparency (`pdf-after-p1-with-standin-logo.jpg`). In the app, if the logo cannot be loaded within 2.5 s, the PDF uses the wordmark alone.
- **Hardware-keyboard focus on iPad.** It was verified with Tab in desktop Chromium.

## Evidence (`evidence/`)

| | Before | After |
|---|---|---|
| Term explanation | `term-dialog-390-before.jpg` | `term-dialog-390-after.jpg` |
| Muscle Genome | `muscle-genome-390-before.jpg` | `muscle-genome-390-after.jpg` |
| Catalog search, focused | `catalog-search-focused-before.jpg` (gold border plus gold outline) | `catalog-search-focused-after.jpg` (one blue focus) |
| Add Exercises, search focused | `add-exercises-search-focused-390-before.jpg` | `add-exercises-search-focused-390-after.jpg`, `add-exercises-320-after.jpg`, `add-exercises-list-end-390-after.jpg` |
| Share | (none: there was no Share) | `plan-actions-390-after.jpg`, `share-sheet-390-after.jpg` |
| PDF | `pdf-before-p1.jpg`, `pdf-before-p2.jpg` (the printed page) | `pdf-after-p1.jpg`, `pdf-after-p2.jpg`, `pdf-after-p1-with-standin-logo.jpg`, `sample-Sports-Genome-Week-1-Pull.pdf` |
| Browser print | the same as the PDF before | `browser-print-after-p1.jpg` |
