import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => {
  const state: { queues: unknown[][]; inserted: unknown[]; db: any } = { queues: [], inserted: [], db: null };
  const query = () => {
    const rows = state.queues.shift() || [];
    const chain: any = {
      from: () => chain,
      innerJoin: () => chain,
      where: () => chain,
      orderBy: () => chain,
      limit: () => Promise.resolve(rows),
      then: (resolve: (value: unknown[]) => unknown, reject?: (reason: unknown) => unknown) => Promise.resolve(rows).then(resolve, reject),
    };
    return chain;
  };
  state.db = {
    select: vi.fn(() => query()),
    insert: vi.fn(() => ({ values: vi.fn((value: unknown) => {
      state.inserted.push(value);
      return { onDuplicateKeyUpdate: vi.fn(async () => undefined) };
    }) })),
  };
  return state;
});

vi.mock("./db", () => ({ getDb: vi.fn(async () => state.db) }));

import { listProgressionSets, upsertWorkoutSet } from "./workoutSessions";

describe("authenticated RPE logging flow", () => {
  beforeEach(() => {
    state.queues = [];
    state.inserted = [];
    state.db.select.mockClear();
    state.db.insert.mockClear();
  });

  it("stores a logged RPE for an owned active set and returns the effort in progression history", async () => {
    state.queues.push(
      [{ sessionId: 71, userId: 22, status: "active" }],
      [{ id: 71, userId: 22, status: "active" }],
      [{ id: 101, sessionId: 71, exerciseOrder: 0 }],
      [{ sessionExerciseId: 101, setNumber: 1, actualWeight: "22.50", actualReps: 10, actualRpe: "9.0", completed: true }],
      [{ sessionId: 71, completedAt: new Date(), catalogExerciseId: 10, exerciseName: "Dumbbell Curl", actualWeight: "22.50", weightUnit: "lb", actualReps: 10, actualRpe: "9.0", completed: true }],
    );

    await upsertWorkoutSet(22, { sessionExerciseId: 101, setNumber: 1, actualWeight: 22.5, weightUnit: "lb", actualReps: 10, actualRpe: 9, completed: true });
    const history = await listProgressionSets(22);

    expect(state.inserted[0]).toMatchObject({ actualRpe: "9.0", actualWeight: "22.50", actualReps: 10, completed: true });
    expect(history[0]).toMatchObject({ sessionId: 71, actualRpe: "9.0", completed: true });
  });

  it("does not write a set when the session exercise belongs to another account", async () => {
    state.queues.push([{ sessionId: 71, userId: 99, status: "active" }]);

    const result = await upsertWorkoutSet(22, { sessionExerciseId: 101, setNumber: 1, weightUnit: "lb", actualRpe: 8, completed: true });

    expect(result).toBeNull();
    expect(state.inserted).toEqual([]);
  });
});
