# Push Target Analysis Validation — 2026-08-28

The reported issue had two separate causes. First, the Training Day Smart Draft handler inserted sport-wide session recommendations directly, bypassing the already available split-filtered loadout. Second, the Stack Analysis page independently aggregated every muscle in the active workout and rendered that full list/body map as the default, although the Push target index was calculated separately.

Smart Draft now uses the existing split-filtered `draftedLoadout`, which derives its pool through `getSplitExercisePool` for the active split. For Push, that excludes rows, pulls, lower-body categories, and sport-wide rotational/conditioning candidates from the automatic draft. Athletes can still deliberately add any catalog exercise themselves.

Stack Analysis now filters the default body map, target count, selectable rows, and detail panel to the split requirements. Generated 390 × 844 and 1366 × 768 Push captures showed a `Push target map` with five target rows—anterior deltoid, triceps brachii, pectoralis major, lateral deltoid, and serratus anterior—and a separate closed Supporting involvement disclosure for six non-target groups. The Push index remains explicitly labeled as a catalog planning index for split targets only; no activation, EMG, strength, or medical claim was added.
