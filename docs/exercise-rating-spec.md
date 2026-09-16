# Exercise rating data — authoring specification

You are producing a **data file**, not code. Sports Genome already has the scoring
engine, the types, and the UI that render these numbers; every field below has a
slot waiting for it. Your job is to fill those slots with authored values that are
internally consistent across all 300 exercises.

Output one JSON file matching the schema in §3. Nothing else.

---

## 1. Why this exists

The app currently derives these ratings by pattern-matching the exercise *name*:

```js
const unilateral = /single|one.arm|split|lunge|step.up|bulgarian/.test(text);
const ballistic  = /jump|throw|clean|snatch|plyometric|explosive/.test(text);
```

That is a placeholder. It cannot tell a Bulgarian split squat from a Bulgarian
split squat *jump*, and it produces numbers that do not compare meaningfully
between exercises. You are replacing it with authored ratings.

**The single most important property of your output is cross-exercise
consistency.** A `contribution` of 80 must mean the same thing on exercise 7 as on
exercise 288. Precision on any one exercise matters far less than the whole set
being calibrated against the same anchors. Work to the anchors in §4 literally.

---

## 2. Fixed vocabularies — do not invent values

### 2.1 Muscle keys (exactly 26)

Any other string is dropped silently by the app and the muscle renders nothing on
the anatomy chart. Use these spellings exactly, including camelCase.

```
abductors, abs, adductors, biceps, brachialis, calves, chest, feet,
forearms, frontDelts, glutes, hamstrings, hipFlexors, lats, lowerBack,
obliques, quads, rearDelts, rotatorCuff, serratusAnterior, shoulders,
sideDelts, tibialis, traps, triceps, upperBack
```

Notes on ambiguous ones:
- `shoulders` is the whole deltoid. Prefer `frontDelts` / `sideDelts` / `rearDelts`
  when the exercise biases a head. Use `shoulders` only when all three share load.
- `upperBack` covers rhomboids and mid-trap retraction. `traps` is the trapezius
  as a whole, biased upper. `lats` is latissimus dorsi.
- `rotatorCuff` is the deep cuff, not the rear delt.
- `brachialis` is separate from `biceps`; use it for neutral/pronated elbow flexion.
- `feet` and `tibialis` are rarely primary — use them only when genuinely loaded.

### 2.2 Role (exactly three)

```
"Prime mover" | "Synergist" | "Stabilizer"
```

- **Prime mover** — produces the visible movement against the resistance.
- **Synergist** — meaningfully assists the prime mover through the same action.
- **Stabilizer** — controls position or resists an unwanted motion while another
  muscle drives the movement. Isometric or near-isometric.

### 2.3 Grade (exactly seven, `SS` reserved)

```
"F" | "D" | "C" | "B" | "A" | "S"
```

Do not emit `"SS"`. It is reserved by the app for a different purpose.

### 2.4 Evidence quality (exactly one of)

```
"Authored — expert model"
"Established — movement mechanics"
"Moderate — biomechanical inference"
"Context-sensitive — coaching inference"
```

**Default to `"Authored — expert model"`.** This app gates population comparisons
behind reviewed studies, and these authored numbers must stay visibly distinct
from study-backed ones. Only use the other three when the rating follows directly
and uncontroversially from mechanics (e.g. a barbell curl loading the biceps).

---

## 3. Output schema

```jsonc
{
  "version": "1.0",
  "scale": "0-100",
  "exercises": [
    {
      "exerciseId": 1,                  // must match the manifest
      "name": "Barbell Bench Press",    // echo for verification; app ignores it

      // Per-exercise rating vector. All eight required, 0-100 integers.
      "fingerprint": {
        "hypertrophy": 82,
        "strength": 90,
        "power": 45,
        "stability": 30,
        "mobility": 20,
        "sfr": 72,                      // stimulus-to-fatigue ratio
        "skill": 40,
        "practicality": 78
      },

      // One entry per muscle the exercise meaningfully loads.
      // Include every muscle scoring >= 15 on contribution. Omit the rest.
      // Typical range is 3-8 entries. More than 10 means you are padding.
      "muscles": [
        {
          "muscle": "chest",            // from §2.1
          "role": "Prime mover",        // from §2.2
          "tier": "S",                  // from §2.3
          "contribution": 92,
          "mechanicalLoading": 88,
          "longLengthLoading": 80,
          "peakContraction": 55,
          "stabilizationDemand": 15,
          "fatigueContribution": 70,
          "why": "Horizontal shoulder adduction against the bar is the movement."
        }
      ],

      "evidence": {
        "quality": "Authored — expert model",   // from §2.4
        "confidence": "High",                    // "High" | "Moderate"
        "note": "Barbell horizontal press mechanics are well characterized."
      }
    }
  ]
}
```

### Field rules

| Field | Type | Rule |
| --- | --- | --- |
| `exerciseId` | integer | Must exist in the manifest. No new ids. |
| `fingerprint.*` | 0–100 int | All eight keys required on every exercise. |
| `muscles` | array | Minimum 1 entry. Every entry needs every field. |
| `contribution` | 0–100 int | See §4.1 anchors. |
| `mechanicalLoading` | 0–100 int | Tension opportunity through the range. |
| `longLengthLoading` | 0–100 int | Load available near the stretched position. |
| `peakContraction` | 0–100 int | Load available near the shortened position. |
| `stabilizationDemand` | 0–100 int | Positional control asked of this muscle. |
| `fatigueContribution` | 0–100 int | This muscle's share of the exercise's fatigue cost. |
| `why` | string | One sentence, ≤ 140 chars. Mechanics, not marketing. |

Integers only. No nulls, no empty strings, no `"N/A"`.

---

## 4. Calibration anchors — the part that matters

### 4.1 `contribution`

What fraction of the exercise's total mechanical demand this muscle carries.

| Value | Meaning | Example |
| --- | --- | --- |
| 90–100 | The reason the exercise exists for this muscle | chest on Barbell Bench Press |
| 70–89 | Clear prime mover, shares meaningfully | triceps on Close-Grip Bench Press |
| 45–69 | Strong synergist, loaded but not the target | triceps on Barbell Bench Press |
| 25–44 | Real but secondary involvement | frontDelts on Barbell Bench Press |
| 15–24 | Present, worth listing | abs on Barbell Bench Press |
| < 15 | **Omit the entry entirely** | |

**Do not normalize to 100 across an exercise.** These are independent ratings, not
shares of a pie. A squat can have quads 92 and glutes 85 simultaneously.

### 4.2 `longLengthLoading` vs `peakContraction`

These separate where in the range the muscle is challenged. They should usually
*differ*, often sharply — that difference is the point.

- Romanian deadlift → hamstrings: `longLengthLoading` ~90, `peakContraction` ~25
- Leg curl (seated) → hamstrings: `longLengthLoading` ~70, `peakContraction` ~65
- Cable lateral raise → sideDelts: `longLengthLoading` ~35, `peakContraction` ~85
- Preacher curl → biceps: `longLengthLoading` ~85, `peakContraction` ~30

If you find yourself setting both to the same value on most exercises, you are not
thinking about the resistance curve.

### 4.3 `stabilizationDemand`

Position control, **not** force production. A prime mover usually scores low here.

- abs on an overhead press: ~65 (bracing against extension)
- glutes on a barbell back squat: ~40 (they also drive, so it is mixed)
- chest on a bench press: ~15 (it is producing force, not stabilizing)
- rotatorCuff on almost any pressing movement: ~60–75

### 4.4 `sfr` (stimulus-to-fatigue ratio)

High = lots of useful stimulus per unit of systemic cost.

- Machine/cable isolation: 75–90
- Dumbbell accessory work: 65–80
- Barbell compound: 55–75
- Heavy deadlift / clean variants: 30–50

### 4.5 `skill`

Practice required before the exercise trains what it is meant to train.

- Machine work: 5–20
- Standard barbell lifts: 35–55
- Olympic derivatives: 75–95

---

## 5. Worked example — copy this level of care

```json
{
  "exerciseId": 1,
  "name": "Barbell Bench Press",
  "fingerprint": {
    "hypertrophy": 82, "strength": 90, "power": 45, "stability": 30,
    "mobility": 20, "sfr": 68, "skill": 42, "practicality": 74
  },
  "muscles": [
    {
      "muscle": "chest", "role": "Prime mover", "tier": "S",
      "contribution": 92, "mechanicalLoading": 88, "longLengthLoading": 78,
      "peakContraction": 50, "stabilizationDemand": 15, "fatigueContribution": 70,
      "why": "Horizontal shoulder adduction against the bar is the movement itself."
    },
    {
      "muscle": "triceps", "role": "Synergist", "tier": "A",
      "contribution": 62, "mechanicalLoading": 65, "longLengthLoading": 40,
      "peakContraction": 72, "stabilizationDemand": 10, "fatigueContribution": 45,
      "why": "Elbow extension drives the second half of the press, near lockout."
    },
    {
      "muscle": "frontDelts", "role": "Synergist", "tier": "B",
      "contribution": 55, "mechanicalLoading": 58, "longLengthLoading": 62,
      "peakContraction": 35, "stabilizationDemand": 25, "fatigueContribution": 40,
      "why": "Shoulder flexion assists through the bottom portion of the press."
    },
    {
      "muscle": "rotatorCuff", "role": "Stabilizer", "tier": "C",
      "contribution": 22, "mechanicalLoading": 20, "longLengthLoading": 30,
      "peakContraction": 15, "stabilizationDemand": 70, "fatigueContribution": 15,
      "why": "Holds the humeral head centred while the larger pressers produce force."
    },
    {
      "muscle": "abs", "role": "Stabilizer", "tier": "D",
      "contribution": 18, "mechanicalLoading": 15, "longLengthLoading": 12,
      "peakContraction": 10, "stabilizationDemand": 55, "fatigueContribution": 12,
      "why": "Resists lumbar extension while the athlete maintains the arch."
    }
  ],
  "evidence": {
    "quality": "Established — movement mechanics",
    "confidence": "High",
    "note": "Barbell horizontal press mechanics are well characterized."
  }
}
```

Note what this example does: triceps `peakContraction` (72) is far above its
`longLengthLoading` (40) because it works near lockout, while chest is the reverse.
Stabilizers have low `contribution` and high `stabilizationDemand`. That contrast
is the signal the app renders — flat values are worse than useless.

---

## 6. Working method

1. Process the manifest in order, in batches of 25.
2. **Before each batch, re-read §4.** Anchor drift across batches is the most
   likely failure and the hardest to repair afterwards.
3. The manifest's `primaryMuscles` / `secondaryMuscles` are the *existing* catalog
   assignments. Treat them as a strong prior, not a constraint — if they are wrong,
   rate what is actually true and note the disagreement in `why`.
4. Never emit an exercise id that is not in the manifest, and never skip one.
5. Every exercise in the manifest must appear exactly once in the output.

## 7. Self-check before delivering

- [ ] Exactly 300 entries, one per manifest id, no duplicates.
- [ ] Every muscle key is from §2.1, spelled exactly.
- [ ] Every role is one of the three in §2.2.
- [ ] No `"SS"` in any `tier`.
- [ ] All eight `fingerprint` keys present on every exercise.
- [ ] All numbers are integers in 0–100. No nulls or placeholders.
- [ ] No entry has `contribution` below 15.
- [ ] Spot-check ten exercises across the range: does a 70 mean the same thing
      on all ten?
- [ ] `longLengthLoading` and `peakContraction` differ on most entries.

---

## 8. Companion file

`exercise-rating-manifest.tsv` — the authoritative 300 exercises, tab-separated:

```
id	name	primaryMuscles	secondaryMuscles
1	Barbell Bench Press	chest	triceps,frontDelts,abs
```

That file is the source of truth for ids and names. Do not work from memory.
