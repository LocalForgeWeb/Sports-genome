/**
 * One analysis of a saved training week, for Train → Review's Week scope.
 *
 * Review used to ask four modules for the same week and show their answers side by side:
 * the volume map summed attributed sets its own way, the spacing check re-derived the per-day
 * figures with a private copy of the same arithmetic, the Coach scan counted a day's sets with
 * a different parser, and the 344.5 "attributed sets" total sat on the board as if it were
 * sets to perform. Every Week-scope surface now reads this one result, so a muscle's bar, its
 * day chart, the overlap comparison and the findings cannot disagree with each other.
 *
 * The arithmetic is the inventory's existing model, not a new one (5 October 2026 brief §8):
 *   - a set counts 1.0 to each primary muscle and 0.5 to each secondary muscle
 *     (`logicCalibration.exposure.secondarySetConvention`), applied once, here;
 *   - the set count is the saved prescription's leading integer, else the goal default,
 *     else 3 (`parseSetCount`, the same reading `getWeeklyMuscleVolume` makes);
 *   - adjacent sessions share a muscle when both give it at least 3 attributed sets, and
 *     the pair is heavy when the summed minimums reach 8 (`recoverySpacing.ts`);
 *   - a day's shortfall against its split targets is `analyzeSplitStack`, revision
 *     `split_targets_v1`, unchanged.
 * `weekReview.test.ts` holds the older calculators to this one on every number.
 *
 * What the plan cannot say, this does not guess: it has no dates (so "adjacent" is plan
 * order, never calendar days), no rest marker (an empty slot is "not built"), and one
 * prescription string per exercise (so "3 × 8 / side" is 3 sets; warm-ups, circuits and
 * supersets are not represented).
 */
import type { Exercise } from "@/lib/exerciseCatalog";
import { getGoalPrescription, type TrainingGoal } from "@/lib/workoutPlanner";
import { displayNames, type WeeklyPrescriptionStore } from "@/lib/weeklyVolume";
import { defaultSetsPerExercise, parseSetCount } from "@/lib/sessionVolume";
import { logicCalibration } from "@/lib/evidenceTraceability";
import { regionKeysForValue } from "@/lib/anatomyRegions";
import { analyzeSplitStack, COVERAGE_TARGET_REVISION, getSplitRequirements } from "@/lib/splitStackAnalysis";
import { catalogKeysFor } from "@/lib/muscleVocabulary";
import type { DaySlot } from "@/lib/trainingDayPlan";
import { drawnMuscleKeys } from "@/components/anatomy/figureGeometry";

/** Carried on every result (B287): a reader later knows which rules produced it. */
export const WEEK_REVIEW_REVISION = "week_review_v1" as const;

/** The two ways the board can count: direct sets alone, or with the supporting estimate. */
export type ExposureMetric = "direct" | "total";

/** How many of the catalog's commonest movement values the week is checked against. */
export const COMMON_MOVEMENT_COUNT = 12;
/** A muscle whose single largest session carries this share of it is "concentrated" there. */
const CONCENTRATION_SHARE = 0.6;
/** Sessions a muscle must be trained on, with no heavy overlap, to be called well spread. */
const SPREAD_SESSIONS = 3;

export type WeekReviewSession = {
  key: string;
  index: number;
  day: DaySlot["day"];
  ordinal: string;
  label: string;
  /**
   * What the board calls the session: the split label ("Push"), or the slot's full label
   * ("Day 01 · Upper") when the split repeats it, as the 4-day Upper / Lower / Upper / Lower does,
   * so two findings never name two different sessions the same way.
   */
  name: string;
  /** The same, short enough for a marker chip ("Sport", "Upper 1"). */
  short: string;
  exerciseCount: number;
  /** Planned work sets: the sum of each exercise's set count. Sets to perform, not attributed. */
  workSets: number;
  state: "built" | "empty";
};

export type MuscleDayExposure = {
  sessionKey: string;
  day: DaySlot["day"];
  /** The session's name on the board (`WeekReviewSession.name`). */
  name: string;
  direct: number;
  /** Supporting sets at the half-set convention, already applied. */
  supporting: number;
  /** The same supporting sets as performed, for the caption only. */
  supportingPerformed: number;
  total: number;
};

export type MuscleExerciseRow = {
  sessionKey: string;
  day: DaySlot["day"];
  exercise: Exercise;
  sets: number;
  role: "direct" | "supporting";
  /** What this exercise added to the muscle: the sets, or half of them. */
  contribution: number;
};

export type WeekMuscle = {
  key: string;
  label: string;
  /** The regions the figure paints for this key (`shoulders` is three deltoid regions). */
  figureKeys: string[];
  direct: number;
  supporting: number;
  supportingPerformed: number;
  total: number;
  /** One entry per built session, in plan order, including sessions that give it nothing. */
  byDay: MuscleDayExposure[];
  exercises: MuscleExerciseRow[];
  /** Sessions that give this muscle any work. */
  sessionsTrained: number;
  /** True when the muscle appears only because a split target names it and nothing trains it. */
  targetOnly: boolean;
};

export type UnmappedExercise = { sessionKey: string; day: DaySlot["day"]; exercise: Exercise; sets: number };

export type WeekPattern = {
  movement: string;
  exercises: { sessionKey: string; day: DaySlot["day"]; exercise: Exercise }[];
  /** Session keys the pattern appears in, in plan order. */
  sessionKeys: string[];
};

export type SharedMuscle = { key: string; label: string; aSets: number; bSets: number };

export type WeekOverlapPair = {
  /** `${aKey}|${bKey}` */
  id: string;
  aKey: string;
  bKey: string;
  aDay: DaySlot["day"];
  bDay: DaySlot["day"];
  aName: string;
  bName: string;
  shared: SharedMuscle[];
  /** The summed per-muscle minimum across the pair, the register's heavy-overlap measure. */
  sharedExposure: number;
  heavy: boolean;
};

export type WeekFindingAction =
  | { type: "select-muscle"; muscle: string; label: string }
  | { type: "select-pair"; pairId: string; label: string }
  | { type: "edit-day"; dayKey: string; label: string; addExercises?: boolean };

export type WeekFinding = {
  id: string;
  kind: "strength" | "review";
  rule: "targets-met" | "spread" | "heavy-overlap" | "target-gap" | "concentration";
  headline: string;
  reason: string;
  /** Where the rule and its numbers come from, in one line. */
  source: string;
  action: WeekFindingAction;
};

export type WeekAnalysis = {
  revision: typeof WEEK_REVIEW_REVISION;
  sessions: WeekReviewSession[];
  builtCount: number;
  /** The week's planned work sets: the sum of the sessions' counts. */
  workSets: number;
  /** Every muscle with work, plus a zero row for each split-target muscle nothing trains. Sorted by total, then direct, then label. */
  muscles: WeekMuscle[];
  /** Σ of every muscle's total: one set counts toward every muscle it is tagged with. For the methodology note, never the board. */
  attributedTotal: number;
  /** The week's largest direct and total values: the one scale every bar and the figure share. */
  max: { direct: number; total: number };
  unmapped: UnmappedExercise[];
  patterns: WeekPattern[];
  /** Of the catalog's commonest movement values, the ones the week does not contain. */
  notPlanned: string[];
  unknownPattern: { sessionKey: string; day: DaySlot["day"]; exercise: Exercise }[];
  overlap: {
    pairs: WeekOverlapPair[];
    /** Built sessions not compared because an unbuilt slot sits between them in plan order. */
    skipped: { aDay: DaySlot["day"]; bDay: DaySlot["day"]; aName: string; bName: string }[];
  };
  findings: WeekFinding[];
  /** Facts about the data the numbers rest on; not findings about the plan. */
  dataNotes: string[];
  /**
   * Regions the figure draws that no catalog exercise can tag (soleus, brachioradialis): the data
   * cannot say anything about them, so the figure marks them unknown rather than painting a zero.
   */
  untaggedRegions: string[];
};

export type WeekReviewInput = {
  /**
   * Every slot of the split, in plan order; an absent or empty plan entry is an unbuilt session.
   * A plan key that is not one of these slots (a day hidden by lowering the training frequency,
   * which the store keeps) is not read: the week is its slots, the same rule as `visibleDayPlan`.
   */
  slots: readonly DaySlot[];
  plan: Record<string, Exercise[] | undefined>;
  prescriptions: WeeklyPrescriptionStore;
  goal: TrainingGoal;
  catalog: readonly Exercise[];
};

const round1 = (value: number) => Number(value.toFixed(1));

/** "18.5" stays "18.5"; "20" is not printed as "20.0". */
export const setsFigure = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1));

/** A muscle's name from the catalog key, or the register's name when the catalog has no such key. */
export const muscleLabel = (key: string) => displayNames[key] || (key === "rhomboids" ? "Rhomboids" : key);

/** The catalog's most common movement values, most common first. Computed from the catalog, never typed in. */
export function commonMovements(catalog: readonly Exercise[], count = COMMON_MOVEMENT_COUNT): string[] {
  const counts = new Map<string, number>();
  catalog.forEach((exercise) => { if (exercise.movement) counts.set(exercise.movement, (counts.get(exercise.movement) || 0) + 1); });
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, count).map(([movement]) => movement);
}

/** The value the figure paints for each drawn region: the muscles mapped onto it, summed. */
export function exposureByRegion(muscles: readonly WeekMuscle[], metric: ExposureMetric): Record<string, number> {
  const byRegion: Record<string, number> = {};
  muscles.forEach((muscle) => muscle.figureKeys.forEach((region) => { byRegion[region] = round1((byRegion[region] || 0) + muscle[metric]); }));
  return byRegion;
}

export type FigureExposure = {
  /** Per drawn region: its value, or "unknown" where the catalog has no tag for it. Absent or 0 is no planned work. */
  values: Record<string, number | "unknown">;
  /** The rows painted on each region, so a region's name can say what it adds up ("4 anterior deltoids + 4 deltoids tag"). */
  parts: Record<string, { key: string; label: string; value: number }[]>;
  /**
   * The figure's own top step: its largest region. The catalog's umbrella "Deltoids" tag is painted
   * on all three heads on top of their own rows, so a head can read more than any chart row; the
   * figure's scale is taken from what it paints, never from the chart's largest row.
   */
  max: number;
};

/** What the anatomy figure paints for the week, in the chosen metric. */
export function figureExposure(analysis: Pick<WeekAnalysis, "muscles" | "untaggedRegions">, metric: ExposureMetric): FigureExposure {
  const values: Record<string, number | "unknown"> = {};
  const parts: FigureExposure["parts"] = {};
  analysis.muscles.forEach((muscle) => muscle.figureKeys.forEach((region) => {
    if (!muscle[metric]) return;
    (parts[region] ??= []).push({ key: muscle.key, label: muscle.label, value: muscle[metric] });
    values[region] = round1(Number(values[region] || 0) + muscle[metric]);
  }));
  analysis.untaggedRegions.forEach((region) => { values[region] = "unknown"; });
  const numbers = Object.values(values).filter((value): value is number => typeof value === "number");
  return { values, parts, max: Math.max(0, ...numbers) };
}

/** Drawn regions no catalog muscle key reaches, through the same mapping the figure paints with. */
export function untaggedRegionsFor(catalog: readonly Exercise[]): string[] {
  const tagged = new Set<string>();
  catalog.forEach((exercise) => [...exercise.primaryMuscles, ...exercise.secondaryMuscles].forEach((key) => regionKeysForValue(key).forEach((region) => tagged.add(region))));
  return Array.from(new Set([...drawnMuscleKeys.front, ...drawnMuscleKeys.back])).filter((region) => !tagged.has(region)).sort();
}

const shortDayName = (day: string) => (day === "Sport Transfer" ? "Sport" : day === "Full Body" ? "Full" : day);

/** The figure's own quantisation, re-exported so the chart's legend and the figure agree by construction. */
export { exposureStep } from "@/components/anatomy/exposurePaint";

/** A saved prescription the parser reads as written: a leading count above zero. "AMRAP" and "0 x 10" both become the default. */
const readsAsWritten = (prescription: string | undefined) => Number.parseInt(prescription?.match(/^\s*(\d+)/)?.[1] || "", 10) > 0;

export function analyzeWeek(input: WeekReviewInput): WeekAnalysis {
  const { slots, plan, prescriptions, goal, catalog } = input;
  const half = logicCalibration.exposure.secondarySetConvention;

  const sessions: WeekReviewSession[] = [];
  const muscles = new Map<string, WeekMuscle>();
  const unmapped: UnmappedExercise[] = [];
  const patterns = new Map<string, WeekPattern>();
  const unknownPattern: WeekAnalysis["unknownPattern"] = [];
  let unreadPrescriptions = 0;

  const muscleRow = (key: string): WeekMuscle => {
    const existing = muscles.get(key);
    if (existing) return existing;
    const row: WeekMuscle = { key, label: muscleLabel(key), figureKeys: regionKeysForValue(key), direct: 0, supporting: 0, supportingPerformed: 0, total: 0, byDay: [], exercises: [], sessionsTrained: 0, targetOnly: false };
    muscles.set(key, row);
    return row;
  };
  const dayRow = (muscle: WeekMuscle, session: WeekReviewSession): MuscleDayExposure => {
    const existing = muscle.byDay.find((entry) => entry.sessionKey === session.key);
    if (existing) return existing;
    const entry: MuscleDayExposure = { sessionKey: session.key, day: session.day, name: session.name, direct: 0, supporting: 0, supportingPerformed: 0, total: 0 };
    muscle.byDay.push(entry);
    return entry;
  };

  slots.forEach((slot) => {
    const workout = plan[slot.key] || [];
    const repeated = slots.filter((other) => other.day === slot.day).length > 1;
    const session: WeekReviewSession = { key: slot.key, index: slot.index, day: slot.day, ordinal: slot.ordinal, label: slot.label, name: repeated ? slot.label : slot.day, short: repeated ? `${shortDayName(slot.day)} ${slot.index + 1}` : shortDayName(slot.day), exerciseCount: workout.length, workSets: 0, state: workout.length ? "built" : "empty" };
    sessions.push(session);
    workout.forEach((exercise, index) => {
      const saved = prescriptions[slot.key]?.[exercise.id];
      if (saved && !readsAsWritten(saved)) unreadPrescriptions += 1;
      const sets = parseSetCount(saved || getGoalPrescription(goal, index));
      session.workSets += sets;

      const direct = new Set(exercise.primaryMuscles);
      const support = exercise.secondaryMuscles.filter((muscle) => !direct.has(muscle));
      if (!direct.size && !support.length) unmapped.push({ sessionKey: slot.key, day: slot.day, exercise, sets });
      direct.forEach((key) => {
        const row = muscleRow(key);
        const day = dayRow(row, session);
        row.direct += sets; day.direct += sets;
        row.exercises.push({ sessionKey: slot.key, day: slot.day, exercise, sets, role: "direct", contribution: sets });
      });
      support.forEach((key) => {
        const row = muscleRow(key);
        const day = dayRow(row, session);
        const contribution = sets * half;
        row.supporting += contribution; row.supportingPerformed += sets;
        day.supporting += contribution; day.supportingPerformed += sets;
        row.exercises.push({ sessionKey: slot.key, day: slot.day, exercise, sets, role: "supporting", contribution });
      });

      if (!exercise.movement) { unknownPattern.push({ sessionKey: slot.key, day: slot.day, exercise }); return; }
      const pattern = patterns.get(exercise.movement) || { movement: exercise.movement, exercises: [], sessionKeys: [] };
      pattern.exercises.push({ sessionKey: slot.key, day: slot.day, exercise });
      if (!pattern.sessionKeys.includes(slot.key)) pattern.sessionKeys.push(slot.key);
      patterns.set(exercise.movement, pattern);
    });
  });

  // A zero is a zero: every muscle the week's split targets name is a row, so "nothing trains
  // the hamstrings" is on the board rather than silently absent from it.
  slots.forEach((slot) => getSplitRequirements(slot.day).forEach((requirement) => {
    const key = catalogKeysFor(requirement.muscle)[0] ?? requirement.muscle;
    if (!muscles.has(key)) muscleRow(key).targetOnly = true;
  }));

  const built = sessions.filter((session) => session.state === "built");
  const rows = Array.from(muscles.values()).map((row) => {
    // Every built session is on the muscle's day chart, in plan order, zero included.
    const byDay = built.map((session) => row.byDay.find((entry) => entry.sessionKey === session.key) || { sessionKey: session.key, day: session.day, name: session.name, direct: 0, supporting: 0, supportingPerformed: 0, total: 0 })
      .map((entry) => ({ ...entry, direct: round1(entry.direct), supporting: round1(entry.supporting), total: round1(entry.direct + entry.supporting) }));
    return { ...row, direct: round1(row.direct), supporting: round1(row.supporting), total: round1(row.direct + row.supporting), byDay, sessionsTrained: byDay.filter((entry) => entry.total > 0).length };
  }).sort((a, b) => b.total - a.total || b.direct - a.direct || a.label.localeCompare(b.label));

  const overlapPairs: WeekOverlapPair[] = [];
  const skipped: WeekAnalysis["overlap"]["skipped"] = [];
  built.forEach((session, position) => {
    const next = built[position + 1];
    if (!next) return;
    if (next.index - session.index !== 1) { skipped.push({ aDay: session.day, bDay: next.day, aName: session.name, bName: next.name }); return; }
    const shared = rows.flatMap((row) => {
      const a = row.byDay.find((entry) => entry.sessionKey === session.key)?.total ?? 0;
      const b = row.byDay.find((entry) => entry.sessionKey === next.key)?.total ?? 0;
      return a >= logicCalibration.exposure.consecutiveDayMinimumSets && b >= logicCalibration.exposure.consecutiveDayMinimumSets ? [{ key: row.key, label: row.label, aSets: a, bSets: b }] : [];
    }).sort((a, b) => Math.min(b.aSets, b.bSets) - Math.min(a.aSets, a.bSets) || a.label.localeCompare(b.label));
    const sharedExposure = round1(shared.reduce((sum, item) => sum + Math.min(item.aSets, item.bSets), 0));
    overlapPairs.push({ id: `${session.key}|${next.key}`, aKey: session.key, bKey: next.key, aDay: session.day, bDay: next.day, aName: session.name, bName: next.name, shared, sharedExposure, heavy: sharedExposure >= logicCalibration.exposure.consecutiveDayPriorityExposure });
  });

  const common = commonMovements(catalog);
  const patternRows = Array.from(patterns.values()).sort((a, b) => b.exercises.length - a.exercises.length || a.movement.localeCompare(b.movement));
  const notPlanned = common.filter((movement) => !patterns.has(movement));

  const findings = buildFindings({ sessions: built, plan, catalog, rows, pairs: overlapPairs });

  const dataNotes: string[] = [];
  if (unmapped.length) dataNotes.push(`${unmapped.length} ${unmapped.length === 1 ? "exercise has" : "exercises have"} no muscle mapping (${unmapped.map((item) => item.exercise.name).join(", ")}). ${unmapped.length === 1 ? "It counts" : "They count"} in the session totals and in no muscle.`);
  if (unreadPrescriptions) dataNotes.push(`${unreadPrescriptions} saved ${unreadPrescriptions === 1 ? "prescription does" : "prescriptions do"} not start with a set count and ${unreadPrescriptions === 1 ? "is" : "are"} counted as ${defaultSetsPerExercise} sets.`);

  return {
    revision: WEEK_REVIEW_REVISION,
    sessions,
    builtCount: built.length,
    workSets: sessions.reduce((sum, session) => sum + session.workSets, 0),
    muscles: rows,
    attributedTotal: round1(rows.reduce((sum, row) => sum + row.total, 0)),
    max: { direct: Math.max(0, ...rows.map((row) => row.direct)), total: Math.max(0, ...rows.map((row) => row.total)) },
    unmapped,
    patterns: patternRows,
    notPlanned,
    unknownPattern,
    overlap: { pairs: overlapPairs, skipped },
    findings,
    dataNotes,
    untaggedRegions: untaggedRegionsFor(catalog),
  };
}

const join = (labels: string[]) => labels.length <= 1 ? labels.join("") : `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
const lower = (label: string) => label.charAt(0).toLowerCase() + label.slice(1);

/**
 * Deterministic rules over the analysis. Each names its evidence and offers one action that
 * exists; none rewrites the plan or manufactures praise. One finding per cause, so a muscle
 * concentrated on one day and a pair sharing it are two findings, not four.
 */
function buildFindings({ sessions, plan, catalog, rows, pairs }: { sessions: WeekReviewSession[]; plan: WeekReviewInput["plan"]; catalog: readonly Exercise[]; rows: WeekMuscle[]; pairs: WeekOverlapPair[] }): WeekFinding[] {
  const review: WeekFinding[] = [];
  const strengths: WeekFinding[] = [];
  const spacingSource = `Shared when both sessions give a muscle at least ${logicCalibration.exposure.consecutiveDayMinimumSets} attributed sets; heavy from ${logicCalibration.exposure.consecutiveDayPriorityExposure} summed shared sets. Plan order, not dates.`;

  pairs.filter((pair) => pair.heavy).forEach((pair) => review.push({
    id: `heavy-overlap:${pair.id}`, kind: "review", rule: "heavy-overlap",
    headline: `${pair.aName} and ${pair.bName} share heavy exposure: ${join(pair.shared.slice(0, 3).map((item) => lower(item.label)))}.`,
    reason: `${setsFigure(pair.sharedExposure)} shared attributed sets across ${pair.shared.length} ${pair.shared.length === 1 ? "muscle" : "muscles"}, on sessions next to each other in plan order.`,
    source: spacingSource,
    action: { type: "select-pair", pairId: pair.id, label: "Compare sessions" },
  }));

  const gapsBySession = sessions.map((session) => {
    // The split analysis reads the catalog and never writes it; its signature predates readonly inputs.
    const stack = analyzeSplitStack(plan[session.key] || [], catalog as Exercise[], session.day);
    return { session, gaps: stack.gaps.filter((gap) => gap.role === "primary") };
  });
  gapsBySession.filter((entry) => entry.gaps.length).forEach(({ session, gaps }) => review.push({
    id: `target-gap:${session.key}`, kind: "review", rule: "target-gap",
    headline: `${session.name} leaves ${join(gaps.map((gap) => lower(muscleLabel(gap.muscle))))} under its target.`,
    reason: gaps.map((gap) => `${muscleLabel(gap.muscle)} ${gap.rawScore ?? gap.score} of ${gap.target} coverage points`).join("; ") + ".",
    source: `Split targets, revision ${COVERAGE_TARGET_REVISION}: a gap is under ${Math.round(logicCalibration.exposure.splitCoverageGapRatio * 100)}% of the day's target in catalog-tag points.`,
    action: { type: "edit-day", dayKey: session.key, label: `Add exercises to ${session.name}`, addExercises: true },
  }));

  // Concentration is a finding only where the split itself asks two or more of the built
  // sessions to train the muscle: in a Push / Pull / Legs week most chest work falling on Push
  // is the split, not a review point. The sessions a muscle is a target of come from the same
  // split register the gap finding reads.
  const targetSessions = (key: string) => sessions.filter((session) => getSplitRequirements(session.day).some((requirement) => (catalogKeysFor(requirement.muscle)[0] ?? requirement.muscle) === key)).length;
  rows.filter((row) => row.total > 0).slice(0, 3).forEach((row) => {
    const largest = [...row.byDay].sort((a, b) => b.total - a.total)[0];
    if (!largest || row.sessionsTrained < 2 || targetSessions(row.key) < 2) return;
    const share = largest.total / row.total;
    if (share < CONCENTRATION_SHARE) return;
    review.push({
      id: `concentration:${row.key}`, kind: "review", rule: "concentration",
      headline: `Most ${lower(row.label)} exposure falls on ${largest.name}.`,
      reason: `${setsFigure(largest.total)} of ${setsFigure(row.total)} attributed sets (${Math.round(share * 100)}%) on ${largest.name}, though ${targetSessions(row.key)} of the built sessions have it as a split target.`,
      source: `Attributed sets per session: direct sets at 1.0, supporting at ${logicCalibration.exposure.secondarySetConvention}. Concentrated at ${Math.round(CONCENTRATION_SHARE * 100)}% or more on one session, for a muscle the split targets on two or more built sessions.`,
      action: { type: "select-muscle", muscle: row.key, label: "Review distribution" },
    });
  });

  if (sessions.length && gapsBySession.every((entry) => !entry.gaps.length)) strengths.push({
    id: "targets-met", kind: "strength", rule: "targets-met",
    headline: sessions.length === 1 ? `${sessions[0].name} covers its primary targets.` : `Every built session covers its primary targets.`,
    reason: `${sessions.length} ${sessions.length === 1 ? "session" : "sessions"} checked against the split's primary-muscle targets; none is under.`,
    source: `Split targets, revision ${COVERAGE_TARGET_REVISION}.`,
    action: { type: "edit-day", dayKey: sessions[0].key, label: `Open ${sessions[0].name}` },
  });

  const heavyKeys = new Set(pairs.filter((pair) => pair.heavy).flatMap((pair) => pair.shared.map((item) => item.key)));
  // A muscle the board calls concentrated on one session is not also called well spread.
  const concentratedKeys = new Set(review.filter((finding) => finding.rule === "concentration").map((finding) => finding.id.split(":")[1]));
  // Spread is about direct work: a session that gives a muscle only supporting sets does not count,
  // and no one session may carry most of the direct sets (the review found "Upper back is spread
  // across 3 sessions" when its 12 direct sets sat on two and the third gave 1.5 supporting).
  const directSessions = (row: WeekMuscle) => row.byDay.filter((entry) => entry.direct > 0);
  const spread = rows.filter((row) => {
    const days = directSessions(row);
    return days.length >= SPREAD_SESSIONS && Math.max(...days.map((entry) => entry.direct)) / row.direct < CONCENTRATION_SHARE && !heavyKeys.has(row.key) && !concentratedKeys.has(row.key);
  }).sort((a, b) => b.direct - a.direct)[0];
  if (spread) strengths.push({
    id: `spread:${spread.key}`, kind: "strength", rule: "spread",
    headline: `${spread.label} is spread across ${directSessions(spread).length} sessions.`,
    reason: `${setsFigure(spread.direct)} direct sets: ${directSessions(spread).map((entry) => `${entry.name} ${setsFigure(entry.direct)}`).join(", ")}; no session carries most of them and none is a heavy overlap with its neighbour.`,
    source: spacingSource,
    action: { type: "select-muscle", muscle: spread.key, label: "See its sessions" },
  });

  return [...strengths, ...review];
}
