# Body Lab anatomy

Source of truth for the Body Lab figure. Muscles are authored as anchor points
and converted to smooth cubic Béziers by `geometry.mjs`, so anatomical contours
come from a handful of landmarks rather than hundreds of hand-placed control
points, and bilateral symmetry is structural: one side is authored, the other is
mirrored about the midline.

| file | what it is |
|---|---|
| `geometry.mjs` | Catmull-Rom curve builder, mirroring, the shared 232×560 canvas |
| `front.mjs` / `back.mjs` | anchor data, one entry per region |
| `build.mjs` | emits `out/body_front.svg` and `out/body_back.svg` |
| `figma-script.mjs` | emits the `use_figma` payload that rebuilds the figure in Figma from the same anchors |
| `qc.mjs` | unique IDs, bilateral symmetry, canonical-key coverage, no invented keys |
| `preview.mjs` | renders both views to `out/preview.png` for visual review |

```
node build.mjs && node qc.mjs && node preview.mjs
```

## Region naming

```
muscle__<catalogKey>[__<part>]__<side>
base__<id>[__<side>]
```

`catalogKey` is a canonical Sports Genome exercise-catalog muscle key — the same
vocabulary the 400-exercise catalog and `catalogMuscleRegionIds` use. `part` is a
visual subdivision only; several paths may share one key and nothing downstream
needs to know a part name. `side` is the **subject's** anatomical side, not the
image side, so a given limb keeps its name across both views.

`base__*` is structural body and is never selectable. `base__clip` masks the
regions group to the body outline, which is what makes adjacent muscles share a
border instead of floating as separate plates.

Fills are neutral. Role colour, selection and hover are applied by the app from
Body Lab data at runtime.

## Figma

<https://www.figma.com/design/FpmnqIn4u6mn4XvgAqyymG> — regenerated from these
anchors via `figma-script.mjs`, so the Figma file and the production SVG cannot
drift apart.
