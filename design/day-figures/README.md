# Training-day figures

The artwork Home's hero shows for the next workout: a front and a back figure side by side, the day's muscles in orange, transparent around them.

| Split | Master | Shows | Status |
|---|---|---|---|
| Push | `source/push.png` | chest, delts, triceps; no biceps | supplied, in use |
| Pull | derived | lats, traps and mid-back, rear delts, biceps | in use |
| Legs | derived | quads, glutes, hamstrings, calves | in use |
| Upper | derived | chest, shoulders, arms, upper back, abs | in use |
| Sport Transfer | derived | obliques and core, hips, glutes, posterior chain, shoulder stabilisation | in use |
| Full Body | derived | chest, back, shoulders, arms, core, legs (every listed muscle but the forearms) | in use |
| Lower | Legs' figure | quads, glutes, hamstrings, calves | in use |

## Derived figures

Only Push was supplied. Every other day is the Push master itself with that day's muscle panels painted orange instead (`derive.py`), so all the figures are one drawing in one style. Nothing is generated or traced from anywhere else.

1. **Panels.** The master's outlines split it into muscle panels. Hairline gaps where two strokes nearly meet are closed first, and orange and navy panels are kept apart.
2. **Muscles.** `MUSCLES` in `derive.py` names each muscle by points on the master that fall inside its panels. `DAYS` lists each day's muscles, taken from the words in `client/src/lib/dayFigures.ts`. If the master changes so that a point lands outside a panel, the script stops.
3. **Blank figure.** Push's orange panels are repainted in the navy's own shading.
4. **A day.** That day's panels are painted orange:
   - A panel Push already paints keeps the supplied pixels exactly.
   - Any other panel is shaded the way the supplied orange is: lightest in the middle and towards the top, darker at the lower edge, with fine fibre streaks along its long axis. It takes the supplied orange's own colours.
   - Outlines and shadows stay as drawn.

Exceptions:
- The back forearm has no line at the wrist, so its paint stops at the wrist.
- Lower trains the Legs muscles (`client/src/lib/splitStackAnalysis.ts`), so Home shows it the Legs figure rather than a copy.

## Building

`python3 design/day-figures/build.py --preview <lineup.png>` builds every split:
- **Supplied master:** the file in `source/`.
- **No supplied master:** the figure `derive.py` draws.

For each split it writes `client/public/day-figures/<split>.webp` (720 px) and `<split>-360.webp`, prints the sizes, and writes a lineup on navy and on paper for inspection. `dayFigures.test.ts` checks every file exists and that the sizes match. Push's files come out byte-identical. To check the mapping by eye, `python3 design/day-figures/derive.py <dir>` writes each master, the blank figure, and a map of every named muscle's panels.

## Replacing a figure

Save the supplied PNG as `source/<split>.png` (transparent background, same layout as `push.png`) and rebuild. A supplied master always replaces the derived one. Update the size in `client/src/lib/dayFigures.ts` if it changed.
