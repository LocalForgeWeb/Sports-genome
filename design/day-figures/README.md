# Training-day figures

The artwork Home's hero shows for the next workout: a front and a back figure side by side, the day's muscles in orange, transparent around them.

| Split | Master | Shows | Status |
|---|---|---|---|
| Push | `source/push.png` | chest, delts, triceps; no biceps | cut, in use |
| Pull | `source/pull.png` | lats, traps and mid-back, rear delts, biceps | awaiting artwork |
| Legs | `source/legs.png` | quads, glutes, hamstrings, calves | awaiting artwork |
| Upper | `source/upper.png` | chest, shoulders, arms, upper back, abs | awaiting artwork |
| Sport Transfer | `source/sport-transfer.png` | obliques and core, hips, glutes, posterior chain, shoulder stabilisation | awaiting artwork |

Lower and Full Body days have no artwork of their own and keep the planned-focus schematic.

## Adding a day

1. Save the PNG as `source/<split>.png` (transparent background; the supplied Push file is the reference).
2. `python3 design/day-figures/build.py --preview` writes `client/public/day-figures/<split>.webp` (720 px) and `<split>-360.webp`, and prints the sizes.
3. Add the day to `dayFigures` in `client/src/lib/dayFigures.ts` with those sizes. `dayFigures.test.ts` checks the file exists and the sizes match.

Until a day's file is cut, Home draws that day's planned-focus schematic; it never shows another day's figure.
