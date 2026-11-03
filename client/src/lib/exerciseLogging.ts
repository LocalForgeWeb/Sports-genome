import { exerciseLoggingFacts, type ExerciseLoggingFacts } from "./exerciseLoggingFacts.generated";
import type { HeadDirectionAction, NeckAction, SetupField } from "./exerciseExecution";
import { catalogMeasureOf } from "@shared/specialization/holdCatalogIds";

/**
 * How a set of an exercise with an execution record (exerciseExecution.ts: the Zercher, neck and
 * bench rows) is logged and read back: which way the head went, what the load box means, the setup
 * recorded with the exercise, and which sets may be compared. Read from the light facts
 * (exerciseLoggingFacts.generated.ts), so the logger, the history, the session detail and the
 * recap can all use it without loading the records' steps, roles or sources. Every other catalog
 * row has no facts, and every function here leaves it exactly as it was.
 */

/** Which way one set of a lateral flexion or rotation exercise was done: the head's direction, never an arm. */
export type HeadDirection = "left" | "right";
export const isHeadDirection = (value: unknown): value is HeadDirection => value === "left" || value === "right";
export const headDirectionWords: Record<HeadDirection, string> = { left: "Left", right: "Right" };

/** The setup values recorded with an exercise in a workout, as typed, by setup field. */
export type ExerciseSetup = Partial<Record<SetupField, string>>;

/** What a Smith machine's load number is: the plates alone (the default), or the plates and a bar weight the athlete knows. */
export type SmithLoadBasis = "plates_only" | "total_known_bar";
/** The two Smith choices, in the load box's own words (setEntryFields.ts): "Plates only", "Plates + bar". */
export const smithLoadBasisWords: Record<SmithLoadBasis, string> = { plates_only: "Plates only", total_known_bar: "Plates + bar" };
const isSmithLoadBasis = (value: unknown): value is SmithLoadBasis => value === "plates_only" || value === "total_known_bar";

export function loggingFactsOf(catalogId: number | null | undefined): ExerciseLoggingFacts | null {
  return catalogId === null || catalogId === undefined ? null : exerciseLoggingFacts.get(catalogId) ?? null;
}

/** The neck action of a neck row, or null. */
export function neckActionOf(catalogId: number | null | undefined): NeckAction | null {
  return loggingFactsOf(catalogId)?.neckAction ?? null;
}

/** The action whose sets are each done to the left or the right of the head, or null where a set has no direction. */
export function headDirectionActionOf(catalogId: number | null | undefined): HeadDirectionAction | null {
  return loggingFactsOf(catalogId)?.headDirection ?? null;
}

/**
 * What the direction choice is called: "Head direction" where the head moves (a lateral flexion
 * or a rotation done for reps), "Push / turn toward" on an isometric hold, where the head pushes
 * into the hand and does not move. Null where a set has no direction.
 */
export function headDirectionPrompt(catalogId: number | null | undefined): string | null {
  if (!headDirectionActionOf(catalogId)) return null;
  return catalogMeasureOf(catalogId) === "seconds" ? "Push / turn toward" : "Head direction";
}

/** The line a manually resisted exercise shows where other exercises have a load box. */
export const MANUAL_RESISTANCE_LINE = "Manual resistance · force not measured";

/** The athlete's own hand is the resistance: its force is not measured, so no load is asked or shown. */
export function isLoadUnmeasured(catalogId: number | null | undefined): boolean {
  return loggingFactsOf(catalogId)?.load === "manual_unmeasured";
}

/** A plate-loaded machine with an arm each side: its load is the plates on one arm, and the arms may be loaded differently. */
export function isPlatesPerArm(catalogId: number | null | undefined): boolean {
  return loggingFactsOf(catalogId)?.load === "plates_per_arm";
}

/** A Smith machine: the athlete declares whether its load number is the plates alone or includes a bar weight they know. */
export function declaresLoadBasis(catalogId: number | null | undefined): boolean {
  return loggingFactsOf(catalogId)?.load === "smith_declared";
}

/**
 * Neck rows get no automatic target: until a neck-specific policy is written and reviewed, the
 * athlete sets the reps or the time (handoff §3.3). The goal's defaults are general strength
 * ranges, and "4 × 3–5" on a neck machine is a heavy neck default nobody chose.
 */
export function setsOwnTarget(catalogId: number | null | undefined): boolean {
  return neckActionOf(catalogId) !== null;
}

// ---------------------------------------------------------------- setup

type SetupFieldSpec = { label: string; kind: "number" | "text" | "load"; unit?: string };

/** Each setup field as the Setup disclosure asks for it and a record shows it. */
export const setupFieldSpecs: Record<SetupField, SetupFieldSpec> = {
  bar_type: { label: "Bar", kind: "text" },
  start_height_cm: { label: "Start height", kind: "number", unit: "cm" },
  rom_note: { label: "Range of motion", kind: "text" },
  setup_note: { label: "Setup note", kind: "text" },
  machine_model: { label: "Machine", kind: "text" },
  seat_setting: { label: "Seat", kind: "text" },
  pad_setting: { label: "Pad", kind: "text" },
  attachment_setup: { label: "Attachment", kind: "text" },
  seat_or_bench_setting: { label: "Seat or bench", kind: "text" },
  load_convention: { label: "Load counted as", kind: "load" },
  pause_seconds: { label: "Pause", kind: "number", unit: "s" },
  hover_distance_cm: { label: "Hover", kind: "number", unit: "cm" },
};

const knownSetupFields: ReadonlySet<string> = new Set(Object.keys(setupFieldSpecs));
/** Free-text observations: shown with the exercise, never a reason two sets are a different protocol. */
const NOTE_FIELDS: ReadonlySet<SetupField> = new Set<SetupField>(["setup_note", "rom_note"]);
const MAX_SETUP_TEXT = 80;

/** The setup fields of an exercise, in its record's order; none for a row without facts. */
export function setupFieldsOf(catalogId: number | null | undefined): readonly SetupField[] {
  return loggingFactsOf(catalogId)?.setupFields ?? [];
}

/**
 * The setup fields the athlete types or picks. The load convention is a choice only on a Smith
 * machine (plates only, or plates and a bar weight the athlete knows); on every other row it is
 * the row's own convention, stated rather than asked.
 */
export function editableSetupFieldsOf(catalogId: number | null | undefined): readonly SetupField[] {
  const facts = loggingFactsOf(catalogId);
  if (!facts) return [];
  return facts.setupFields.filter((field) => field !== "load_convention" || facts.load === "smith_declared");
}

/** A Smith machine's declared basis: what the athlete said, else null (not recorded). */
export function smithLoadBasisOf(setup: ExerciseSetup | undefined): SmithLoadBasis | null {
  return isSmithLoadBasis(setup?.load_convention) ? setup.load_convention : null;
}

/** Text typed into a number field as it is kept: digits and one decimal point, never a sign or a unit. */
export function setupNumberText(value: string): string {
  const [whole, ...rest] = value.replace(/,/g, ".").replace(/[^0-9.]/g, "").split(".");
  return (rest.length ? `${whole}.${rest.join("")}` : whole).slice(0, 6);
}

/**
 * A stored setup as this release keeps it: string values only, trimmed and cut to a short length;
 * a number field only as a number, a Smith basis only as one of the two. A key this release does
 * not know (a later release's) is kept as stored when it is text. Null when nothing is left, so an
 * exercise with no setup carries none.
 */
export function normalizeSetup(value: unknown): ExerciseSetup | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const kept: Record<string, string> = {};
  for (const [field, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof raw !== "string") continue;
    const text = raw.trim().slice(0, MAX_SETUP_TEXT);
    if (!text) continue;
    if (!knownSetupFields.has(field)) { kept[field] = text; continue; }
    const spec = setupFieldSpecs[field as SetupField];
    if (spec.kind === "number" && !/^\d+(\.\d+)?$/.test(text)) continue;
    if (spec.kind === "load" && !isSmithLoadBasis(text)) continue;
    kept[field] = text;
  }
  return Object.keys(kept).length ? kept : null;
}

/** "Start height 45 cm", "Machine: Hammer Strength", "Plates only": one recorded setup value in words. */
export function setupValueText(field: SetupField, value: string): string {
  const spec = setupFieldSpecs[field];
  if (spec.kind === "load") return isSmithLoadBasis(value) ? smithLoadBasisWords[value] : value;
  if (spec.kind === "number") return `${spec.label} ${value} ${spec.unit}`;
  return `${spec.label}: ${value}`;
}

/** How an exercise's load is counted, said once with its setup: the row's own convention, or a Smith machine's declared basis. */
export function loadBasisText(catalogId: number | null | undefined, setup: ExerciseSetup | undefined): string | null {
  const facts = loggingFactsOf(catalogId);
  if (!facts) return null;
  switch (facts.load) {
    case "plates_per_arm": return "Plates per arm";
    case "machine_display": return "Machine load";
    case "suspended_external_mass": return "Harness load";
    case "manual_unmeasured": return MANUAL_RESISTANCE_LINE;
    case "smith_declared": { const basis = smithLoadBasisOf(setup); return basis ? smithLoadBasisWords[basis] : "Load basis not recorded"; }
    default: return null;
  }
}

/**
 * The exercise's setup in one line, for the history and the session detail: what was recorded, in
 * the record's order, then the comparison fields left empty, named as not recorded rather than
 * hidden ("Start height 45 cm · Bar not recorded"). "Setup not recorded" when nothing was. Null on
 * a row with no setup fields to compare and nothing recorded.
 */
export function setupSummaryOf(catalogId: number | null | undefined, setup: ExerciseSetup | undefined): string | null {
  const facts = loggingFactsOf(catalogId);
  if (!facts) return null;
  const recorded: string[] = [];
  const missing: string[] = [];
  for (const field of facts.setupFields) {
    if (field === "load_convention") {
      if (facts.load !== "smith_declared") continue;
      const basis = smithLoadBasisOf(setup);
      if (basis) recorded.push(smithLoadBasisWords[basis]); else missing.push("load basis");
      continue;
    }
    const value = setup?.[field]?.trim();
    if (value) recorded.push(setupValueText(field, value));
    else if (!NOTE_FIELDS.has(field)) missing.push(setupFieldSpecs[field].label.toLowerCase());
  }
  if (!recorded.length && !missing.length) return null;
  if (!recorded.length) return "Setup not recorded";
  if (!missing.length) return recorded.join(" · ");
  const words = missing.join(", ");
  return `${recorded.join(" · ")} · ${words.charAt(0).toUpperCase()}${words.slice(1)} not recorded`;
}

// ---------------------------------------------------------------- comparison

/**
 * The setup fields two sets must share to be the same protocol: every setup field but the notes
 * (the handoff's comparisonKeyFields). Effort and notes are observations, never keys.
 */
export function comparisonSetupFieldsOf(catalogId: number | null | undefined): readonly SetupField[] {
  return setupFieldsOf(catalogId).filter((field) => !NOTE_FIELDS.has(field));
}

const comparable = (field: SetupField, value: string | undefined): string => {
  const text = value?.trim() ?? "";
  if (!text) return "?";
  return setupFieldSpecs[field].kind === "number" ? String(Number(text)) : text.toLowerCase().replace(/\s+/g, " ");
};

/**
 * Which protocol a set belongs to: the catalog id, how its load is counted, each comparison setup
 * value (an empty one is "?", unknown, and never matches a recorded one by accident), and, on a
 * row done to a side, the set's head direction. Two sets are compared - called a best, put on one
 * line of progress - only when their keys are equal: a 30 cm block pull and a 45 cm one are not one
 * record, nor a left and a right rotation. Null for a row without facts: it compares as it always did.
 */
export function protocolKeyOf(catalogId: number | null | undefined, setup: ExerciseSetup | undefined, set?: { headDirection?: HeadDirection }): string | null {
  const facts = loggingFactsOf(catalogId);
  if (!facts || catalogId === null || catalogId === undefined) return null;
  const parts = [String(catalogId), facts.load];
  for (const field of comparisonSetupFieldsOf(catalogId)) {
    // The load convention is the row's own except on a Smith machine, where the athlete declares it.
    const value = field === "load_convention" ? (facts.load === "smith_declared" ? smithLoadBasisOf(setup) ?? "?" : facts.load) : comparable(field, setup?.[field]);
    parts.push(`${field}=${value}`);
  }
  if (facts.headDirection && set) parts.push(`head=${set.headDirection ?? "?"}`);
  return parts.join("|");
}
