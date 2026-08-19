# Routine Import Validation Notes

## Baseline import

The existing two-day example correctly resolves Barbell Bench Press, Seated Cable Row, Romanian Deadlift, and Bulgarian Split Squat. The parser keeps the exercise identity separate from displayed prescription details such as `3 × 8`, `RPE 8`, and `120 sec rest`.

## Next validation case

Use the reported format with a dynamic warm-up line, named set headers, repetitions-in-reserve guidance, and break duration. Expected behavior: only catalog-matched exercises load into the stack; all warm-up and set-instruction lines display as saved plan context rather than unmatched exercises.

## Observed result

The detailed test routine loaded four matched catalog exercises. The wrestling warm-up was preserved as a warm-up context entry, and all four named set lines—including failure-proximity and break instructions—were preserved as set instructions. None of these five context lines appeared as unmatched exercises or entered the active workout stack.

## Builder behavior

After import, the active builder retained only the two exercises assigned to the first session, with their parsed prescription, RPE, and rest controls independent from the exercise names. The custom workspace renders the new preparation area after the editable programming controls, with a concise six-drill stack-specific warm-up and a collapsed full-library reference.

## Visual check

The preparation workspace retains its compact six-drill surface and the full-library disclosure stays collapsed. The refreshed workspace can restore a different split-day than the just-imported day, so the UI now falls back to the first available saved plan-context block rather than leaving the contextual column empty.
