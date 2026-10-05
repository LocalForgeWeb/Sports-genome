/**
 * Exercise analysis: what the exercise's profile says, what it asks of the body,
 * how it moves and how it fits the athlete's plan, in four views.
 *
 * October 4 redesign. The views used to sit under two methodology disclosures, in a
 * light-panel component repainted for the dark sheet, with a radar whose labels ran
 * into each other, four of eight scores beside it and "Fast read", one paragraph that
 * joined workout fit, sport mapping and two caveats. Now the profile is a list of all
 * eight scores, grouped by what higher means, with the radar as an overview; the
 * summary is a sentence and two labelled lines; and the methodology is at the foot of
 * the view it explains. No score is computed here: every number is the catalog
 * model's (lib/exerciseGenome), shown as it is or shown as unavailable.
 */
import React, { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChartNoAxesCombined, ChevronDown, Info, ShieldAlert, X } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import { analyzeExerciseContext, getExerciseGenome, getWorkoutGenome, goalDimensionFor, type ExerciseGenome, type GenomeContext, type GenomeDimension } from "@/lib/exerciseGenome";
import { mechanicsEvidenceSources } from "@/lib/muscleTargetingModel";
import { GradeStamp } from "@/components/GradeStamp";
import { exerciseEvidenceCoverage } from "@/lib/evidenceCoverage";
import { evidenceTraceability, logicCalibration } from "@/lib/evidenceTraceability";
import { getExerciseActionConnection, lookupEnrichedMovement } from "@/lib/movementProgramAnalysis";
import { isKeyForAnotherLayer } from "@/lib/modalLayer";
import { movementDisplayLabel } from "@/lib/movementLabel";
import { ExerciseAnalysisTabs, genomePanelId, genomeTabId, type GenomeTab } from "@/components/ExerciseAnalysisTabs";
import type { SupabaseExerciseEvidence } from "../../../shared/supabaseEvidence";
import "../exercise-intelligence.css";

type LearnKey = GenomeDimension | "contextualFit" | "primeMover" | "synergist" | "stabilizer" | "contribution" | "mechanicalLoading" | "longLengthLoading" | "peakContraction" | "stabilizationDemand" | "movementPattern" | "jointAction" | "forceDirection" | "kineticChain" | "stance" | "resistanceCurve" | "resistanceBias" | "stickingRegion" | "localFatigue" | "systemicFatigue" | "axialFatigue" | "gripFatigue";

const labels: Record<GenomeDimension, string> = { hypertrophy: "Hypertrophy potential", strength: "Strength expression", power: "Power expression", stability: "Stability demand", mobility: "Mobility demand", sfr: "Stimulus-to-fatigue ratio", skill: "Technical skill demand", practicality: "Practicality" };

/** The radar's axes, clockwise from the top. Fixed, so two exercises' shapes can be compared. */
const dimensionOrder: GenomeDimension[] = ["hypertrophy", "strength", "power", "stability", "mobility", "sfr", "skill", "practicality"];

/**
 * What each axis is called on the radar itself: the chart's tick marks, short enough
 * to sit outside the plot at the size it is drawn. The full name and the number are
 * in the rows beside it. "Fatigue" alone would have read as a cost, and this axis is
 * the stimulus-to-fatigue ratio, where higher is the better trade-off, so it keeps
 * both words, on two lines.
 */
const radarLabels: Record<GenomeDimension, string[]> = { hypertrophy: ["Hypertrophy"], strength: ["Strength"], power: ["Power"], stability: ["Stability"], mobility: ["Mobility"], sfr: ["Stimulus/", "fatigue"], skill: ["Skill"], practicality: ["Practicality"] };

/**
 * The eight dimensions are not one kind of quantity, so they are not one list. What
 * the exercise can develop, what it asks of you and its trade-offs each say once what
 * a higher number means, so a high demand never reads as a better exercise.
 */
const dimensionGroups: { id: string; title: string; reading: string; dimensions: GenomeDimension[] }[] = [
  { id: "potential", title: "Training potential", reading: "What it can develop. Higher means more potential.", dimensions: ["hypertrophy", "strength", "power"] },
  { id: "demand", title: "Demands", reading: "What it asks of you. Higher means it asks more, not that it is better.", dimensions: ["stability", "mobility", "skill"] },
  { id: "tradeoff", title: "Trade-offs", reading: "Higher means more stimulus for the fatigue it costs, and easier to set up and run.", dimensions: ["sfr", "practicality"] },
];

/** On a narrow sheet the first four rows show and these wait behind "Show all 8 dimensions". */
const laterDimensions = new Set<GenomeDimension>(["mobility", "skill", "sfr", "practicality"]);

export const genomeTermInfo: Record<LearnKey, { label: string; meaning: string; inputs: string; read: string }> = {
  hypertrophy: { label: labels.hypertrophy, meaning: "How well an exercise can support muscular size work.", inputs: "Target-muscle loading potential, usable range of motion, controllable resistance, and the ability to accumulate productive sets.", read: "Higher values usually indicate a more practical tool for local muscular work; they do not predict individual growth." },
  strength: { label: labels.strength, meaning: "How suitable an exercise is for developing high force.", inputs: "External load potential, compound force expression, bracing demands, and progression potential.", read: "Higher values indicate force-development potential within this model, not a one-repetition-maximum guarantee." },
  power: { label: labels.power, meaning: "How suitable an exercise is for fast force expression.", inputs: "Intent to move quickly, explosive coordination, and freedom to accelerate through the action.", read: "Higher values favor rapid force expression; actual power depends on load, intent, and execution." },
  stability: { label: labels.stability, meaning: "How much the exercise challenges positional control.", inputs: "Balance, unilateral control, bracing, external instability, and joint-position demands.", read: "Higher values mean more control demand, not automatically more benefit in every phase." },
  mobility: { label: labels.mobility, meaning: "How much usable movement range the exercise asks for.", inputs: "Joint excursion, end-range tolerance, and the positions required to perform the movement well.", read: "Higher values indicate greater positional demand at that joint." },
  sfr: { label: labels.sfr, meaning: "How much useful training stimulus the exercise can deliver relative to expected fatigue cost.", inputs: "Local loading, systemic and axial fatigue, technical complexity, setup demands, and repeatability.", read: "Higher values suggest a more repeatable stimulus-to-cost trade-off." },
  skill: { label: labels.skill, meaning: "How much practice and coordination the movement normally requires.", inputs: "Timing, sequencing, technical constraints, and sensitivity to execution errors.", read: "Higher values mean more practice demand, which suits some goals and not others." },
  practicality: { label: labels.practicality, meaning: "How straightforward the exercise is to use in a real program.", inputs: "Equipment access, setup time, available space, load changes, and predictable progression.", read: "Higher values reflect easier implementation." },
  contextualFit: { label: "Contextual fit", meaning: "A separate planning summary of how this exercise fits the athlete's stated goal and what it adds to the current workout.", inputs: "Goal alignment from the static fingerprint and marginal value beyond the current workout. The selected sport action is left out: its movement support tier, under Sport context, says how the exercise relates to that action.", read: "Contextual fit moves with your goal and current stack." },
  primeMover: { label: "Prime mover", meaning: "A muscle assigned the main visible force-producing role in this exercise model.", inputs: "The catalog's exercise–muscle mapping, expected joint action, and the muscle's direct role in producing the task movement.", read: "Prime mover is the planning label for the muscle driving the visible movement." },
  synergist: { label: "Synergist", meaning: "A muscle assigned a meaningful assisting role alongside the main force-producing muscles.", inputs: "The catalog's secondary-muscle mapping, the joint action, setup, and expected coordination demands.", read: "A synergist can be important to the task without being the primary reason to choose the exercise." },
  stabilizer: { label: "Stabilizer", meaning: "A muscle assigned a position-control or bracing role while another action drives the visible movement.", inputs: "The catalog's bracing context, joint alignment needs, stance, load position, and likely resistance disturbance.", read: "A stabilizer holds position rather than driving the movement, so it trains differently from a prime mover." },
  contribution: { label: "Muscle-targeting rank", meaning: "A conditional ranking of how directly a listed muscle is expected to contribute to the named exercise.", inputs: "Muscle role; joint-angle and external-force context; inferred external moment; position-dependent moment arms; architecture; force–length and force–velocity context; contraction type; biarticular position; and possible stabilization or co-contraction. Direct longitudinal exercise evidence takes priority when it applies to the exact exercise–muscle pair.", read: "A higher value means the muscle is more central to how this exercise is planned." },
  mechanicalLoading: { label: "Mechanical loading", meaning: "The estimated opportunity for a muscle to experience meaningful tension through the exercise.", inputs: "External resistance, leverage, range of motion, joint position, and whether the muscle can be progressively loaded.", read: "Higher values describe stronger tension potential for that muscle." },
  longLengthLoading: { label: "Long-length challenge", meaning: "How much the muscle may be loaded while relatively lengthened.", inputs: "Joint position at the deeper range, resistance curve, and whether resistance remains meaningful near the stretched position.", read: "Higher values mean the exercise more often challenges that muscle at longer lengths." },
  peakContraction: { label: "Peak contraction", meaning: "How strongly the exercise can challenge the muscle near its shortened position.", inputs: "Resistance direction, leverage near end range, and whether tension remains high as the joint action finishes.", read: "Higher values indicate more shortened-range tension potential." },
  stabilizationDemand: { label: "Stabilization demand", meaning: "How much positional control the muscle contributes while other joints produce the visible movement.", inputs: "Joint alignment, bracing, balance, unilateral demands, and resistance that could disturb position.", read: "Higher values mean the muscle has more control responsibility." },
  movementPattern: { label: "Movement pattern", meaning: "The broad task family used to classify how the body moves.", inputs: "Primary displacement, force direction, joint sequencing, and whether the pattern is a squat, hinge, push, pull, carry, rotation, or locomotor task.", read: "Patterns help compare exercises and build balanced sessions." },
  jointAction: { label: "Joint action", meaning: "The named motion occurring at a joint during the exercise.", inputs: "Observable motion such as flexion, extension, abduction, adduction, rotation, or scapular movement.", read: "A listed action describes the task mechanics; contribution from individual muscles can vary with setup and technique." },
  forceDirection: { label: "Force direction", meaning: "The dominant direction the athlete resists or applies force against the load.", inputs: "Load placement, gravity, cable or band line of pull, ground reaction force, and the intended movement path.", read: "It helps explain transfer and resistance behavior." },
  kineticChain: { label: "Kinetic chain", meaning: "Whether the moving limb is relatively free or fixed against an external surface.", inputs: "Contact with the floor, bench, bar, handles, or other stable surfaces during the exercise.", read: "Closed-chain tasks often coordinate multiple joints against a fixed contact; open-chain tasks usually allow a limb segment to move more freely." },
  stance: { label: "Stance", meaning: "The base-of-support configuration used during the exercise.", inputs: "Foot or hand contact pattern, unilateral versus bilateral setup, and whether the body is supported or free-standing.", read: "Stance influences balance, load sharing, and which constraints apply." },
  resistanceCurve: { label: "Resistance curve", meaning: "How the task's challenge changes from the start to the end of a repetition.", inputs: "Joint leverage, gravity or cable angle, external resistance, and equipment mechanics.", read: "The bars describe relative challenge across the modeled range." },
  resistanceBias: { label: "Resistance bias", meaning: "The part of the range where the exercise tends to feel most mechanically demanding.", inputs: "The estimated resistance curve and the joint positions where leverage is least favorable.", read: "A bias label is a practical comparison cue; exercise setup can move the challenge within the range." },
  stickingRegion: { label: "Likely sticking region", meaning: "The range where a lifter may have the least mechanical advantage or greatest coordination challenge.", inputs: "Leverage, resistance direction, range of motion, and typical task constraints.", read: "It is a likely bottleneck, not a prediction that every athlete will fail at that exact point." },
  localFatigue: { label: "Local fatigue", meaning: "The expected fatigue concentrated in the muscles doing the work.", inputs: "Target-muscle loading, range of motion, contraction duration, and the amount of repeated local work.", read: "Higher values mean more localized fatigue cost in this comparison model." },
  systemicFatigue: { label: "Systemic fatigue", meaning: "The broader whole-body recovery cost the exercise can create.", inputs: "Total muscle mass involved, load, work duration, conditioning demand, and complexity.", read: "Higher values suggest the exercise may be more globally fatiguing; recovery differs by athlete and dosage." },
  axialFatigue: { label: "Axial fatigue", meaning: "The estimated loading and bracing cost through the trunk and spine.", inputs: "Spinal compression or shear exposure, torso angle, external load placement, and bracing demand.", read: "Higher values call for more attention to recovery and technique; they do not diagnose injury risk." },
  gripFatigue: { label: "Grip fatigue", meaning: "The expected fatigue cost to the hand and forearm gripping system.", inputs: "Handle demand, load, duration, forearm position, and whether the task limits work through grip.", read: "Higher values mean grip may become a limiting factor before the target muscles are fully challenged." },
};

/**
 * A model value on its 0-100 scale, or nothing. A missing, non-numeric or
 * out-of-range value is unavailable: it is never drawn as a zero, and never
 * clamped into a number the model did not produce.
 */
export function profileScore(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100 ? Math.round(value) : null;
}

/** A help control: an icon with a name, opening the term's explanation. Tap and keyboard alike. */
function HelpButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" className="ei-help" aria-label={`Learn about ${label}`} onClick={onClick}><Info className="h-4 w-4" aria-hidden="true" /></button>;
}

/** One score: its name, its help, its number and a bar beneath, aligned with every other row. */
function ScoreRow({ label, value, onLearn, later = false }: { label: string; value: unknown; onLearn?: () => void; later?: boolean }) {
  const score = profileScore(value);
  return <div className="ei-row" data-later={later || undefined} data-unavailable={score === null || undefined}>
    <div className="ei-row-head">
      <span className="ei-row-label">{label}</span>
      {onLearn && <HelpButton label={label} onClick={onLearn} />}
      <span className="ei-row-value">{score === null ? "Not available" : score}</span>
    </div>
    <span className="ei-bar" aria-hidden="true">{score !== null && <i style={{ width: `${score}%` }} />}</span>
  </div>;
}

/**
 * One term's explanation, over the panel. It takes focus when it opens and gives
 * it back to the label that opened it when it closes. Escape closes only this
 * layer: the panel sits inside the Exercise intelligence sheet, which also closes
 * on Escape, so the key is caught on the way down and goes no further.
 */
function GenomeLearnOverlay({ term, onClose }: { term: LearnKey; onClose: () => void }) {
  const layerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | SVGElement | null;
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      // A layer opened over the explanation, such as search, handles its own keys.
      if (isKeyForAnotherLayer(event, layerRef.current)) return;
      if (event.key === "Escape") { event.stopPropagation(); onCloseRef.current(); return; }
      // The close button is the only control in the card, so Tab stays on it.
      if (event.key === "Tab") { event.preventDefault(); closeRef.current?.focus(); }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);
  const info = genomeTermInfo[term];
  const parts: { label: string; body: string }[] = [
    { label: "What it means", body: info.meaning },
    { label: "What the model weighs", body: info.inputs },
    ...(term in labels ? [{ label: "What changes with context", body: "The fingerprint index is a standardized catalog comparison. Its planning value changes with the athlete's goal and how distinct the exercise is from the current stack; those inputs feed Contextual fit rather than turning the fingerprint into a direct athlete measurement." }] : []),
    { label: "How to read the number", body: info.read },
  ];
  /*
   * At the body, not inside the panel (Oct 2 brief §2). The card is a light surface,
   * and inside the dark analysis sheet every heading and paragraph of it was
   * repainted with the sheet's text colours - `.exercise-intelligence .genome-panel
   * :is(h4, strong, p ...)` - so it read near-white on white (1.04:1). A modal lives
   * in the modal layer; nothing in the page it covers can reach into it.
   */
  return createPortal(<div ref={layerRef} className="genome-learn-overlay" role="dialog" aria-modal="true" aria-label={`${info.label} explained`}><div className="genome-learn-card sg-surface-light"><button ref={closeRef} type="button" onClick={onClose} aria-label="Close term explanation" className="genome-learn-close"><X className="h-4 w-4" aria-hidden="true" /></button><p className="genome-learn-eyebrow">Genome term explained</p><h4>{info.label}</h4><dl className="genome-learn-parts">{parts.map((part) => <div key={part.label}><dt>{part.label}</dt><dd>{part.body}</dd></div>)}</dl><p className="genome-learn-boundary">This is a planning estimate used to compare exercises — not a lab measurement, a medical assessment, or a universal recommendation.</p></div></div>, document.body);
}

/*
 * The radar, drawn for the size it is shown at (about 300-340 CSS px wide, so one
 * unit is about a pixel). The labels sit outside the outer ring, each anchored away
 * from the plot by its angle - start on the right, end on the left, centred top and
 * bottom - with the viewBox wide enough for the longest label at the 45° positions.
 */
const chart = { width: 336, height: 264, cx: 168, cy: 130, radius: 94, labelGap: 12 };
const rings = [25, 50, 75, 100];
const axisAngle = (index: number) => (Math.PI * 2 * index) / dimensionOrder.length - Math.PI / 2;
const plotPoint = (index: number, value: number) => { const angle = axisAngle(index); const r = chart.radius * (value / 100); return [chart.cx + Math.cos(angle) * r, chart.cy + Math.sin(angle) * r] as const; };
const pointsAt = (values: number[]) => values.map((value, index) => plotPoint(index, value).map((n) => n.toFixed(1)).join(",")).join(" ");

function ProfileRadar({ scores }: { scores: Record<GenomeDimension, number> }) {
  const values = dimensionOrder.map((key) => scores[key]);
  const description = `Profile chart, each dimension out of 100: ${dimensionOrder.map((key) => `${labels[key]} ${scores[key]}`).join(", ")}.`;
  return <svg className="ei-radar-svg" viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-label={description}>
    {rings.map((level) => <polygon key={level} className={level === 100 ? "ei-radar-edge" : "ei-radar-ring"} points={pointsAt(dimensionOrder.map(() => level))} />)}
    {dimensionOrder.map((key, index) => { const [x, y] = plotPoint(index, 100); return <line key={key} className="ei-radar-spoke" x1={chart.cx} y1={chart.cy} x2={x} y2={y} />; })}
    <polygon className="ei-radar-shape" points={pointsAt(values)} />
    {values.map((value, index) => { const [x, y] = plotPoint(index, value); return <circle key={dimensionOrder[index]} className="ei-radar-point" cx={x} cy={y} r={3} />; })}
    {dimensionOrder.map((key, index) => {
      const angle = axisAngle(index);
      const cos = Math.cos(angle), sin = Math.sin(angle);
      const reach = chart.radius + chart.labelGap;
      const x = chart.cx + cos * reach;
      const lines = radarLabels[key];
      const anchor = cos > 0.3 ? "start" : cos < -0.3 ? "end" : "middle";
      // Above the plot the text grows upward from its baseline, below it downward, beside it centred.
      const lineHeight = 15;
      const firstBaseline = sin < -0.3 ? chart.cy + sin * reach - (lines.length - 1) * lineHeight - 2 : sin > 0.3 ? chart.cy + sin * reach + 12 : chart.cy + 5 - ((lines.length - 1) * lineHeight) / 2;
      return <text key={key} className="ei-radar-label" x={x} y={firstBaseline} textAnchor={anchor} fontSize={13.5}>{lines.map((line, lineIndex) => <tspan key={line} x={x} dy={lineIndex === 0 ? 0 : lineHeight}>{line}</tspan>)}</text>;
    })}
  </svg>;
}

/** The catalog id an entry stands for: a planned entry can carry its own instance id. */
const catalogIdOf = (exercise: Exercise) => (exercise as Exercise & { catalogExerciseId?: number }).catalogExerciseId || exercise.id;

/** "Strength expression (95)": a dimension as the summary names it. */
const named = (key: GenomeDimension, value: number) => `${labels[key].toLowerCase()} (${value})`;
const capitalised = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * The profile in one sentence: its two highest scores and its lowest, by value
 * alone. No threshold calls a score high or low - the model documents none for
 * the fingerprint - so the sentence ranks and quotes, and says nothing more.
 */
export function profileSummary(genome: ExerciseGenome | undefined): string {
  if (!genome) return "No analysis profile is recorded for this exercise in the catalog.";
  const ranked = dimensionOrder
    .map((key, order) => ({ key, order, value: profileScore(genome.fingerprint[key]) }))
    .filter((entry): entry is { key: GenomeDimension; order: number; value: number } => entry.value !== null)
    .sort((a, b) => b.value - a.value || a.order - b.order);
  if (!ranked.length) return "This exercise's profile scores are not available.";
  const [first, second] = ranked;
  const lowest = ranked[ranked.length - 1];
  const highest = second ? `${named(first.key, first.value)} and ${named(second.key, second.value)}` : named(first.key, first.value);
  const showLowest = ranked.length > 2 && lowest.value < (second?.value ?? first.value);
  return `Highest in ${highest}${showLowest ? `; lowest in ${named(lowest.key, lowest.value)}` : ""}.`;
}

/**
 * Workout fit, from the comparison the model actually made. It compares the exercise
 * with the other exercises in the day it would be added to; with nothing else there,
 * there was no comparison, and it says so instead of claiming the exercise adds
 * something "without repeating the stack".
 */
export function workoutFitSummary({ exercise, context, workoutLabel, redundancy }: { exercise: Exercise; context: GenomeContext; workoutLabel: string; redundancy: number | null }): string {
  const inWorkout = context.currentWorkout.some((item) => catalogIdOf(item) === exercise.id);
  const others = context.currentWorkout.filter((item) => catalogIdOf(item) !== exercise.id && getExerciseGenome(item));
  const already = inWorkout ? `Already in ${workoutLabel}. ` : "";
  if (!others.length || redundancy === null) return inWorkout ? `${already}Nothing else is in it yet, so there is nothing to compare it with.` : `Nothing is in ${workoutLabel} yet, so there is nothing to compare it with.`;
  const count = `${others.length} other exercise${others.length === 1 ? "" : "s"}`;
  const overlap = redundancy > logicCalibration.exerciseGenome.highRedundancyReview
    ? `Overlaps with the ${count} in ${workoutLabel}: best as a replacement for something similar, or to fill a specific gap.`
    : `Adds a relatively distinct exposure next to the ${count} in ${workoutLabel}.`;
  return `${already}${overlap}`;
}

/** How the exercise stands to the sport movement in view, by name, in one line. */
function movementLinkSummary(movementName: string | null, label: string, detail: string): { tier: string | null; text: string } {
  if (!movementName) return { tier: null, text: "No sport movement is selected." };
  if (label === "Not mapped") return { tier: null, text: `No mapped link to ${movementName} in this catalog.` };
  return { tier: label, text: `${detail.replace(/\.$/, "")}.` };
}

/**
 * What the sport-action tier is and is not. It is the exercise's movement support
 * tier (lib/movementSupport), with no number: the panel used to print a 0-100
 * "match" from another engine beside it, and the two disagreed.
 */
const actionBoundary = "This says how the exercise relates to that action's movement record. It is not proof that training it improves your skill on the field.";

/** Content the sheet that hosts the panel puts into its views: photographs, the anatomy, the sport card, the evidence. */
export type GenomePanelSlots = { media?: ReactNode; profileFoot?: ReactNode; muscles?: ReactNode; sport?: ReactNode; evidence?: ReactNode };

export function ExerciseGenomePanel({ exercise, context, supabaseEvidence, compactHead = false, tab: controlledTab, onTabChange, workoutLabel = "this workout", slots = {} }: {
  exercise: Exercise;
  context: GenomeContext;
  supabaseEvidence?: SupabaseExerciseEvidence;
  /** Inside the Exercise Intelligence overlay the name is the sheet's title, so the panel carries none. */
  compactHead?: boolean;
  /** The view shown, when the host draws the tab list itself (the sheet does, in its fixed header). */
  tab?: GenomeTab;
  onTabChange?: (tab: GenomeTab) => void;
  /** The day the current workout is, as the add destination names it ("Week 1 · Push"). */
  workoutLabel?: string;
  slots?: GenomePanelSlots;
}) {
  const [ownTab, setOwnTab] = useState<GenomeTab>("fingerprint");
  const tab = controlledTab ?? ownTab;
  const setTab = (next: GenomeTab) => { if (onTabChange) onTabChange(next); else setOwnTab(next); };
  const [learnedTerm, setLearnedTerm] = useState<LearnKey | null>(null);
  const [showAllDimensions, setShowAllDimensions] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const genome = useMemo(() => getExerciseGenome(exercise) as ExerciseGenome | undefined, [exercise]);
  const evidenceCoverage = useMemo(() => exerciseEvidenceCoverage(exercise), [exercise]);
  // The day's exercises the model can read. One the catalog does not hold has no profile to compare.
  const modelContext = useMemo<GenomeContext>(() => ({ ...context, currentWorkout: context.currentWorkout.filter((item) => getExerciseGenome(item)) }), [context]);
  const analysis = useMemo(() => (genome ? analyzeExerciseContext(exercise, modelContext) : null), [exercise, modelContext, genome]);
  const selectedActionConnection = useMemo(() => {
    const movement = context.sportMovement;
    const enrichedMovement = movement ? lookupEnrichedMovement(movement.sportId, movement.id) : undefined;
    return getExerciseActionConnection(exercise, enrichedMovement);
  }, [exercise, context.sportMovement]);
  const workoutGenome = useMemo(() => getWorkoutGenome(modelContext.currentWorkout), [modelContext.currentWorkout]);
  const learn = (key: LearnKey) => () => setLearnedTerm(key);
  const muscleRoleTerms: Record<"Prime mover" | "Synergist" | "Stabilizer", LearnKey> = { "Prime mover": "primeMover", Synergist: "synergist", Stabilizer: "stabilizer" };

  const movementName = context.sportMovement ? movementDisplayLabel(context.sportMovement.label) : null;
  const movementLink = movementLinkSummary(movementName, selectedActionConnection.label, selectedActionConnection.detail);
  const workoutFit = workoutFitSummary({ exercise, context: modelContext, workoutLabel, redundancy: analysis && modelContext.currentWorkout.some((item) => catalogIdOf(item) !== exercise.id) ? analysis.redundancy : null });
  const goalKey = goalDimensionFor(context.goal);
  const goalScore = genome ? profileScore(genome.fingerprint[goalKey]) : null;
  const scores = genome?.fingerprint;
  const allScored = Boolean(scores && dimensionOrder.every((key) => profileScore(scores[key]) !== null));
  const unavailableCount = scores ? dimensionOrder.filter((key) => profileScore(scores[key]) === null).length : dimensionOrder.length;
  const laterNames = dimensionOrder.filter((key) => laterDimensions.has(key)).map((key) => labels[key].toLowerCase());

  const panelProps = (id: GenomeTab) => ({ id: genomePanelId(id), role: "tabpanel", "aria-labelledby": genomeTabId(id), className: `ei-view ei-view-${id}` });

  return <section className="ei-panel" aria-label={compactHead ? "Exercise analysis" : undefined}>
    {!compactHead && <div className="ei-panel-head"><p className="ei-eyebrow">Exercise analysis</p><h3>{exercise.name}</h3></div>}
    {controlledTab === undefined && <ExerciseAnalysisTabs tab={tab} onChange={setTab} />}

    {tab === "fingerprint" && <div {...panelProps("fingerprint")}>
      <section className="ei-glance" aria-labelledby="ei-glance-title">
        <h2 id="ei-glance-title" className="ei-section-title">At a glance</h2>
        <p className="ei-glance-lead">{profileSummary(genome)}</p>
        <dl className="ei-glance-lines">
          <div><dt>Workout fit</dt><dd>{workoutFit}{goalScore !== null && <> For your goal, {context.goal.toLowerCase()}, the profile reads {labels[goalKey].toLowerCase()}: {goalScore}.</>}</dd></div>
          <div><dt>Movement link{movementName && <span className="ei-glance-movement"> · {movementName}</span>}</dt><dd>{movementLink.tier && <span className="ei-tier-tag">{movementLink.tier}</span>}{movementLink.text} <button type="button" className="ei-link" onClick={() => { setTab("context"); /* The link leaves with this view; focus goes to the tab it opened. */ requestAnimationFrame(() => document.getElementById(genomeTabId("context"))?.focus({ preventScroll: true })); }}>Sport context</button></dd></div>
        </dl>
      </section>
      {slots.media && <div className="ei-media">{slots.media}</div>}
      <section className="ei-profile" aria-labelledby="ei-profile-title">
        <div className="ei-section-head">
          <h2 id="ei-profile-title" className="ei-section-title">Profile</h2>
          <p className="ei-scale">Each score is out of 100 and compares this exercise with the others in the catalog. They are not percentages.</p>
        </div>
        {!scores ? <p className="ei-empty">No profile scores are recorded for this exercise.</p> : <div className="ei-profile-body" data-all={showAllDimensions || undefined} data-chart={showChart || undefined}>
          <div className="ei-dimensions">
            {dimensionGroups.map((group) => <div key={group.id} className="ei-group" data-later={group.dimensions.every((key) => laterDimensions.has(key)) || undefined}>
              <h3 className="ei-group-title">{group.title}</h3>
              <p className="ei-group-reading">{group.reading}</p>
              {group.dimensions.map((key) => <ScoreRow key={key} label={labels[key]} value={scores[key]} onLearn={learn(key)} later={laterDimensions.has(key)} />)}
            </div>)}
            <button type="button" className="ei-more" aria-expanded={showAllDimensions} onClick={() => setShowAllDimensions((open) => !open)}>
              <span>{showAllDimensions ? "Show fewer dimensions" : "Show all 8 dimensions"}<ChevronDown className="h-4 w-4" aria-hidden="true" /></span>
              {!showAllDimensions && <small>Also {laterNames.slice(0, -1).join(", ")} and {laterNames[laterNames.length - 1]}</small>}
            </button>
          </div>
          <button type="button" className="ei-chart-toggle" aria-expanded={showChart} onClick={() => setShowChart((open) => !open)}>{showChart ? "Hide profile chart" : "Show profile chart"}<ChevronDown className="h-4 w-4" aria-hidden="true" /></button>
          <figure className="ei-radar">
            {allScored ? <ProfileRadar scores={scores} /> : <p className="ei-empty">The chart needs all eight scores; {unavailableCount} {unavailableCount === 1 ? "is" : "are"} not available for this exercise.</p>}
            {allScored && <figcaption>Distance from the centre is the score: 0 at the centre, 100 at the outer edge, rings every 25.</figcaption>}
          </figure>
        </div>}
      </section>
      {slots.profileFoot}
      <details className="ei-disclosure"><summary>How this profile works<ChevronDown className="h-4 w-4" aria-hidden="true" /></summary><div>
        <p>Each profile score is out of 100. It compares exercises in this catalog with each other, from how the movement works and how it is usually programmed. None of them measures force, muscle activation or fatigue in your body. Training potential is what an exercise can develop; demands are what it asks of you; the trade-offs are its stimulus for the fatigue it costs, and how easy it is to run.</p>
        <p><strong>{evidenceCoverage.confidence} evidence coverage.</strong> {evidenceCoverage.sourceRange}. {evidenceCoverage.directScope} {evidenceCoverage.planningBoundary}</p>
        {supabaseEvidence?.status === "connected" && <section className="ei-research" aria-label="Connected research evidence record"><p className="ei-eyebrow">Connected research record</p><p>{supabaseEvidence.coverageLabel}{supabaseEvidence.anchorMetric ? ` · ${supabaseEvidence.anchorMetric.replace(/_/g, " ")}` : ""}</p>{supabaseEvidence.source && <p><a href={supabaseEvidence.source.sourceUrl} target="_blank" rel="noreferrer">{supabaseEvidence.source.title}{supabaseEvidence.source.publicationYear ? ` (${supabaseEvidence.source.publicationYear})` : ""}</a>{supabaseEvidence.source.studyType ? ` · ${supabaseEvidence.source.studyType}` : ""}{supabaseEvidence.source.populationSummary ? ` · ${supabaseEvidence.source.populationSummary}` : ""}</p>}<p>{supabaseEvidence.normativeRecordCount ? `${supabaseEvidence.normativeRecordCount} source norm record${supabaseEvidence.normativeRecordCount === 1 ? "" : "s"}` : "No source norm record"}{supabaseEvidence.sourceOutcomeCount ? ` · ${supabaseEvidence.sourceOutcomeCount} recorded source outcome${supabaseEvidence.sourceOutcomeCount === 1 ? "" : "s"} indexed` : ""}. {supabaseEvidence.boundary}</p>{supabaseEvidence.sourceOutcomeMetrics.length > 0 && <p>Indexed outcome variables: {supabaseEvidence.sourceOutcomeMetrics.join(", ")}. Variables are source labels, not normalized personal measurements or scores.</p>}</section>}
        <p>Published research, planning estimates, app limits, and your own logged lifts are kept apart and labeled separately. A number never gets presented as a measurement just because it looks precise.</p>
        <ul>{evidenceTraceability.filter((entry) => ["programming-anchors", "rpe-log-context", "relative-model-calibration"].includes(entry.id)).map((entry) => <li key={entry.id}><strong>{entry.kind}:</strong> {entry.rationale} {entry.sourceUrls?.map((url, index) => <a className="ml-1" key={url} href={url} target="_blank" rel="noreferrer">source {index + 1}</a>)}</li>)}</ul>
      </div></details>
    </div>}

    {tab === "muscles" && <div {...panelProps("muscles")}>
      {slots.muscles}
      <section className="ei-section" aria-labelledby="ei-muscles-title">
        <h2 id="ei-muscles-title" className="ei-section-title">Muscle by muscle</h2>
        <p className="ei-section-note">Each muscle the catalog lists for this exercise, with the model's involvement and loading estimates out of 100.</p>
        {!genome || genome.muscleProfile.length === 0 ? <p className="ei-empty">No muscles are recorded for this exercise.</p> : <div className="ei-muscles">{genome.muscleProfile.map((entry) => <article className="ei-muscle" key={entry.muscle}>
          <div className="ei-muscle-head"><GradeStamp grade={entry.tier} label="Muscle involvement tier" compact /><div className="min-w-0"><h3>{entry.anatomicalLabel}</h3><p className="ei-muscle-role"><span>{entry.role}</span><HelpButton label={entry.role} onClick={learn(muscleRoleTerms[entry.role])} /><span aria-hidden="true">·</span><span>{`Estimated ${entry.contribution}/100 involvement`}</span><HelpButton label="Muscle-targeting rank" onClick={learn("contribution")} /></p></div></div>
          <p className="ei-muscle-why">{entry.why}</p>
          <div className="ei-muscle-meters"><ScoreRow label="Mechanical loading" value={entry.mechanicalLoading} onLearn={learn("mechanicalLoading")} /><ScoreRow label="Long-length challenge" value={entry.longLengthLoading} onLearn={learn("longLengthLoading")} /><ScoreRow label="Peak contraction" value={entry.peakContraction} onLearn={learn("peakContraction")} /><ScoreRow label="Stabilization demand" value={entry.stabilizationDemand} onLearn={learn("stabilizationDemand")} /></div>
        </article>)}</div>}
      </section>
    </div>}

    {tab === "mechanics" && <div {...panelProps("mechanics")}>
      {!genome ? <p className="ei-empty">No mechanics are recorded for this exercise.</p> : <>
        <section className="ei-section" aria-labelledby="ei-movement-title">
          <h2 id="ei-movement-title" className="ei-section-title">How it moves</h2>
          <div className="ei-fact-block"><h3 className="ei-group-title">Movement pattern<HelpButton label="Movement pattern" onClick={learn("movementPattern")} /></h3><ul className="ei-chips">{genome.movementPatterns.map((pattern) => <li key={pattern}>{pattern}</li>)}</ul></div>
          <div className="ei-fact-block"><h3 className="ei-group-title">Joint actions<HelpButton label="Joint action" onClick={learn("jointAction")} /></h3><ul className="ei-chips ei-chips-soft">{genome.jointActions.map((action) => <li key={action}>{action}</li>)}</ul></div>
          <dl className="ei-facts">
            <div><dt>Force direction<HelpButton label="Force direction" onClick={learn("forceDirection")} /></dt><dd>{genome.forceDirection}</dd></div>
            <div><dt>Kinetic chain<HelpButton label="Kinetic chain" onClick={learn("kineticChain")} /></dt><dd>{genome.chain} chain</dd></div>
            <div><dt>Stance<HelpButton label="Stance" onClick={learn("stance")} /></dt><dd>{genome.stance}</dd></div>
          </dl>
        </section>
        <section className="ei-section" aria-labelledby="ei-resistance-title">
          <h2 id="ei-resistance-title" className="ei-section-title">Resistance profile<HelpButton label="Resistance curve" onClick={learn("resistanceCurve")} /></h2>
          <p className="ei-section-note">Relative challenge across one repetition, start to finish.</p>
          <div className="ei-curve" role="img" aria-label={`Relative challenge from the start to the end of the repetition: ${genome.resistanceProfile.curve.join(", ")}`}>{genome.resistanceProfile.curve.map((value, index) => <span key={index} style={{ height: `${profileScore(value) ?? 0}%` }} />)}</div>
          <div className="ei-curve-axis" aria-hidden="true"><span>Start</span><span>Finish</span></div>
          <dl className="ei-facts">
            <div><dt>Challenge bias<HelpButton label="Resistance bias" onClick={learn("resistanceBias")} /></dt><dd>{genome.resistanceProfile.bias}</dd></div>
            <div><dt>Likely sticking region<HelpButton label="Likely sticking region" onClick={learn("stickingRegion")} /></dt><dd>{genome.resistanceProfile.stickingRegion}</dd></div>
          </dl>
        </section>
        <section className="ei-section" aria-labelledby="ei-fatigue-title">
          <h2 id="ei-fatigue-title" className="ei-section-title">Fatigue cost</h2>
          <p className="ei-group-reading">Out of 100. Higher means more fatigue in that area: a cost, not a benefit.</p>
          <ScoreRow label="Local fatigue" value={genome.fatigue.local} onLearn={learn("localFatigue")} />
          <ScoreRow label="Systemic fatigue" value={genome.fatigue.systemic} onLearn={learn("systemicFatigue")} />
          <ScoreRow label="Axial fatigue" value={genome.fatigue.axial} onLearn={learn("axialFatigue")} />
          <ScoreRow label="Grip fatigue" value={genome.fatigue.grip} onLearn={learn("gripFatigue")} />
        </section>
      </>}
      <details className="ei-disclosure"><summary>Mechanics evidence scope<ChevronDown className="h-4 w-4" aria-hidden="true" /></summary><div><p>These sources explain how the movement generally works and where the estimates are uncertain. They do not measure your own muscle force, tendons, activation, injury risk, or performance.</p><ul>{mechanicsEvidenceSources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label}</a></li>)}</ul></div></details>
    </div>}

    {tab === "context" && <div {...panelProps("context")}>
      {slots.sport ?? <section className="ei-section ei-sport" aria-label="Sport action in view"><p className="ei-eyebrow">Sport action in view</p><p className="ei-sport-name">{movementName ?? "No selected action"}</p><span className="ei-tier-tag">{selectedActionConnection.label}</span><p className="ei-section-note">{selectedActionConnection.detail} {actionBoundary}</p></section>}
      {analysis && <section className="ei-section" aria-labelledby="ei-fit-title">
        <div className="ei-section-head-row"><h2 id="ei-fit-title" className="ei-section-title">Contextual fit<HelpButton label="Contextual fit" onClick={learn("contextualFit")} /></h2><GradeStamp grade={analysis.grade} label="Contextual fit" compact /></div>
        <p className="ei-section-note">How this exercise fits your goal ({context.goal}) and what it adds to {workoutLabel}. A planning comparison, not a direct performance measurement.</p>
        <dl className="ei-stats">
          <div><dt>Contextual utility</dt><dd><strong>{analysis.contextualScore}</strong><span>The summary behind the grade</span></dd></div>
          <div><dt>Goal alignment</dt><dd><strong>{analysis.signals.goalAlignment}</strong><span>{labels[goalKey]} for your goal</span></dd></div>
          <div><dt>Stack distinctness</dt><dd><strong>{analysis.signals.stackDistinctness}</strong><span>What it adds beyond {workoutLabel}</span></dd></div>
          <div><dt>Recovery manageability</dt><dd><strong>{analysis.signals.recoveryManageability}</strong><span>Higher means an easier recovery cost</span></dd></div>
        </dl>
        <div className="ei-lists">
          <div><h3 className="ei-group-title">What supports it</h3><ul>{analysis.strengths.map((item) => <li key={item}><ChartNoAxesCombined className="h-4 w-4" aria-hidden="true" />{item}</li>)}</ul></div>
          <div><h3 className="ei-group-title">Trade-offs to consider</h3><ul>{analysis.limits.map((item) => <li key={item}><ShieldAlert className="h-4 w-4" aria-hidden="true" />{item}</li>)}</ul></div>
        </div>
      </section>}
      {genome && <section className="ei-section" aria-labelledby="ei-workout-title">
        <h2 id="ei-workout-title" className="ei-section-title">{capitalised(workoutLabel)}</h2>
        <p className="ei-section-note">{modelContext.currentWorkout.length === 0 ? "Nothing is planned in it yet." : workoutGenome.redundancy > logicCalibration.exerciseGenome.highRedundancyReview ? "The current stack repeats similar exposure. This exercise needs a specific role to earn its place." : "The stack has room for differentiated stimulus if this exercise fills a useful objective."}</p>
        {workoutGenome.gaps.length > 0 && <ul className="ei-chips ei-chips-soft" aria-label="Patterns the day does not train yet">{workoutGenome.gaps.slice(0, 3).map((gap) => <li key={gap}>Missing {gap}</li>)}</ul>}
        <h3 className="ei-group-title">Adaptation opportunity</h3>
        <p className="ei-section-note">Primary: <strong>{genome.adaptation.primary.join(" · ")}</strong> · Secondary: <strong>{genome.adaptation.secondary.join(" · ")}</strong>. {genome.adaptation.rationale}</p>
      </section>}
      <section className="ei-section" aria-labelledby="ei-catalog-title">
        <h2 id="ei-catalog-title" className="ei-section-title">Catalog record</h2>
        <p className="exercise-intelligence-tier"><span aria-hidden="true">Catalog tier</span><GradeStamp grade={exercise.muscleGrade} label="Catalog tier" compact /></p>
        <p className="exercise-intelligence-tier-note">Catalog tier {exercise.muscleGrade} is a general label from the exercise catalog, not how closely this exercise matches a movement.</p>
      </section>
      {slots.evidence}
      {genome && <p className="ei-confidence">Confidence: {genome.evidence.confidence} · {genome.evidence.quality}. {genome.evidence.note} Each number here comes from the exercise catalog — it is not a rating of your skill, performance, or strength.</p>}
    </div>}
    {learnedTerm && <GenomeLearnOverlay term={learnedTerm} onClose={() => setLearnedTerm(null)} />}
  </section>;
}
