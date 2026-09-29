import { beforeEach, describe, expect, it, vi } from "vitest";
import { bodyMassObservations, strengthObservations, workoutSessionExercises, workoutSessions } from "../drizzle/schema";

/**
 * The two-row writes against a stand-in database with MySQL's commit rules: a write made
 * straight on the connection lands at once, and a write made inside a transaction lands
 * only when the transaction's callback finishes without throwing.
 */
type Write = { table: unknown; kind: "insert" | "update"; values: Record<string, unknown> };

const state = vi.hoisted(() => ({
  committed: [] as Write[],
  failTable: null as unknown,
  nextId: 1,
  db: null as any,
}));

function writer(sink: Write[]) {
  const run = (table: unknown, kind: Write["kind"], values: Record<string, unknown>[]) => {
    if (table === state.failTable) return Promise.reject(new Error("connection reset"));
    const rows = values.map((value) => ({ ...value, id: value.id ?? state.nextId++ }));
    rows.forEach((row) => sink.push({ table, kind, values: row }));
    return Promise.resolve(rows.map((row) => ({ id: row.id as number })));
  };
  return {
    insert: vi.fn((table: unknown) => ({
      values: (value: Record<string, unknown> | Record<string, unknown>[]) => {
        const pending = () => run(table, "insert", Array.isArray(value) ? value : [value]);
        return {
          $returningId: () => pending(),
          then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => pending().then(resolve, reject),
        };
      },
    })),
    update: vi.fn((table: unknown) => ({
      set: (values: Record<string, unknown>) => ({ where: () => run(table, "update", [{ ...values, id: 0 }]) }),
    })),
  };
}

function rowsOf(table: unknown) {
  return state.committed.filter((write) => write.table === table && write.kind === "insert").map((write) => write.values);
}

function selectChain() {
  let table: unknown;
  const chain: any = {
    from: (source: unknown) => { table = source; return chain; },
    where: () => chain,
    orderBy: () => chain,
    limit: () => Promise.resolve(rowsOf(table)),
    then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => Promise.resolve(rowsOf(table)).then(resolve, reject),
  };
  return chain;
}

state.db = {
  ...writer(state.committed),
  select: vi.fn(() => selectChain()),
  transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => {
    const staged: Write[] = [];
    const result = await callback(writer(staged));
    state.committed.push(...staged);
    return result;
  }),
};

vi.mock("./db", () => ({ getDb: vi.fn(async () => state.db) }));

const { createWorkoutSession } = await import("./workoutSessions");
const { createStrengthObservation, setStrengthObservationBodyMass } = await import("./strengthGenome");

const plannedWorkout = {
  title: "Lower A",
  exercises: [
    { exerciseName: "Back Squat", plannedPrescription: "3 x 5" },
    { exerciseName: "Romanian Deadlift", plannedPrescription: "3 x 8" },
  ],
};

const benchTest = {
  exerciseName: "Bench Press",
  observedAt: new Date("2026-09-01T12:00:00Z"),
  measurementType: "MEASURED_1RM" as const,
  measuredOneRmKg: 100,
  bodyMassKgAtTest: 82.5,
  laterality: "BILATERAL" as const,
  dataQuality: "SELF_REPORTED" as const,
};

beforeEach(() => {
  state.committed.length = 0;
  state.failTable = null;
  state.nextId = 1;
  state.db.insert.mockClear();
  state.db.update.mockClear();
  state.db.transaction.mockClear();
});

describe("Starting a workout is one transaction", () => {
  it("leaves no session behind when its exercises cannot be saved", async () => {
    state.failTable = workoutSessionExercises;

    await expect(createWorkoutSession(7, plannedWorkout)).rejects.toThrow("connection reset");

    expect(rowsOf(workoutSessions)).toEqual([]);
    expect(rowsOf(workoutSessionExercises)).toEqual([]);
    expect(state.db.insert).not.toHaveBeenCalled();
  });

  it("saves the session and every planned exercise together", async () => {
    const session = await createWorkoutSession(7, plannedWorkout);

    expect(state.db.transaction).toHaveBeenCalledTimes(1);
    expect(rowsOf(workoutSessions)).toEqual([expect.objectContaining({ userId: 7, title: "Lower A", plannedExerciseCount: 2 })]);
    expect(rowsOf(workoutSessionExercises).map((row) => [row.exerciseName, row.exerciseOrder, row.sessionId]))
      .toEqual([["Back Squat", 0, session?.id], ["Romanian Deadlift", 1, session?.id]]);
    expect(session?.exercises).toHaveLength(2);
  });
});

describe("Saving a strength test is one transaction", () => {
  it("does not keep the lift when its body-weight row cannot be saved, so a retry saves it once", async () => {
    state.failTable = bodyMassObservations;

    await expect(createStrengthObservation(7, benchTest)).rejects.toThrow("connection reset");

    expect(rowsOf(strengthObservations)).toEqual([]);
    expect(state.db.insert).not.toHaveBeenCalled();
  });

  it("saves the lift and the body weight it was read against together", async () => {
    const saved = await createStrengthObservation(7, benchTest);

    expect(saved).toMatchObject({ exerciseName: "Bench Press", bodyMassKgAtTest: "82.50" });
    expect(rowsOf(bodyMassObservations)).toEqual([expect.objectContaining({ userId: 7, bodyMassKg: "82.50", source: "athlete_entry" })]);
  });

  it("does not change a saved test's body weight when the body-weight row cannot be saved", async () => {
    await createStrengthObservation(7, { ...benchTest, bodyMassKgAtTest: undefined });
    const observationId = rowsOf(strengthObservations)[0].id as number;
    state.failTable = bodyMassObservations;

    await expect(setStrengthObservationBodyMass(7, observationId, 84)).rejects.toThrow("connection reset");

    expect(state.committed.filter((write) => write.kind === "update")).toEqual([]);
    expect(state.db.update).not.toHaveBeenCalled();
  });
});
