# Body Lab anatomy — artwork spec

Hand this whole file to whoever (or whatever) draws the figure.

## What is needed

One SVG containing an **anterior** and a **posterior** human muscle diagram,
athletic male, front-facing, arms slightly away from the body.

**Output raw SVG markup, not an image.** A PNG cannot be used: every muscle has
to be an independently selectable, recolourable shape, and pixels cannot be.

## Hard requirements

1. **Every muscle is its own `<path>` with an `id`.** Never merge muscles into
   one path. Never flatten to an image. No embedded raster, no `<image>`.
2. **Left and right are separate paths**, suffixed `__left` / `__right` by the
   *subject's* own side (so on a front view, `__right` is on the viewer's left).
3. **All fills neutral grey.** No colour, no gradients, no highlighting. The app
   applies role and rank colour at runtime; colour baked into the artwork cannot
   be driven by data.
4. **No text, no labels, no leader lines.** The reference image has labels only
   so the regions can be identified — they must not appear in the artwork.
5. **Both figures share one vertical scale and baseline**, so switching front to
   back does not resize or shift the athlete.
6. Non-muscle parts prefixed `base__`: `base__silhouette`, `base__head`,
   `base__hair`, `base__hand`, `base__foot`, `base__knee`, `base__elbow`.

## Style

Clean anatomical vector illustration. Defined deltoid caps, clear V-taper from
shoulders to waist, muscles that interlock along shared borders rather than
floating as separate blobs. Enough definition to read as tissue at 200px wide on
a phone; not medical-textbook density, not a bodybuilding poster.

## Muscle ids

`id` = `muscle__<key>__<side>`, or `muscle__<key>__<part>__<side>` where a part
is listed. Parts are visual subdivisions — they keep the drawing honest without
adding anything the data model has to know about.

### Anterior

| id key | part(s) | shown in reference as |
|---|---|---|
| `chest` | `clavicular`, `sternal` | Upper Chest |
| `frontDelts` | — | Anterior Deltoid |
| `sideDelts` | — | Lateral Deltoid |
| `biceps` | `long_head`, `short_head` | Biceps (long head), Biceps (short head) |
| `brachialis` | — | — |
| `brachioradialis` | — | — |
| `forearms` | `flexors` | Forearms |
| `abs` | `upper`, `mid`, `lower` | Abs |
| `obliques` | — | Obliques |
| `serratusAnterior` | — | — |
| `hipFlexors` | — | — |
| `tfl` | — | — |
| `quads` | `rectus_femoris`, `vastus_lateralis`, `vastus_medialis` | Quadriceps |
| `adductors` | — | — |
| `tibialis` | — | — |
| `peroneals` | — | — |
| `calves` | `gastrocnemius_medial` | — |
| `traps` | `upper` | Traps |
| `feet` | — | — |

### Posterior

| id key | part(s) | shown in reference as |
|---|---|---|
| `traps` | `upper`, `lower` | Traps |
| `upperBack` | `interscapular` | Mid Back (rhomboids) |
| `rearDelts` | — | Posterior Deltoid |
| `sideDelts` | — | Lateral Deltoid |
| `rotatorCuff` | — | — |
| `lats` | — | Lats |
| `lowerBack` | `erector_spinae` | Spinal Erectors (lower back) |
| `triceps` | `long_head`, `lateral_head` | Triceps (long head), Triceps (lateral head) |
| `forearms` | `extensors`, `ulnar` | Forearms |
| `obliques` | — | — |
| `glutes` | — | Glutes |
| `abductors` | — | — |
| `adductors` | `magnus` | — |
| `hamstrings` | `biceps_femoris`, `semimembranosus` | Hamstrings |
| `calves` | `gastrocnemius_medial`, `gastrocnemius_lateral` | Calves |
| `soleus` | — | — |
| `peroneals` | — | — |
| `feet` | — | — |

Example ids:

```
muscle__chest__clavicular__right
muscle__biceps__long_head__left
muscle__quads__vastus_lateralis__right
muscle__upperBack__interscapular__left
base__hand__right
```

## Why these exact keys

They are the canonical Sports Genome exercise-catalog muscle keys — the same
vocabulary the 400-exercise catalog uses, and the same one
`catalogMuscleRegionIds` routes into the 18 Strength Genome ranking regions.
Using them means the artwork binds to ranking with no translation layer and no
second taxonomy.

**Different id names are workable** — they can be mapped on the way in. What is
not workable is muscles that are not separate paths, or colour baked into fills.

## Notes for whoever wires it up

Geometry lives in `client/src/components/anatomy/figureGeometry.ts`, generated.
Replacing the paths does not touch tap resolution, accessibility, role
colouring, the Strength Genome map, or the tests — all of those key off the ids,
not the shapes.
