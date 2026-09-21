-- A prescription may now state a target per set ("4 × 10/8/6/6"). Twelve timed
-- rounds run past the old 100-character ceiling, and the start-workout mutation
-- was rejected with nothing shown to the athlete. Widening is non-destructive:
-- every existing value already fits.
ALTER TABLE `workoutSessionExercises` MODIFY COLUMN `plannedPrescription` varchar(255) NOT NULL;
