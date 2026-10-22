/**
 * The stack designer's rules (docs/specialization-atlas, note 11, §3.4,
 * "Rules"): named scheduling choices, not doses. Kept apart from the designer (stack.ts) so the
 * device record (stackStore.ts), which Home and the page read with the page closed, can check
 * stored totals and settings without loading the designer, which is fetched only when the stack
 * card opens (§3.10).
 */
export const STACK_RULES = {
  /** The smallest entry: one set, so the starting total reaches every movement. */
  smallestEntry: 1,
  /** Sets of one exercise in one session (the Plan's own accessory default is 3). */
  maxSetsPerSession: 3,
  /** Sessions of one exercise in a week. */
  maxSessionsPerWeek: 2,
  /** The region's exercises a day, the plan's own with direct work included: the athlete's setting. */
  exercisesPerDay: { default: 4, min: 1, max: 6 },
  /** A guard against typing errors, not a dose. */
  maxTotal: 60,
  /** The Plan's own minute estimate per set (getWorkoutDiagnostics): 1.05 min of work plus the default 90 s rest. */
  minutesPerSet: 1.05,
  restMinutes: 1.5,
  /** A seconds target is filled in holds of this length, whatever the training goal. */
  targetHoldSeconds: 30,
  /** The seeded placement search stops after this many nodes, keeping any better placement it found. */
  placementNodeLimit: 5000,
  /** Above this many distinct cover patterns the exercise choice is greedy instead of exact. */
  exactCoverPatterns: 20,
} as const;
