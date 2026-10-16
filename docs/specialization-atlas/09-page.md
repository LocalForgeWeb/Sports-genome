# Specialization atlas: the page (16 Oct 2026)

Body Lab → **Specialize** is the forearm page the brief asks for (§6). This note records what was built, where, and the choices made inside the design (`02-design.md` §7–§8, §12).

## Where it lives

| Piece | File |
|---|---|
| Page | `client/src/components/specialization/SpecializationPanel.tsx` (lazy chunk) |
| Muscle sheet | `MuscleSheet.tsx`, with `TargetsEditor.tsx` and `ActionGlyph.tsx` |
| Add or swap sheet | `PlanChangeSheet.tsx` |
| Progress (measurements) | `MeasurementsPanel.tsx` |
| Sheet shell | `SpecializationSheet.tsx` |
| What the page says about a summary | `model.ts` (pure) |
| Drawing | `SpecializationDiagram.tsx` (renderer contract, `02-design.md` §12) |
| Styles | `specialization.css` |
| URL state, plan-change contract | `client/src/lib/specialization/viewState.ts`, `planChange.ts` |
| Home wiring | `client/src/pages/Home.tsx` (workspace `specialization`) |

Home imports only `shared/specialization/regionIndex.ts` (the region's name, map keys and entry label), so the anatomy, mappings and calculator load with the page's own chunk and not with Home.

## Ways in, and Back

- The Body Lab tab row: Movements · Muscles · Exercises · **Specialize**. The bottom dock stays at four.
- Muscles (the body map): selecting the forearm (`forearms` or `brachioradialis` key) adds **Explore forearm coverage** under the map's next steps. A key that names exactly one muscle (`brachioradialis`) opens the page with that muscle selected (`nodeForBodyMapKey` on the region).
- Review → Week → a forearm muscle's detail: **Explore forearm coverage**, which opens the page in **Planned** mode on the week Review is reading (`mode=planned&pweek=N`).
- Search: **Forearm specialization** (terms include forearm, grip, wrist, brachioradialis, specialize).

An entry point that names where it was pressed gets **Back to <that page>** at the top of the page. The origin rides in `history.state`, so it survives a reload or iOS restoring the app, and tapping the active tab again keeps it. The tab, the dock and search are not "opened from" anywhere and get no Back.

## Address

`?workspace=specialization&region=forearm` plus, only when they differ from the defaults: `node`, `limb` (left), `window` (`7d`, `custom` with `from`/`to`), `mode` (planned), `view`, `layer`, `map` (target), `pweek`. Entering the page pushes a history entry; changes on the page replace it. Every other page strips these parameters, and a hand-edited value that does not validate is dropped from the address on load; the page also drops a muscle the region does not have and a plan week that is not built (tested in `Home.specialization.test.ts` and `SpecializationPanel.render.test.ts`).

## Layout, phone first (390 × 844; checked at 375 and 320, no horizontal overflow)

1. Eyebrow, heading, one line on what is counted.
2. Controls in wrapping rows: Completed · Planned; Left arm · Right arm; This week · Rolling 7 days · Custom (two date fields), or the plan weeks in Planned mode. Then the window as words ("This week · 12–18 Oct · right arm") and, for this week, the pair design §4 asks for: "This week, right arm, for the forearms: 7 bouts logged · 9 planned in Plan Week 1, as written." The muscle sheet says the same for its muscle.
3. Muscle map card: Volume · Target, the view (Palm · Back · Thumb side) and layer (Surface · Middle · Deep, only those the drawing has for that view), the drawing, and its key.
4. The selected muscle: name, layer, one sentence, its targets, and one action: **Inspect coverage**, or **Add targeted exercise** when it has a reviewed mapping and no work in the window, which opens the add sheet on the best reviewed candidate (or the muscle's exercises when there is none). With nothing selected, the region's distinct bouts on that arm.
5. The muscle list, most direct work first, in three groups (the region's muscles; nearby; upper-arm muscles credited here). Each row: name, abbreviation, a Deep/Middle badge, the non-zero parts in words, and one stacked bar on a fixed scale (full at 20 bouts; more keeps its number). A row opens the muscle sheet.
6. Coverage to review: three findings, then "Show N more".
7. Disclosures: Exercises in this window (bouts per day for any completed window up to 31 days; "Same muscle, same workout" when two exercises load one muscle directly in one session, in plain words; and the athlete's own notes on those workouts), Targets, Progress (kept mounted once opened, so a half-filled reading survives), How this is counted.

## Choices made inside the design

- **What the map paints.** Volume mode paints *direct work bouts*: bouts in which the muscle is the target, a direct dynamic set or a deliberate hold, each counted once (a mixed bout counts when one of its parts is direct). Holds are bouts here, never seconds turned into sets. Contributing and incidental work stays off the map and on the list and ledger, so grip during rows does not light up the finger flexors as if trained. The key says this in words.
- **Bins.** Fixed: 0 · 1–2 · 3–5 · 6–9 · 10–14 · 15+, on `--sg-exposure-1..5`, never rescaled to the busiest muscle. Zero is a dashed resting fill ("Mapped, no direct work"); no reviewed mapping is hatched ("Mapping not reviewed"). Target mode: under 25 % · 25–49 % · 50–74 % · 75–99 % · 100 % and over, from the athlete's own targets; a muscle without one is unpainted ("Not targeted"), and with several targets the furthest behind decides the step.
- **Findings, in order:** a target the athlete set and is behind on; sets with no arm; work tagged with the region but not mapped to a muscle; a mapping under review; muscles with no reviewed mapping ("missing mapping, not missing training"); a difference of two or more direct bouts between the arms, stated in numbers ("Two-handed sets count for both arms; only one-arm sets make the arms differ"); strapped sets that earned no grip credit. Nothing is scored, and nothing suggests work only to fill a muscle.
- **What is suggested.** Each suggestion has **Not for me**, which leaves that exercise out (with Undo), and the sheet's "What is suggested" lists the equipment among the suggestions as toggles and the exercises left out, each with "Suggest again". Stored on the device under the account's key (`lib/specialization/exclusions.ts`) and passed to the recommender.
- **Hold time not recorded.** A hold logged before the logger kept seconds reads "time not recorded", not "0 s".
- **Targets.** "Both arms" saves two targets, one per arm. Removing one shows Undo in place. The editor says a target is intent, not a proven threshold, and that numbers above 15 are fine.
- **Add or swap.** The exercise (the muscle's candidates, with equipment and "already in this plan week"), the week, the day, Add or Swap (the day's exercises, with which already load the muscle), then planned totals before → after for every muscle that changes, the selected one first, plus the region's distinct bouts. Save hands Home `{ week, dayKey, slotIndex, catalogExerciseId, replaceEntryId? }`; Home applies the same pure edit (`applyPlanChangeToRecord`), refuses with a reason (plan loading, week not built, already in that day, the swap target gone), and shows a toast with Undo that takes back that one change wherever the day now lives. The page stays where it was.
- **Progress.** Circumference and dynamometer grip by arm, with landmark, distance, posture, pumped or not, device and the time of day. Grip is entered in kg on the dynamometer and stored in newtons; it has its own chart and never shares a scale with exercise load. Weekly region bouts, circumference and grip are separate charts on one time axis, with a line that a change beside training does not show training caused it.
- **Access.** Every control is at least 44 px; inputs are 16 px; the sheet takes focus on its heading, keeps Tab inside, closes on Escape or the scrim and returns focus; the selected muscle and changed totals are announced in a polite live region; motion uses the grammar tokens and stops under reduced motion.

## Tests

- `client/src/components/specialization/specializationModel.test.ts`: bins, fills, direct work, sentences, segments, list order, ledger grouping, findings and their wording.
- `client/src/components/specialization/SpecializationPanel.render.test.ts`: the list's numbers (bilateral sets are 3 per arm, not 6), the sheet's section order, Not targeted, both-arm targets saved as two, the add previewed and handed over as one exact day, a refusal kept on screen, arm and mode switching, planned mode reading the plan as written.
- `client/src/pages/Home.specialization.test.ts`: the tab, the address (kept, validated, stripped elsewhere, restored on Back), an add written into the named day with Undo taking back that one change, and Review's link opening planned mode on its week with Back to Review.
