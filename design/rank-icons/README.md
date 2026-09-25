# Rank icons

The approved strength-rank badges, one per capability rank in `shared/capabilityRank.ts`.
This folder holds the masters; `client/public/rank-icons/` holds what the app serves.

## Mapping

Assigned by what the artwork is, never by the order it was supplied in.

| Rank id       | Name        | Percentile  | Map colour | Master                    | Approved artwork                                                                                     |
|---------------|-------------|-------------|------------|---------------------------|------------------------------------------------------------------------------------------------------|
| `prospect`    | Prospect    | 0 ≤ p < 20  | `#8290A3`  | `source/prospect.png`     | Slate-gray open angular gate around a triangular centre                                              |
| `jv`          | JV          | 20 ≤ p < 40 | `#38B879`  | `source/jv.png`           | One uninterrupted faceted emerald, silver border, small side accents; no internal metal chevron bars |
| `varsity`     | Varsity     | 40 ≤ p < 60 | `#397FE7`  | `source/varsity.png`      | One uninterrupted faceted blue gem, silver border, layered side accents; no internal chevron bars    |
| `regional`    | Regional    | 60 ≤ p < 80 | `#B385E5`  | `source/regional.png`     | Elongated purple gem, silver V frame, one shorter wing per side                                      |
| `state`       | State       | 80 ≤ p < 95 | `#DCAF3C`  | `source/state.png`        | Gold central summit, three-point crown, two upward-sweeping wing layers per side                     |
| `national`    | National    | 95 ≤ p < 99 | `#C93650`  | `source/national.png`     | Tall crimson central summit, dark metal/silver frame, multiple swept wing layers                     |
| `world_stage` | World Stage | 99 ≤ p ≤ 100| `#171B24`  | `source/world-stage.png`  | Black central gem and wings, silver edges, gold accents and orbital gate                             |

All seven were supplied on 25 September 2026 (five in a first batch, crimson and obsidian in a
second) as 1254 × 1254 RGBA PNGs with genuine transparency (corner alpha 0; visible pixels at
alpha 250–255). The green and blue badges are the final versions with no stacked chevron bars
across the centre; purple is the one-pair-wing revision and gold the stronger crowned revision.
World Stage's black gem and wings are artwork, not background, and the build never strips
black: transparency comes from the alpha channel alone.

A rank whose `iconSrc` in the rank table is `null` draws the emblem from
`client/src/lib/rankEmblems.ts` instead. To supply or replace a badge: save the master as
`source/<rank>.png` (rank id with `_` written as `-`), run the build, and point that rank's
`iconSrc` at `/rank-icons/<rank>.webp`. The test in `client/src/lib/rankIcons.test.ts` checks
that every path names files that exist and carry alpha.

## Masters

`source/*.png` are the supplied files byte for byte, renamed. They are the record of what was
approved: never regenerate, trace, recolour, filter or crop them in place.

## Runtime files

    python3 design/rank-icons/build.py            # needs Pillow and numpy
    python3 design/rank-icons/build.py --preview  # also writes a lineup on navy for inspection

For each master the script crops to the visible bounds, scales so every badge shows the same
visible area (with no wing or crown tip closer than 4% to an edge), centres it on a transparent
square, and writes two lossy WebPs with full-quality alpha: `<rank>.webp` at 384 px and
`<rank>-128.webp` at 128 px. Resampling runs on premultiplied alpha, so edges keep their
antialiasing without dark fringes, and nothing is ever stretched to fill the square.

The React component `client/src/components/RankIcon.tsx` renders them with a `srcset`, so a
32 px row on a 3× phone fetches the 128 and a 64 px card the 384. No CSS tint, grayscale,
hue rotation, opacity or filter is applied to them; confidence and provisional status are said
in words beside the badge, never by fading it.
