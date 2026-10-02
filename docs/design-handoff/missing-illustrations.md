# Illustrations the handoff draws that this build does not have

The implementation handoff (§6.2) asks that a reference illustration with no
production asset be recorded, with its role and size, rather than substituted
with a placeholder or an unrelated image. This is that record. Each slot is
laid out so the page reads correctly without it; supplying the asset is a
content task, not a code change, unless a row says otherwise.

Brand assets exist (the twelve in `client/public/brand/`). No exercise,
equipment or anatomy-thumbnail illustration exists in the repository or the
Supabase storage the app reads, so every row below is currently empty.

| Screen | Slot | Role | Reference size (390pt phone) | How the build renders without it |
| --- | --- | --- | --- | --- |
| 08 Session (prestart) | Beside the hero, right of the day name, week/day line, counts and Start | Equipment/technique visual for the day's dominant movement (the reference shows a lat pulldown for a Pull day) | ~180 × 200pt, right-aligned, bleeding to the page edge | Hero runs full width; no placeholder box |
| 08 Session (prestart) | Left of each exercise row, after the index | Exercise thumbnail, muscles highlighted | ~96 × 72pt per row | Row is index · name/prescription · chevron |
| 09 Matches | Right of the movement-context block | Sport-action silhouette for the selected action | ~200 × 150pt | Context block runs full width |
| 09 Matches | Left of each match row, after the rank | Exercise thumbnail | ~96 × 72pt per row | Row is rank · name/why · score · grade · add |
| 03 Body Lab | Left of each muscle-role row | Muscle close-up thumbnail | ~72 × 72pt per row | Row is name/functions · role · chevron |
| 03 Body Lab | Anatomy figure | Front and back figure, roles painted per muscle | full width, ~300pt tall | Drawn from the existing SVG geometry in `AnatomyFigure` — this slot is not missing, it is vector |
| 07 Review | Session preparation rows | Drill thumbnails (scapular pull-up, band pull-apart, thoracic rotation in the reference) | ~96 × 72pt per row | Drill rows are text |
| 04 Catalog | Left of each exercise card | Exercise thumbnail | ~120 × 100pt | Card is text with grade and actions |
| 05 Exercise Intelligence | Hero | Exercise hero with primary/supporting muscles painted | full width, ~260pt tall | Existing `AnatomyMap` figure stands in — vector, not a bitmap |
| 01 Home | Right of the next-session hero | Stacked-plates visual for the session | ~150 × 150pt, right-aligned | Hero runs full width; the day name, position, count and the two actions carry it |
| 02 Movement Atlas | Between the sport selects and the selected action | Sport-action figure for the selected action (a sprint start in the reference) | full width, ~200pt tall | The selected action's name, family and stepper sit directly under the selects |
| 06 Plan | Left of each prescription row | Exercise thumbnail | ~96 × 72pt per row | Row is index · name/prescription · order controls |
| 10 Progress | — | The handoff supplies no `10-Progress.png`; the screen is built from §10's text alone | — | No illustration slot is defined; facts, records and the trend are typographic |
| 11 Strength Genome | Anatomy figure, ranked | Front and back figure painted per region by rank, unscored regions hatched | full width, ~400pt tall | Drawn from `AnatomyFigure` in rank encoding — vector, not a bitmap |
| 11 Strength Genome | Left of each region row | Region thumbnail with the region painted in its rank colour | ~52 × 52pt per row | Drawn by `RegionThumb` from the same geometry — vector, not a bitmap |
| 12 Profile | Beside the name | Anatomical portrait | ~88 × 88pt circle | The handoff calls the portrait a placeholder treatment, so the existing neutral identity icon sits in the circle |

When an asset set arrives, the slots are: `session-prestart-hero` (a second
grid column), `session-prestart-row` (a leading figure), and the row layouts
named per screen above.
