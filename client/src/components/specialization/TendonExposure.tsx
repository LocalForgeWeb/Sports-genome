import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import type { AthleteEquipmentProfile } from "@/lib/equipmentProfile";
import type { Exercise } from "@/lib/exerciseCatalog";
import { parseSetCount } from "@/lib/sessionVolume";
import { boutsFromSessions, excludedRecordsFromSessions } from "@/lib/specialization/bouts";
import type { SpecializationExclusions } from "@/lib/specialization/exclusions";
import { boutsFromPlan, plannedExercisesInWeek, prescriptionOf } from "@/lib/specialization/planBouts";
import { recommendFor, type RecommendationCandidate } from "@/lib/specialization/recommendations";
import { useRegionExtras } from "@/lib/specialization/regionExtras";
import { planRevision, sourceRevision } from "@/lib/specialization/revision";
import { catalogMusclesLookup, computeSpecializationSummary, planningVariantsFor, useDeviceWorkoutSessions } from "@/lib/specialization/useSpecializationSummary";
import type { SpecializationAreaReport, SpecializationPlanBatchChange, SpecializationPlanChange, SpecializationPlanChangeResult, SpecializationStackProps } from "@/lib/specialization/viewState";
import { loadDay, type DaySlot, type WeeklyDayStore } from "@/lib/trainingDayPlan";
import type { DisplayWeightUnit } from "@/lib/weightUnits";
import type { TrainingGoal } from "@/lib/workoutPlanner";
import { variantForCatalogId } from "@shared/specialization/exposure";
import { tendonMethodCitations, tendonMethodSources } from "@shared/specialization/sources/tendonMethod";
import {
  TENDON_EARLIER_WEEKS,
  finishedWorkoutsOf,
  tendonExposure,
  tendonWeekCounts,
  tendonWeekCountsKey,
  type TendonAreaView,
  type TendonBaselineWeek,
  type TendonChange,
  type TendonChangeSet,
  type TendonCounts,
  type TendonExposure as TendonExposureView,
  type TendonMetric,
  type TendonPlannedEntry,
  type TendonSetLists,
  type TendonWeekCounts,
} from "@shared/specialization/tendonAreas";
import { localDateKey, planWeekInterval } from "@shared/specialization/time";
import type { ExposureBout, RegionBoutRow, RegionExtras, SpecializationGoal, SpecializationRegionData, SpecializationSummary } from "@shared/specialization/types";
import { BoutListSheet, type BoutList } from "./BoutListSheet";
import { otherWorkWords } from "./model";
import { PlanChangeSheet } from "./PlanChangeSheet";
import "./tendon.css";

/**
 * Tendon exposure (docs/specialization-atlas/11-forearm-research-and-stack.md §4.3–§4.6, lane T3): sets
 * counted by the place their muscles attach, for a region whose content sets `sections.tendonExposure`
 * and whose extras carry `tendonAreas`. The page mounts this when the closed card first opens and keeps
 * it mounted (as Progress), so its code, the region's areas and the six summaries of an open are
 * fetched and made then, never with the page.
 *
 * Open, in §4.3's order: the lede; the areas as a 2 × 2 grid of outlined buttons (one chosen) with the
 * window's count, and once under it that the areas are not added together; the chosen area's groups
 * (Completed mode only); its day columns, each a stacked target · holds · other bar opening that day's
 * sets; its holds as text; in Completed mode last week beside the 4 weeks before, with the change words,
 * and when last week is above every known earlier week a neutral prompt with "See these sets" and the
 * trained plan week's entries at that area, each with −1 set, Move, Take out (all acting at once,
 * with Undo) and Swap (the add sheet in swap mode); what is kept apart; and its own "How this is
 * counted".
 *
 * Copy: §4.4's, and never a word of its list (risk, safe, threshold and the rest; a render test reads
 * every string this can render, sheets included, and refuses "%"). No icon of alarm, no colour of its
 * own: the page's key colours and tokens only. Region-agnostic: every region word comes from the
 * region's data, and nothing here names a region, a muscle or a side.
 */

export type TendonExposureProps = {
  data: SpecializationRegionData;
  /** The page's own summary (its side, window and mode); null while the page has none. */
  summary: SpecializationSummary | null;
  /** What the page says while it has no summary. */
  waiting: string;
  /** The page's window, for the words of a quiet area ("this week"). */
  window: "week" | "7d" | "custom";
  /** The plan week being trained: "Planned in Week N" reads it whatever the window shows. */
  trainingWeek: number;
  plan: { ready: boolean; slots: DaySlot[]; weeks: Record<number, WeeklyDayStore> };
  catalog: Exercise[];
  equipmentProfile: AthleteEquipmentProfile;
  exclusions: SpecializationExclusions;
  /** The region's targets, as the page reads its summaries (one cache entry for the plan week). */
  goals: readonly SpecializationGoal[];
  goal: TrainingGoal;
  accountId: string | number | null;
  nowIso: string;
  timeZone: string;
  weightUnit: DisplayWeightUnit;
  aboutMeArea: SpecializationAreaReport | null;
  /** The stack's entries in the trained plan week, so a row the stack wrote links to it. */
  stackEntries: readonly { dayKey: string; catalogExerciseId: number }[];
  onApplyPlanChanges: SpecializationStackProps["onApplyPlanChanges"] | undefined;
  onApplyPlanChange: (change: SpecializationPlanChange) => SpecializationPlanChangeResult;
  /** Opens the stack card on one of its entries; null on a region with no stack. */
  onOpenStackEntry: ((entry: { dayKey: string; catalogExerciseId: number }) => void) | null;
  onOpenSession: (sessionId: string) => void;
  onInspectExercise: (catalogExerciseId: number | null, name: string) => void;
  announce: (text: string) => void;
  /** An area asked for from outside ("See tendon exposure" on a muscle): chosen when `n` changes. */
  focusArea: { areaId: string | null; n: number };
};

const BAR_FULL = 12;
const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;
const lowerFirst = (text: string) => (text ? text.charAt(0).toLowerCase() + text.slice(1) : text);
/** A median or a change of an even number of weeks can end in .5, said as it is ("2.5 sets"). */
const numberWords = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1));
/** Seconds as the page says them, halves kept: "45 s", "3 min 10 s", "2 min 12.5 s". */
function timeWords(seconds: number): string {
  if (seconds < 60) return `${numberWords(seconds)} s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds - minutes * 60;
  return rest ? `${minutes} min ${numberWords(rest)} s` : `${minutes} min`;
}
/** Items as a sentence's list: "4, 3, 1 and 4". */
const listWords = (items: readonly string[]) => (items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`);

// ---------------------------------------------------------------- the copy (11 §4.4)

export const TENDON_SUMMARY = "Sets by attachment area";
export const TENDON_LEDE = "How many sets loaded the muscles that attach at each area. A set counts once per area, however many of its muscles worked. It counts sets. It does not measure what the tendon carries, and the exercise mappings do not cover everything you do.";
const TENDON_LEDE_PLANNED = "How many planned sets load the muscles that attach at each area. A set counts once per area, however many of its muscles it is planned for. It counts sets. It does not measure what the tendon carries, and the exercise mappings do not cover everything you do.";
export const TENDON_NOT_ADDED = "A set can count in two areas, so these are not added together.";
export const TENDON_OTHER_KEY = `Other: ${otherWorkWords} work.`;
export const TENDON_PROMPT = "More than in any of the 4 weeks before. You can look at the sets behind it, or change a planned exercise below.";
const TENDON_PROMPT_NO_PLAN = "More than in any of the 4 weeks before. You can look at the sets behind it.";
export const TENDON_LEFT_OUT = "Weeks with no finished workout are left out, not counted as zero.";
export const TENDON_METHOD_NOTE = "Counts distinct sets per area from the reviewed exercise mappings. Loading can help tendons adapt. Logged weight is not tendon force, and no study found ties a set count to how a tendon will respond, so the page shows no ratio or cut-off. A week counts once one workout in it is finished, so a partly logged week can lower the median. Warm-ups are not marked in the logger, so any you logged are counted here as work.";

/** What About me's answer says, in the athlete's words turned to the app's (the answer's own words are never shown: one of them reads as a cut-off). */
const aboutMeWords: Record<string, (region: string) => string> = {
  symptomatic: (region) => `your ${region} are bothering you now`,
  recent_or_returning: (region) => `you are returning after an issue with your ${region}`,
  prior_recurrent: (region) => `your ${region} have an issue that comes and goes`,
  clinician_restricted: (region) => `a clinician has told you to avoid some movements with your ${region}`,
  unsure: (region) => `you are not sure how your ${region} are`,
};
export function aboutMeSentence(area: SpecializationAreaReport, regionWord: string): string | null {
  const words = aboutMeWords[area.constraintType];
  return words ? `You told the app ${words(regionWord)} (About me). These counts are not a diagnosis.` : null;
}

type MetricNoun = { one: string; many: string };
const metricNouns: Record<Exclude<TendonMetric, "holdSeconds">, MetricNoun> = {
  sets: { one: "set", many: "sets" },
  target: { one: "target set", many: "target sets" },
  holds: { one: "hold", many: "holds" },
  other: { one: "other set", many: "other sets" },
};
/** One value of a metric in words: "25 sets", "2.5 target sets", "3 min 10 s of holds". */
function amountWords(metric: TendonMetric, value: number): string {
  if (metric === "holdSeconds") return `${timeWords(value)} of holds`;
  const noun = metricNouns[metric];
  return `${numberWords(value)} ${value === 1 ? noun.one : noun.many}`;
}
/** A signed change: "+9 sets", "−3 target sets", "+1 min 40 s"; none is "no change". */
function changeWords(metric: TendonMetric, change: number): string {
  if (change === 0) return "no change";
  const sign = change > 0 ? "+" : "−";
  const size = Math.abs(change);
  if (metric === "holdSeconds") return `${sign}${timeWords(size)}`;
  const noun = metricNouns[metric];
  return `${sign}${numberWords(size)} ${size === 1 ? noun.one : noun.many}`;
}
/** "(weeks with 4, 3, 1 and 4 finished workouts)": the known earlier weeks the median read. */
const weeksWords = (baseline: readonly TendonBaselineWeek[]) => `(weeks with ${listWords(baseline.filter((week) => week.known).map((week) => String(week.finishedWorkouts)))} finished workouts)`;

/**
 * One change line in §4.4's words, for one metric. `withWeeks` adds the known earlier weeks' finished
 * workouts beside the median (said once, on the first line). `change: null` (a group with no reviewed
 * member) has no line at all, so it never reaches here.
 */
export function changeSentence(metric: TendonMetric, change: TendonChange, withWeeks = false): string {
  const before = `the ${TENDON_EARLIER_WEEKS} weeks before`;
  switch (change.state) {
    case "no_workout_last_week":
      return "No finished workout logged last week; nothing to compare.";
    case "building_baseline":
      return `Building your baseline: ${change.knownWeeks} of the ${change.neededWeeks} earlier weeks needed have a finished workout.`;
    case "some_untimed": {
      const last = `${timeWords(change.last)} recorded${change.lastHoldsWithoutTime ? `, ${plural(change.lastHoldsWithoutTime, "hold")} with no time recorded` : ""}`;
      const weeks = change.baseline.map((week) => (!week.known ? "no finished workout" : `${timeWords(week.value ?? 0)}${week.holdsWithoutTime ? ` and ${plural(week.holdsWithoutTime, "hold")} with no time` : ""}`));
      return `Hold time is not compared, because some holds in these weeks have no time recorded. Last week: ${last}. ${before.charAt(0).toUpperCase()}${before.slice(1)}: ${weeks.join(" · ")}.`;
    }
    case "none":
      return `None last week or in ${before}.`;
    case "new":
      return `New: ${amountWords(metric, change.last)} last week; none in ${before}.`;
    case "change": {
      const parts = [
        `Last week: ${amountWords(metric, change.last)}`,
        `median of ${before}: ${metric === "holdSeconds" ? timeWords(change.median) : numberWords(change.median)}${withWeeks ? ` ${weeksWords(change.baseline)}` : ""}`,
        changeWords(metric, change.change),
      ];
      if (change.aboveEveryKnownWeek) parts.push("more than in any of those weeks");
      return `${parts.join(" · ")}.`;
    }
  }
}

/** Whether a change line puts last week above every known earlier week: the prompt's one gate (never `new` alone). */
export const aboveEveryWeek = (change: TendonChange | null | undefined) => Boolean(change && (change.state === "new" || change.state === "change") && change.aboveEveryKnownWeek);

/** "Holds: 7 sets, 3 min 10 s recorded; 1 with no time recorded." (planned: "… planned"). */
export function holdsSentence(holds: TendonCounts["holds"], planned: boolean): string | null {
  if (!holds.sets) return null;
  const sets = plural(holds.sets, "set");
  if (planned) return `Holds: ${sets}${holds.seconds > 0 ? `, ${timeWords(holds.seconds)} planned` : ""}.`;
  if (!holds.withTime) return `Holds: ${sets}, no time recorded.`;
  return `Holds: ${sets}, ${timeWords(holds.seconds)} recorded${holds.withoutTime ? `; ${holds.withoutTime} with no time recorded` : ""}.`;
}

// ---------------------------------------------------------------- the week counts, made once per key

/** The five week summaries of an open, kept by `tendonWeekCountsKey` (never the minute of `now`), the last few only. */
const weekCountsMemo = new Map<string, TendonWeekCounts>();
function rememberedWeekCounts(key: string, make: () => TendonWeekCounts): TendonWeekCounts {
  const hit = weekCountsMemo.get(key);
  if (hit) {
    weekCountsMemo.delete(key);
    weekCountsMemo.set(key, hit);
    return hit;
  }
  const made = make();
  weekCountsMemo.set(key, made);
  while (weekCountsMemo.size > 6) weekCountsMemo.delete(weekCountsMemo.keys().next().value as string);
  return made;
}
/** For tests: forget every remembered week count. */
export function clearTendonWeekCounts(): void {
  weekCountsMemo.clear();
}

// ---------------------------------------------------------------- the section

type SetsSheet = { kind: "sets"; eyebrow: string; title: string; intro: string; lists: BoutList[] };
type SwapSheet = { kind: "swap"; nodeId: string; candidates: RecommendationCandidate[]; initialExerciseId: number; dayKey: string; entryId: number; outgoing: string };
type Done = { text: string; undo: (() => void) | null };

/** One planned entry as its row shows it: the entry in its day, and what the page reads its prescription as. */
type PlannedRow = TendonPlannedEntry & { entryId: number; catalogId: number; ordinal: string; prescription: string; own: string | undefined; setCount: number; byStack: boolean };

export function TendonExposure(props: TendonExposureProps) {
  const extras = useRegionExtras(props.data.region.id);
  if (!props.summary) return <p className="spz-note" role="status">{props.waiting}</p>;
  if (extras.status === "loading") return <p className="spz-note" role="status">Loading the attachment areas…</p>;
  if (extras.status === "error") return <div className="spz-loading" role="status">
    <p className="spz-error">The attachment areas could not be loaded. Reloading usually fixes this.</p>
    <button type="button" className="spz-button" onClick={() => window.location.reload()}>Reload</button>
  </div>;
  if (!extras.extras?.tendonAreas?.length) return <p className="spz-note">No attachment areas are recorded for the {props.data.region.label.toLowerCase()} yet.</p>;
  return <TendonBody {...props} summary={props.summary} extras={extras.extras} />;
}

function TendonBody(props: TendonExposureProps & { summary: SpecializationSummary; extras: RegionExtras }) {
  const { data, summary, extras, plan, catalog, goal, trainingWeek, nowIso, timeZone, weightUnit, announce } = props;
  const regionWord = data.region.label.toLowerCase();
  const planned = summary.mode === "planned";
  const ids = useId();

  // The completed bouts as the page reads them, and its finished workouts: read once per change to the log.
  const sessions = useDeviceWorkoutSessions();
  const source = useMemo(() => sourceRevision(sessions), [sessions]);
  const bouts = useMemo<ExposureBout[]>(() => {
    const deps = { catalog, fallbackUnit: weightUnit };
    return [...boutsFromSessions(sessions, deps), ...excludedRecordsFromSessions(sessions, deps)];
    // The revision, not the array, as the page's own summary reads them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, catalog, weightUnit]);
  const finishedWorkouts = useMemo(() => finishedWorkoutsOf(sessions), [sessions]);
  const catalogMusclesFor = useMemo(() => catalogMusclesLookup(catalog), [catalog]);

  // The trained plan week as written, whatever the window shows: "Planned in Week N" (Completed mode).
  const trainedStore = plan.weeks[trainingWeek];
  const plannedInput = useMemo(() => {
    if (planned || !plan.ready || !trainedStore) return null;
    const plannedBouts = boutsFromPlan({ week: trainingWeek, slots: plan.slots, store: trainedStore, variants: planningVariantsFor(data), goal });
    const plannedSummary = computeSpecializationSummary({
      region: data, accountScope: props.accountId, interval: planWeekInterval(trainingWeek, timeZone), side: summary.side, mode: "planned", goals: props.goals,
      completedBouts: [], plannedBouts, sourceRevision: "", planRevision: planRevision(trainedStore, plan.slots, trainingWeek, goal), catalogMusclesFor, now: nowIso,
    });
    return { summary: plannedSummary, bouts: plannedBouts };
  }, [planned, plan.ready, trainedStore, trainingWeek, plan.slots, data, goal, props.accountId, timeZone, summary.side, props.goals, catalogMusclesFor, nowIso]);

  const view = useMemo<{ ok: true; view: TendonExposureView } | { ok: false }>(() => {
    try {
      const input = { region: data, extras, summary, bouts, finishedWorkouts, catalogMusclesFor, now: nowIso };
      const weekCounts = summary.mode === "completed"
        ? rememberedWeekCounts(JSON.stringify([props.accountId ?? null, weightUnit, tendonWeekCountsKey(summary, nowIso)]), () => tendonWeekCounts(input))
        : null;
      return { ok: true, view: tendonExposure({ ...input, weekCounts, planned: plannedInput }) };
    } catch {
      return { ok: false };
    }
  }, [data, extras, summary, bouts, finishedWorkouts, catalogMusclesFor, nowIso, props.accountId, weightUnit, plannedInput]);

  const [areaId, setAreaId] = useState<string | null>(props.focusArea.areaId);
  useEffect(() => { if (props.focusArea.n && props.focusArea.areaId) setAreaId(props.focusArea.areaId); }, [props.focusArea]);
  const [sheet, setSheet] = useState<SetsSheet | SwapSheet | null>(null);
  const methodRef = useRef<HTMLDetailsElement>(null);

  if (!view.ok) return <p className="spz-error" role="status">The counts by area could not be worked out.</p>;
  const counted = view.view;
  const area = counted.areas.find((item) => item.id === areaId) ?? counted.areas[0];
  const nameOf = (nodeId: string) => data.nodes.find((node) => node.id === nodeId)?.name ?? nodeId;

  /** A set list for the sheet, the non-empty ones only, in the order Target · Holds · Other · Strapped · Pending. */
  const listsOf = (lists: TendonSetLists): BoutList[] => [
    { key: "target", heading: `Target: ${plural(lists.target.length, "set")}`, note: null, rows: lists.target },
    { key: "holds", heading: `Holds: ${plural(lists.holds.length, "set")}`, note: null, rows: lists.holds },
    { key: "other", heading: `Other: ${plural(lists.other.length, "set")}`, note: `${otherWorkWords.charAt(0).toUpperCase()}${otherWorkWords.slice(1)} work.`, rows: lists.other },
    { key: "strapped", heading: `Done with straps, not counted here: ${plural(lists.strapped.length, "set")}`, note: null, rows: lists.strapped },
    { key: "pending", heading: `Pending review, not counted here: ${plural(lists.pending.length, "set")}`, note: "Matched only by exercise mappings still under review.", rows: lists.pending },
  ].filter((list) => list.rows.length);
  const openSets = (title: string, intro: string, lists: BoutList[]) => setSheet({ kind: "sets", eyebrow: data.region.label, title, intro, lists });
  const windowLabel = summary.interval.label;
  const everySet = planned ? "every set planned for a muscle that attaches here" : "every set that loaded a muscle that attaches here";

  const quiet = planned ? `No mapped sets planned in this area in ${windowLabel}.` : props.window === "week" ? "No mapped sets in this area this week." : "No mapped sets in this area in this window.";
  const aboutMe = props.aboutMeArea ? aboutMeSentence(props.aboutMeArea, regionWord) : null;

  return <div className="spz-tendon">
    <p className="spz-tendon-lede">{planned ? TENDON_LEDE_PLANNED : TENDON_LEDE}</p>
    {aboutMe && <p className="spz-note spz-tendon-about">{aboutMe}</p>}

    <div className="spz-tendon-areas" role="group" aria-label="Attachment areas">
      {counted.areas.map((item) => <button key={item.id} type="button" className="spz-tendon-area" aria-pressed={item.id === area.id} onClick={() => { setAreaId(item.id); announce(`${item.label}: ${plural(item.counts.sets, "set")}.`); }}>
        {item.label}{"\u00a0·\u00a0"}{item.counts.sets}
      </button>)}
    </div>
    <p className="spz-note">{TENDON_NOT_ADDED}</p>

    <section className="spz-tendon-area-body" aria-labelledby={`${ids}-area`}>
      <h3 id={`${ids}-area`} className="spz-tendon-heading">{area.label} · {plural(area.counts.sets, planned ? "planned set" : "set")}</h3>
      <details className="spz-disclosure spz-tendon-where">
        <summary><span><b>Where this area is</b></span><ChevronDown className="h-4 w-4" aria-hidden="true" /></summary>
        <p className="spz-note">{area.description}</p>
      </details>
      {area.counts.sets === 0 && <p className="spz-tendon-quiet">{quiet}</p>}

      {!planned && <GroupRows area={area} nameOf={nameOf} onOpen={(group) => {
        const line = group.change ? ` ${changeSentence("sets", group.change.sets, true)}` : "";
        const notYet = group.notPlacedYet.length ? ` Not placed in this group yet: ${listWords(group.notPlacedYet.map(nameOf))}.` : "";
        openSets(group.label, `${windowLabel}: ${everySet}, each counted once however many of its muscles worked.${line}${group.caveat ? ` ${group.caveat}` : ""}${notYet}`, listsOf(group.counts.lists));
      }} />}

      {!planned && <DayColumns area={area} days={area.days} todayKey={localDateKey(nowIso, timeZone)} onOpen={(dayKey, long, lists) => openSets(`${area.label} · ${long}`, `That day: ${everySet}, each counted once however many of its muscles worked.`, listsOf(lists))} />}

      {holdsSentence(area.counts.holds, planned) && <p className="spz-tendon-holds">{holdsSentence(area.counts.holds, planned)}</p>}

      {!planned && counted.weeks && <ChangeBlock
        area={area}
        weeks={counted.weeks}
        trainingWeek={trainingWeek}
        planReady={plan.ready && Boolean(trainedStore)}
        onSeeLastWeek={() => area.lastWeek && openSets(`${area.label} · last week`, `${counted.weeks!.last.label}: ${everySet}, each counted once however many of its muscles worked.`, listsOf(area.lastWeek.lists))}
        planned={<PlannedEntries key={area.id} {...props} area={area} store={trainedStore ?? null} onSwap={(next) => setSheet(next)} />}
      />}

      <KeptApart
        counts={area.counts}
        onOpen={(which) => openSets(`${area.label} · not counted here`, which === "strapped" ? "Sets done with straps: the work the straps take off the hand is not counted, and nothing else they did counted here." : "Sets matched here only by exercise mappings still under review: shown, not counted.", listsOf({ target: [], holds: [], other: [], strapped: which === "strapped" ? area.counts.lists.strapped : [], pending: which === "pending" ? area.counts.lists.pending : [] }))}
      />
    </section>

    <SectionApart
      view={counted}
      regionWord={regionWord}
      nameOf={nameOf}
      onRegionOnly={() => openSets(`${plural(counted.regionOnly.sets, "set")} in no area`, `Tagged with the ${regionWord} in the exercise catalog, but no reviewed mapping says which muscles they train, so they count in no area.`, [{ key: "region-only", heading: null, note: null, rows: counted.regionOnly.rows }])}
      onWarmups={(rows) => openSets("Warm-ups", "Sets marked as warm-ups in this window, counted the same way and kept out of every count above.", [{ key: "warmups", heading: null, note: null, rows }])}
    />

    <details ref={methodRef} className="spz-disclosure spz-tendon-method" id="spz-tendon-method">
      <summary><span><b>How this is counted</b><small>{counted.method} · {counted.mappingVersion}</small></span><ChevronDown className="h-4 w-4" aria-hidden="true" /></summary>
      <div className="spz-tendon-method-body">
        <p>{TENDON_METHOD_NOTE}</p>
        {extras.tendonCoverage && <p>{extras.tendonCoverage}</p>}
        <p>{TENDON_OTHER_KEY} Each area's muscles are listed in its description; a set counts in an area when a reviewed mapping credits any of them.</p>
        <p className="spz-note">Sources for these sentences:</p>
        <ul className="spz-tendon-sources">{tendonMethodCitations.map((citation) => {
          const source = tendonMethodSources.find((item) => item.id === citation.sourceId);
          return <li key={citation.sourceId}>{source ? <a href={source.url} target="_blank" rel="noreferrer">{citation.label}</a> : citation.label}</li>;
        })}</ul>
        <p className="spz-note">Method {counted.method} · {counted.mappingVersion} · {counted.ruleVersion}</p>
      </div>
    </details>

    {sheet?.kind === "sets" && <BoutListSheet
      eyebrow={sheet.eyebrow}
      title={sheet.title}
      intro={sheet.intro}
      lists={sheet.lists}
      weightUnit={weightUnit}
      onOpenSession={(sessionId) => { setSheet(null); props.onOpenSession(sessionId); }}
      onInspectExercise={(catalogExerciseId, name) => { setSheet(null); props.onInspectExercise(catalogExerciseId, name); }}
      onOpenMethod={() => {
        setSheet(null);
        const details = methodRef.current;
        if (!details) return;
        details.open = true;
        window.requestAnimationFrame(() => {
          details.querySelector<HTMLElement>(":scope > summary")?.focus({ preventScroll: true });
          details.scrollIntoView?.({ block: "start" });
        });
      }}
      onClose={() => setSheet(null)}
    />}
    {sheet?.kind === "swap" && <PlanChangeSheet
      data={data}
      side={summary.side}
      nodeId={sheet.nodeId}
      candidates={sheet.candidates}
      initialExerciseId={sheet.initialExerciseId}
      catalog={catalog}
      plan={{ slots: plan.slots, weeks: plan.weeks, week: trainingWeek }}
      goal={goal}
      start={{ week: trainingWeek, dayKey: sheet.dayKey, replaceEntryId: sheet.entryId }}
      onApply={props.onApplyPlanChange}
      onClose={() => setSheet(null)}
    />}
  </div>;
}

/** The chosen area's groups: full-width rows, each opening its sets, with its kinds under it. */
function GroupRows({ area, nameOf, onOpen }: { area: TendonAreaView; nameOf: (nodeId: string) => string; onOpen: (group: TendonAreaView["groups"][number]) => void }) {
  return <ul className="spz-tendon-groups" aria-label={`Groups at the ${lowerFirst(area.label)}`}>
    {area.groups.map((group) => {
      const counts = group.counts;
      const opens = counts.sets + counts.strapped + counts.pending > 0;
      const kinds = group.members.length ? `${counts.target} target · ${plural(counts.holds.sets, "hold")} · ${counts.other} other` : "No reviewed muscle here yet";
      const notYet = group.notPlacedYet.length ? `Not placed here yet: ${listWords(group.notPlacedYet.map(nameOf))}` : null;
      const body = <>
        <span><b>{group.label} · {plural(counts.sets, "set")}</b><small>{kinds}</small>{notYet && <small>{notYet}</small>}</span>
        {opens && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
      </>;
      return <li key={group.id}>{opens ? <button type="button" className="spz-tendon-group" onClick={() => onOpen(group)}>{body}</button> : <div className="spz-tendon-group">{body}</div>}</li>;
    })}
  </ul>;
}

/** The area's day columns (the page's `.spz-days`): a stacked target · holds · other bar, full at 12; a day still to come is "–". */
function DayColumns({ area, days, todayKey, onOpen }: { area: TendonAreaView; days: TendonAreaView["days"]; todayKey: string; onOpen: (dayKey: string, long: string, lists: TendonSetLists) => void }) {
  if (days === null) return null;
  if (days === "too_long") return <p className="spz-note">Choose 31 days or fewer to see the work day by day.</p>;
  const noon = (key: string) => new Date(`${key}T12:00:00Z`);
  const wide = days.length > 7;
  const height = (value: number) => `${(Math.min(value, BAR_FULL) / BAR_FULL) * 100}%`;
  return <>
    <p className="spz-legend-line"><span><i className="spz-key spz-key-direct" /> Target</span><span><i className="spz-key spz-key-holds" /> Holds</span><span><i className="spz-key spz-key-other" /> Other</span><span>· bar full at {BAR_FULL} sets</span></p>
    <p className="spz-note">{TENDON_OTHER_KEY}</p>
    <ol className="spz-days spz-tendon-days" aria-label={`Sets per day at the ${lowerFirst(area.label)}`}>
      {days.map((day) => {
        const label = noon(day.dayKey).toLocaleDateString(undefined, wide ? { day: "numeric", month: "short", timeZone: "UTC" } : { weekday: "short", timeZone: "UTC" });
        const long = noon(day.dayKey).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
        if (day.toCome) return <li key={day.dayKey}><span className="spz-day" aria-label={`${long}: still to come`}><span className="spz-day-bar" /><b>–</b><small>{label}</small></span></li>;
        const target = Math.min(day.target, BAR_FULL);
        const holds = Math.min(day.holds.sets, BAR_FULL - target);
        const other = Math.min(day.other, BAR_FULL - target - holds);
        const bar = <>
          <span className="spz-day-bar">
            {target > 0 && <i className="spz-bar-direct" style={{ bottom: 0, height: height(target) }} />}
            {holds > 0 && <i className="spz-bar-holds" style={{ bottom: height(target), height: height(holds) }} />}
            {other > 0 && <i className="spz-bar-other" style={{ bottom: height(target + holds), height: height(other) }} />}
          </span>
          <b>{day.sets}</b>
          <small>{label}</small>
          {day.partial && <small className="spz-tendon-partial">part</small>}
        </>;
        const said = `${long}${day.partial ? ", part of the day" : ""}: ${plural(day.sets, "set")} (${day.target} target, ${plural(day.holds.sets, "hold")}, ${day.other} other)`;
        const opens = day.sets + day.strapped + day.pending > 0;
        return <li key={day.dayKey} data-today={day.dayKey === todayKey || undefined}>
          {opens
            ? <button type="button" className="spz-day" aria-label={`${said}. See these sets`} onClick={() => onOpen(day.dayKey, long, day.lists)}>{bar}</button>
            : <span className="spz-day" aria-label={said}>{bar}</span>}
        </li>;
      })}
    </ol>
    {days.some((day) => !day.toCome && day.partial) && <p className="spz-note spz-days-note">The column marked “part” is part of a day: the window starts at this time 7 days ago.</p>}
    {days.some((day) => !day.toCome && day.sets + day.strapped + day.pending > 0) && <p className="spz-note spz-days-note">A day with sets opens them. A day still to come shows “–”.</p>}
  </>;
}

/** Last week beside the 4 weeks before (Completed mode), the change words per kind, and the prompt when last week is above every known one. */
function ChangeBlock({ area, weeks, trainingWeek, planReady, onSeeLastWeek, planned }: {
  area: TendonAreaView;
  weeks: NonNullable<TendonExposureView["weeks"]>;
  trainingWeek: number;
  planReady: boolean;
  onSeeLastWeek: () => void;
  planned: ReactNode;
}) {
  const heading = `Last week (${weeks.last.label}) beside the ${TENDON_EARLIER_WEEKS} weeks before`;
  const change: TendonChangeSet | null = area.change;
  let body: ReactNode;
  if (!change) body = <p className="spz-note">No reviewed muscle attaches here yet, so there is nothing to compare.</p>;
  else if (change.sets.state === "no_workout_last_week") body = <p>{changeSentence("sets", change.sets)}</p>;
  else if (change.sets.state === "building_baseline") body = <>
    <p>{changeSentence("sets", change.sets)}</p>
    <p className="spz-note">Last week: {amountWords("sets", change.sets.last)}.</p>
  </>;
  else {
    // Every kind with something to say; the sets line always, with the weeks' finished workouts.
    const shown = (["sets", "target", "holds", "other", "holdSeconds"] as const).filter((metric) => metric === "sets" || (change[metric].state !== "none" && (metric !== "holdSeconds" || change.holds.state !== "none")));
    const leftOut = change.sets.baseline.some((week) => !week.known);
    body = <>
      <ul className="spz-tendon-changes">
        {shown.map((metric, index) => <li key={metric}>{changeSentence(metric, change[metric], index === 0)}</li>)}
      </ul>
      {leftOut && <p className="spz-note">{TENDON_LEFT_OUT}</p>}
    </>;
  }
  const prompt = aboveEveryWeek(change?.sets);
  return <section className="spz-tendon-change" aria-label={heading}>
    <h4 className="spz-tendon-subheading">{heading}</h4>
    {body}
    {prompt && <div className="spz-tendon-prompt">
      <p>{planReady ? TENDON_PROMPT : TENDON_PROMPT_NO_PLAN}</p>
      {area.lastWeek && area.lastWeek.sets + area.lastWeek.strapped + area.lastWeek.pending > 0 && <button type="button" className="spz-link" onClick={onSeeLastWeek}>See these sets <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>}
      {!planReady && <p className="spz-note">Plan Week {trainingWeek} is not built yet, so nothing is planned to change here.</p>}
    </div>}
    {prompt && planReady && planned}
  </section>;
}

/** "Planned in Week N at the <area>": the trained plan week's entries that load the area, each changed in place with Undo. */
function PlannedEntries(props: TendonExposureProps & { summary: SpecializationSummary; area: TendonAreaView; store: WeeklyDayStore | null; onSwap: (sheet: SwapSheet) => void }) {
  const { data, area, store, plan, goal, trainingWeek, onApplyPlanChanges, announce } = props;
  const ids = useId();
  const [done, setDone] = useState<Done | null>(null);
  const [error, setError] = useState<{ at: string; text: string } | null>(null);
  const [moving, setMoving] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const statusRef = useRef<HTMLElement | null>(null);
  useEffect(() => { if (done) statusRef.current?.focus({ preventScroll: true }); }, [done]);

  const rows = useMemo<PlannedRow[]>(() => {
    if (!store) return [];
    return (area.planned?.entries ?? []).flatMap((entry) => {
      const entryId = Number(entry.exerciseEntryId);
      if (!entry.dayKey || entry.catalogExerciseId === null || !Number.isFinite(entryId)) return [];
      const day = loadDay(store, entry.dayKey);
      const index = day.workout.findIndex((item) => item.id === entryId);
      if (index === -1) return [];
      const own: string | undefined = day.prescriptions[entryId];
      const prescription = prescriptionOf(own, index, goal, variantForCatalogId(data, entry.catalogExerciseId)?.measure);
      const ordinal = plan.slots.find((slot) => slot.key === entry.dayKey)?.ordinal ?? entry.dayKey;
      const byStack = props.stackEntries.some((item) => item.dayKey === entry.dayKey && item.catalogExerciseId === entry.catalogExerciseId);
      return [{ ...entry, entryId, catalogId: entry.catalogExerciseId, ordinal, prescription, own, setCount: parseSetCount(prescription), byStack }];
    });
  }, [store, area.planned, goal, data, plan.slots, props.stackEntries]);

  const apply = async (row: PlannedRow, change: SpecializationPlanBatchChange) => {
    if (busy || !onApplyPlanChanges) return;
    setBusy(true);
    setError(null);
    try {
      const result = await onApplyPlanChanges({ week: trainingWeek, changes: [change] }, {
        // The notice's Undo says so here too.
        onUndo: () => setDone((current) => (current && current.undo ? { text: `Undone: Plan Week ${trainingWeek} is as it was.`, undo: null } : current)),
      });
      if (!result.ok) { setError({ at: rowKey(row), text: result.reason }); announce(result.reason); return; }
      setMoving(null);
      setDone({ text: result.message, undo: result.undo });
      announce(`${result.message}. Undo is beside it.`);
    } finally {
      setBusy(false);
    }
  };
  const undo = () => {
    if (!done?.undo) return;
    done.undo();
    setDone({ text: `Undone: Plan Week ${trainingWeek} is as it was.`, undo: null });
    announce(`Undone: Plan Week ${trainingWeek} is as it was.`);
  };
  const rowKey = (row: PlannedRow) => `${row.dayKey}:${row.entryId}`;
  const entry = (row: PlannedRow) => ({ dayKey: row.dayKey!, entryId: row.entryId, catalogExerciseId: row.catalogId });
  const lessOne = (row: PlannedRow) => {
    if (row.setCount <= 1) { setError({ at: rowKey(row), text: `1 set is the fewest for ${row.exerciseName}; use Take out instead.` }); return; }
    void apply(row, { kind: "sets", ...entry(row), sets: row.setCount - 1, prescription: row.prescription });
  };
  const takeOut = (row: PlannedRow) => void apply(row, { kind: "remove", ...entry(row), ...(row.own === undefined ? {} : { prescription: row.own }) });
  const moveTo = (row: PlannedRow, toDayKey: string) => void apply(row, { kind: "move", ...entry(row), toDayKey, ...(row.own === undefined ? { prescription: row.prescription } : {}) });
  const swap = (row: PlannedRow) => {
    // The muscle the swap is for: the area's muscle this exercise is credited with, direct work first.
    const variant = variantForCatalogId(data, row.catalogId);
    const mappings = variant ? data.mappings.filter((mapping) => mapping.variantId === variant.id && mapping.reviewStatus === "reviewed" && area.members.includes(mapping.nodeId)) : [];
    const nodeId = (mappings.find((mapping) => mapping.relationship === "direct") ?? mappings[0])?.nodeId ?? area.members[0];
    const found = nodeId ? recommendFor({ region: data, target: { nodeId }, side: props.summary.side, summary: props.summary, plannedExercises: plannedExercisesInWeek(plan.slots, store!), catalog: props.catalog, equipmentProfile: props.equipmentProfile, exclusions: props.exclusions }) : null;
    const candidates = found?.kind === "candidates" ? found.candidates.filter((candidate) => candidate.catalogExerciseId !== row.catalogId) : [];
    if (!nodeId || !candidates.length) { setError({ at: rowKey(row), text: `No reviewed exercise to swap in for ${row.exerciseName} here.` }); return; }
    setError(null);
    props.onSwap({ kind: "swap", nodeId, candidates, initialExerciseId: candidates[0].catalogExerciseId, dayKey: row.dayKey!, entryId: row.entryId, outgoing: row.exerciseName });
  };

  const heading = `Planned in Week ${trainingWeek} at the ${lowerFirst(area.label)}`;
  return <section className="spz-tendon-planned" aria-labelledby={`${ids}-planned`}>
    <h4 id={`${ids}-planned`} className="spz-tendon-subheading">{heading}</h4>
    {done && <p className="spz-inline-status spz-tendon-done" role="status" tabIndex={done.undo ? undefined : -1} ref={done.undo ? undefined : (element) => { statusRef.current = element; }}>
      <span id={`${ids}-done`}>{done.text}</span>
      {done.undo && <button ref={(element) => { statusRef.current = element; }} type="button" className="spz-button" aria-describedby={`${ids}-done`} onClick={undo}>Undo</button>}
    </p>}
    {!rows.length ? <p className="spz-note">Nothing planned in Week {trainingWeek} loads the muscles that attach here.</p>
      : <ul className="spz-tendon-entries">
        {rows.map((row) => {
          const key = rowKey(row);
          const others = plan.slots.filter((slot) => slot.key !== row.dayKey);
          return <li key={key} className="spz-tendon-entry">
            <p><b>{row.exerciseName}</b><small>{row.ordinal} · {row.prescription} · {plural(row.sets, "set")} counted here</small></p>
            {onApplyPlanChanges ? <div className="spz-tendon-entry-actions" role="group" aria-label={row.exerciseName}>
              <button type="button" className="spz-button" aria-disabled={row.setCount <= 1 || busy || undefined} onClick={() => lessOne(row)}>−1 set</button>
              <button type="button" className="spz-button" aria-expanded={moving === key} aria-controls={`${ids}-${key}-days`} onClick={() => { setMoving(moving === key ? null : key); setError(null); }}>Move to another day</button>
              <button type="button" className="spz-button" aria-disabled={busy || undefined} onClick={() => takeOut(row)}>Take out</button>
              <button type="button" className="spz-button" onClick={() => swap(row)}>Swap</button>
            </div> : <p className="spz-note">Changing the plan is not available here.</p>}
            {moving === key && <div id={`${ids}-${key}-days`} className="spz-chips spz-tendon-move" role="group" aria-label={`Move ${row.exerciseName} to`}>
              {others.map((slot) => <button key={slot.key} type="button" className="spz-chip" onClick={() => moveTo(row, slot.key)}><span>{slot.ordinal}</span><small>{slot.day}</small></button>)}
            </div>}
            {error?.at === key && <p className="spz-tendon-reason" role="status">{error.text}</p>}
            {row.byStack && props.onOpenStackEntry && <button type="button" className="spz-link" onClick={() => props.onOpenStackEntry!({ dayKey: row.dayKey!, catalogExerciseId: row.catalogId })}>Added by your stack: see it there <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>}
          </li>;
        })}
      </ul>}
  </section>;
}

/** The area's kept-apart sets: done with straps, and matched only by mappings under review; each opens its sets. */
function KeptApart({ counts, onOpen }: { counts: TendonCounts; onOpen: (which: "strapped" | "pending") => void }) {
  if (!counts.strapped && !counts.pending) return null;
  return <div className="spz-tendon-apart">
    <p>Not counted here:</p>
    <div className="spz-actions">
      {counts.strapped > 0 && <button type="button" className="spz-link" onClick={() => onOpen("strapped")}>{plural(counts.strapped, "set")} done with straps <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>}
      {counts.pending > 0 && <button type="button" className="spz-link" onClick={() => onOpen("pending")}>{counts.pending} pending review <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>}
    </div>
  </div>;
}

/** What the section keeps apart once, for every area: sets in no area, the window's warm-ups, and muscles not placed yet. */
function SectionApart({ view, regionWord, nameOf, onRegionOnly, onWarmups }: { view: TendonExposureView; regionWord: string; nameOf: (nodeId: string) => string; onRegionOnly: () => void; onWarmups: (rows: RegionBoutRow[]) => void }) {
  const warmupRows = useMemo(() => {
    const seen = new Map<string, RegionBoutRow>();
    for (const area of view.warmups?.areas ?? []) for (const row of [...area.counts.lists.target, ...area.counts.lists.holds, ...area.counts.lists.other]) if (!seen.has(row.boutId)) seen.set(row.boutId, row);
    return Array.from(seen.values());
  }, [view.warmups]);
  const lines = view.regionOnly.sets > 0 || warmupRows.length > 0 || view.notPlaced.length > 0;
  if (!lines) return null;
  return <section className="spz-tendon-apart" aria-label="Kept out of the areas">
    {view.regionOnly.sets > 0 && <div>
      <p>{plural(view.regionOnly.sets, "set")} {view.regionOnly.sets === 1 ? "counts" : "count"} for the {regionWord} as a whole and {view.regionOnly.sets === 1 ? "is" : "are"} in no area.</p>
      {view.regionOnly.rows.length > 0 && <button type="button" className="spz-link" onClick={onRegionOnly}>See {view.regionOnly.sets === 1 ? "this set" : "these sets"} <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>}
    </div>}
    {warmupRows.length > 0 && <div>
      <p>Warm-ups: {plural(warmupRows.length, "set")}, kept out of the counts above.</p>
      <button type="button" className="spz-link" onClick={() => onWarmups(warmupRows)}>See the warm-ups <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
    </div>}
    {view.notPlaced.length > 0 && <div>
      <p>Not placed in an area yet:</p>
      <ul className="spz-tendon-not-placed">{view.notPlaced.map((item) => <li key={item.nodeId}><b>{nameOf(item.nodeId)}</b> {item.reason}</li>)}</ul>
    </div>}
  </section>;
}
