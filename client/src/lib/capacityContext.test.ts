import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ResilienceTargetCatalog } from "@shared/resilienceContext";
import type { CapacityFocusState } from "@/components/CapacityFocusCard";

/**
 * A minimal stand-in for the Supabase query builder, recording what the client
 * would actually send. The point is the shape of the writes: the tables carry
 * check constraints this code has to satisfy exactly, and getting one wrong
 * fails silently in production as a row that never arrives.
 */
type Call = { table: string; op: string; payload?: unknown; filters: Record<string, unknown> };
const calls: Call[] = [];
let rowsByTable: Record<string, unknown[]> = {};

function builder(table: string, op: string, payload?: unknown) {
  const call: Call = { table, op, payload, filters: {} };
  calls.push(call);
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  for (const method of ["select", "eq", "is", "in", "order", "limit"]) {
    chain[method] = (...args: unknown[]) => {
      if (method === "eq" || method === "is") call.filters[String(args[0])] = args[1];
      if (method === "in") call.filters[String(args[0])] = args[1];
      return self();
    };
  }
  const result = { data: op === "select" ? rowsByTable[table] ?? [] : null, error: null };
  (chain as { then: unknown }).then = (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve);
  return chain;
}

const from = (table: string) => ({
  select: (...args: unknown[]) => (builder(table, "select") as { select: (...a: unknown[]) => unknown }).select(...args),
  insert: (payload: unknown) => builder(table, "insert", payload),
  update: (payload: unknown) => builder(table, "update", payload),
});

vi.mock("@/lib/supabaseClient", () => ({ getSupabaseClient: () => ({ from }) }));

const { capacitySignature, loadCapacityContext, saveCapacityContext } = await import("./capacityContext");

const SHOULDER = "26cd0dfa-6859-4532-8a66-9eaa10902a00";
const KNEE = "ac8c710b-0171-4fad-b050-f73ee5345e81";

const catalog: ResilienceTargetCatalog = {
  status: "connected",
  boundary: "b",
  targets: [
    { targetId: SHOULDER, targetKey: "shoulder", name: "Shoulder", region: "shoulder", targetType: "body_region", lateralitySupported: true, supportedRoutes: [] },
    { targetId: KNEE, targetKey: "knee", name: "Knee", region: "knee", targetType: "body_region", lateralitySupported: true, supportedRoutes: [] },
  ],
};

const offline: ResilienceTargetCatalog = { status: "unavailable", targets: [], boundary: "b" };

const state = (targetKey: string, constraintType: CapacityFocusState["constraint"] extends undefined ? never : NonNullable<CapacityFocusState["constraint"]>["constraintType"]): CapacityFocusState => ({
  focus: { targetKey, intent: "build_capacity", laterality: "right" },
  constraint: { targetKey, constraintType, laterality: "right" },
  reportedSignals: [],
});

const find = (table: string, op: string) => calls.filter((call) => call.table === table && call.op === op);

beforeEach(() => { calls.length = 0; rowsByTable = {}; });

/**
 * The two tables the feature was waiting on now exist, so the answers stop being
 * device-local. These assertions are about writing them the way the schema, and
 * the interaction contract the schema encodes, actually require.
 */
describe("the capacity answers reach the athlete's own rows", () => {
  it("writes a focus area and its constraint against the catalog's target id", async () => {
    expect(await saveCapacityContext("user-1", state("shoulder", "recent_or_returning"), catalog)).toBe(true);
    const focus = find("athlete_focus_areas", "insert")[0]?.payload as Record<string, unknown>;
    const constraint = find("athlete_training_constraints", "insert")[0]?.payload as Record<string, unknown>;
    // The client speaks keys and the tables speak ids; a key in target_id is a
    // foreign-key violation, so this is the one mapping that must not drift.
    expect(focus.target_id).toBe(SHOULDER);
    expect(constraint.target_id).toBe(SHOULDER);
    expect(focus.laterality).toBe("right");
    expect(constraint.constraint_type).toBe("recent_or_returning");
  });

  it("uses only values the check constraints allow", async () => {
    await saveCapacityContext("user-1", state("shoulder", "symptomatic"), catalog);
    const focus = find("athlete_focus_areas", "insert")[0]?.payload as Record<string, unknown>;
    const constraint = find("athlete_training_constraints", "insert")[0]?.payload as Record<string, unknown>;
    // athlete_focus_areas_provenance_check / _intent_code_check / _laterality_check
    expect(["user_selected", "coach_selected", "imported"]).toContain(focus.provenance);
    expect(["build_capacity", "improve_function", "maintain_capacity"]).toContain(focus.intent_code);
    // athlete_training_constraints_provenance_check: the athlete said it, so it
    // is user_reported even when they are reporting what a clinician told them.
    expect(["user_reported", "clinician_reported", "coach_reported"]).toContain(constraint.provenance);
    expect(["bilateral", "left", "right", "unspecified"]).toContain(constraint.laterality);
  });

  /**
   * §3: both objects are "effective-dated... and are user-editable and
   * reversible". Changing an answer must not overwrite what was said before.
   */
  it("closes the previous answer instead of editing or deleting it", async () => {
    rowsByTable.athlete_focus_areas = [{ id: "f1", target_id: SHOULDER, intent_code: "build_capacity", laterality: "right" }];
    rowsByTable.athlete_training_constraints = [{ id: "c1", target_id: SHOULDER, constraint_type: "symptomatic", laterality: "right" }];
    await saveCapacityContext("user-1", state("knee", "prior_recurrent"), catalog);

    const closedFocus = find("athlete_focus_areas", "update")[0]?.payload as Record<string, unknown>;
    expect(closedFocus.status, "removed is the schema's word for a closed focus area").toBe("removed");
    expect(closedFocus.effective_to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const closedConstraint = find("athlete_training_constraints", "update")[0]?.payload as Record<string, unknown>;
    expect(closedConstraint.status).toBe("superseded");
    // And the new answer is an insert, not an update of the old row.
    expect((find("athlete_focus_areas", "insert")[0]?.payload as Record<string, unknown>).target_id).toBe(KNEE);
    expect(calls.some((call) => call.op === "delete")).toBe(false);
  });

  it("leaves an unchanged answer alone rather than laying down a row per render", async () => {
    rowsByTable.athlete_focus_areas = [{ id: "f1", target_id: SHOULDER, intent_code: "build_capacity", laterality: "right" }];
    rowsByTable.athlete_training_constraints = [{ id: "c1", target_id: SHOULDER, constraint_type: "symptomatic", laterality: "right" }];
    await saveCapacityContext("user-1", state("shoulder", "symptomatic"), catalog);
    expect(find("athlete_focus_areas", "insert")).toHaveLength(0);
    expect(find("athlete_training_constraints", "insert")).toHaveLength(0);
    expect(find("athlete_focus_areas", "update")).toHaveLength(0);
  });

  /**
   * §3: "Nothing right now" is a reported state, not an absent one. The plan has
   * to be able to tell it apart from never having asked.
   */
  it("stores 'nothing right now' as a row of its own", async () => {
    await saveCapacityContext("user-1", state("knee", "proactive_none"), catalog);
    const constraint = find("athlete_training_constraints", "insert")[0]?.payload as Record<string, unknown>;
    expect(constraint.constraint_type).toBe("proactive_none");
  });

  it("never invents a target id the catalog cannot resolve", async () => {
    // target_id is a foreign key to resilience_targets; a guess is a rejected
    // write at best and the wrong region at worst.
    const unknown: CapacityFocusState = { focus: { targetKey: "not_a_target", intent: "build_capacity", laterality: "bilateral" }, reportedSignals: [] };
    expect(await saveCapacityContext("user-1", unknown, catalog)).toBe(false);
    expect(calls.filter((call) => call.op === "insert")).toHaveLength(0);
  });

  it("does nothing at all without an id or a catalog", async () => {
    expect(await saveCapacityContext(null, state("knee", "symptomatic"), catalog)).toBe(false);
    expect(await saveCapacityContext("user-1", state("knee", "symptomatic"), offline)).toBe(false);
    expect(calls).toHaveLength(0);
  });

  it("reads back only the athlete's own active rows", async () => {
    rowsByTable.athlete_focus_areas = [{ id: "f1", target_id: KNEE, intent_code: "build_capacity", laterality: "left" }];
    rowsByTable.athlete_training_constraints = [{ id: "c1", target_id: KNEE, constraint_type: "clinician_restricted", laterality: "left" }];
    const snapshot = await loadCapacityContext("user-1", catalog);
    expect(snapshot?.focus).toEqual({ targetKey: "knee", laterality: "left" });
    expect(snapshot?.constraint?.constraintType).toBe("clinician_restricted");
    const read = find("athlete_focus_areas", "select")[0];
    expect(read.filters.user_id).toBe("user-1");
    expect(read.filters.status).toBe("active");
    expect(read.filters.effective_to, "a closed row is history, not the answer").toBeNull();
  });

  it("says nothing rather than something when there are no rows", async () => {
    expect(await loadCapacityContext("user-1", catalog)).toBeNull();
  });

  /**
   * §8: "Reassessment windows come from the evidence route, not one global
   * timer." The column exists and has no default, which says the same.
   */
  it("does not invent a reconfirmation window no route has decided", async () => {
    await saveCapacityContext("user-1", state("knee", "symptomatic"), catalog);
    const constraint = find("athlete_training_constraints", "insert")[0]?.payload as Record<string, unknown>;
    expect(Object.keys(constraint)).not.toContain("reconfirm_due_on");
  });

  /**
   * The reported high-consequence signals have no column. Putting them in
   * `user_reported_diagnosis` or `severity_or_irritability` would record a tick
   * box as something it is not.
   */
  it("keeps the reported signals out of columns that mean something else", async () => {
    await saveCapacityContext("user-1", { ...state("knee", "symptomatic"), reportedSignals: ["neurological_or_systemic", "postoperative"] }, catalog);
    const constraint = find("athlete_training_constraints", "insert")[0]?.payload as Record<string, unknown>;
    for (const column of ["user_reported_diagnosis", "severity_or_irritability", "clinician_restriction", "aggravating_context"]) {
      expect(Object.keys(constraint), `${column} is not where a tick box goes`).not.toContain(column);
    }
    // And the write signature ignores them, so ticking one does not rewrite rows.
    expect(capacitySignature({ ...state("knee", "symptomatic"), reportedSignals: [] }))
      .toBe(capacitySignature({ ...state("knee", "symptomatic"), reportedSignals: ["postoperative"] }));
  });

  it("has no signature to write before a target is chosen", () => {
    expect(capacitySignature({ reportedSignals: [] })).toBe("none");
  });
});
