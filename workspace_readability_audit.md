# Workspace Readability Audit — 2026-08-19

## Findings

The Movement Intelligence support rows constrained both the descriptive exercise button and the add control through the same child selector. This fixed height caused the rationale text to overlap the title. Recommendation rows also truncated their rationale and shared-demand context at tighter widths.

## Corrective decisions

- Split support rows into independent index, content, source, and add-control areas so titles and rationale copy have their own flexible, wrapping column.
- Rework recommendation rows into an explicit grid, removing truncation from the exercise rationale while preserving the same content and actions.
- Permit movement summary and coverage-copy fields to wrap rather than clip or ellipsize.
- Preserve the established blue-and-gold shell, vermilion decision signals, and athlete-console hierarchy. Add only non-textual calibration and decision cues to strengthen engagement without changing product content.

## Validation

Desktop Recommended Workouts now presents exercise matches and support exercises as stable, separately aligned columns. Titles, rationale copy, source labels, grade markers, and add controls retain their own space. Mobile Pulse Quiz verification confirms that the calibration detailing and card cues remain clear without obscuring any headline, descriptive copy, or selection control.
