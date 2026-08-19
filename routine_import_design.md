# Pasted Routine Import Design

## Purpose

The importer accepts a complete training routine pasted from notes, a coach, or another app and turns it into editable Gym Optimizer workout days. It is deliberately conservative: recognized catalog exercises are loaded, unmatched text stays visible for review, and all parsed programming remains editable after import.

## Accepted Structure

The parser recognizes optional routine titles, conventional day headers such as `Day 1 — Push`, `Monday`, `Lower`, or `Full Body`, then one exercise per line. Exercise lines may include `3 x 8–10`, `3 sets of 8`, `4 x 30 sec`, `RPE 8`, `rest 90 sec`, and a trailing note. Lines without a catalog match are never silently discarded: the preview reports them explicitly.

## Loading Rules

For a single session, matched exercises load into the Custom Builder and their prescription, RPE, rest, and notes are retained. For multiple days, the importer maps recognized day labels to the current weekly split where possible and otherwise assigns the pasted order to available weekly slots. The first imported day becomes the active editable session; the full routine populates the weekly map.

## Information Placement

The import control is the sole entry point for pasted routines. Its modal owns parsing and preview; Custom Builder owns post-import editing and the Weekly Plan Board owns the resulting multi-day schedule. Recommendations, anatomy, and research views link into planning but do not duplicate routine-editing controls.

## Validation Note

Live import testing confirmed catalog exercise matching and parsed RPE/rest carryover. The test also identified that conventional labels such as `Lower Day` must be treated as a day header; the parser now recognizes both split names and split-name-plus-day variants before the routine is loaded.

The confirmed import handoff now opens the Custom Builder with the first parsed day active, creates entries in the Weekly Plan Board for every parsed day, and retains imported RPE, rest, notes, and non-preset prescriptions as editable control values.

The final browser check confirmed that `3 × 8`, `RPE 8`, and `120 sec` remain selected after import. A two-day Push/Lower routine now produces saved Push and Legs entries in a three-day weekly map, rather than assigning the lower-body routine to Pull.
