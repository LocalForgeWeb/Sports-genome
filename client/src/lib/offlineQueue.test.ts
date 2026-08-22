import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  enqueue,
  flushQueue,
  mergeIntoQueue,
  queueSnapshot,
  resetQueueForTests,
  type QueuedWrite,
  type SendResult,
} from "./offlineQueue";

function setLog(sessionExerciseId: number, setNumber: number, completed = true): QueuedWrite {
  return {
    id: `set-${sessionExerciseId}-${setNumber}`,
    kind: "logSet",
    sessionId: 7,
    queuedAt: 1000,
    payload: { sessionExerciseId, setNumber, weightUnit: "lb", completed },
  };
}

function complete(sessionId = 7): QueuedWrite {
  return {
    id: `complete-${sessionId}`,
    kind: "complete",
    sessionId,
    queuedAt: 2000,
    payload: { sessionId },
  };
}

describe("mergeIntoQueue", () => {
  it("appends distinct writes in order", () => {
    const queue = [setLog(1, 1), setLog(1, 2)].reduce(mergeIntoQueue, [] as QueuedWrite[]);

    expect(queue.map(entry => entry.id)).toEqual(["set-1-1", "set-1-2"]);
  });

  it("collapses repeated logs of the same set instead of growing", () => {
    // Toggling a set off and on while offline must not queue three writes.
    const queue = [setLog(1, 1, true), setLog(1, 1, false), setLog(1, 1, true)].reduce(
      mergeIntoQueue,
      [] as QueuedWrite[]
    );

    expect(queue).toHaveLength(1);
    expect(queue[0].payload).toMatchObject({ completed: true });
  });

  it("keeps a superseded entry in its original position", () => {
    // Moving it to the tail would reorder it past the `complete` below, and the
    // server rejects set logs against a session that is no longer active.
    let queue: QueuedWrite[] = [];
    queue = mergeIntoQueue(queue, setLog(1, 1));
    queue = mergeIntoQueue(queue, complete());
    queue = mergeIntoQueue(queue, setLog(1, 1, false));

    expect(queue.map(entry => entry.kind)).toEqual(["logSet", "complete"]);
  });

  it("treats different sets on the same exercise as separate writes", () => {
    const queue = [setLog(1, 1), setLog(1, 2), setLog(2, 1)].reduce(mergeIntoQueue, [] as QueuedWrite[]);

    expect(queue).toHaveLength(3);
  });

  it("collapses repeated completes of one session", () => {
    const queue = [complete(7), complete(7)].reduce(mergeIntoQueue, [] as QueuedWrite[]);

    expect(queue).toHaveLength(1);
  });
});

/**
 * The test environment is Node, which has no Web Storage. The queue's
 * durability across a relaunch is the behaviour under test here, so it gets a
 * spec-shaped in-memory stand-in rather than being mocked away.
 */
function installLocalStorageStub() {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
      clear: () => store.clear(),
    },
  });
}

describe("flushQueue", () => {
  beforeEach(() => {
    resetQueueForTests();
    installLocalStorageStub();
  });

  it("replays writes in order and empties the queue", async () => {
    await enqueue(setLog(1, 1));
    await enqueue(setLog(1, 2));
    await enqueue(complete());

    const seen: string[] = [];
    const result = await flushQueue(async entry => {
      seen.push(entry.id);
      return "ok";
    });

    expect(seen).toEqual(["set-1-1", "set-1-2", "complete-7"]);
    expect(result).toMatchObject({ sent: 3, dropped: 0, remaining: 0 });
    expect(queueSnapshot()).toHaveLength(0);
  });

  it("stops at the first transport failure and keeps the rest queued", async () => {
    await enqueue(setLog(1, 1));
    await enqueue(setLog(1, 2));
    await enqueue(complete());

    const send = vi
      .fn<(entry: QueuedWrite) => Promise<SendResult>>()
      .mockResolvedValueOnce("ok")
      .mockResolvedValueOnce("retry");

    const result = await flushQueue(send);

    // Draining past the failure would replay `complete` before the set that
    // precedes it.
    expect(send).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({ sent: 1, remaining: 2 });
    expect(queueSnapshot().map(entry => entry.id)).toEqual(["set-1-2", "complete-7"]);
  });

  it("drops a write the server rejected so it cannot wedge the queue", async () => {
    await enqueue(setLog(1, 1));
    await enqueue(setLog(1, 2));

    const result = await flushQueue(async entry => (entry.id === "set-1-1" ? "drop" : "ok"));

    expect(result).toMatchObject({ sent: 1, dropped: 1, remaining: 0 });
  });

  it("keeps the entry when the sender throws", async () => {
    await enqueue(setLog(1, 1));

    const result = await flushQueue(async () => {
      throw new Error("network down");
    });

    expect(result).toMatchObject({ sent: 0, remaining: 1 });
    expect(queueSnapshot()).toHaveLength(1);
  });

  it("restores the queue from storage after a relaunch", async () => {
    await enqueue(setLog(3, 1));

    // Simulate the app being killed and reopened: memory is gone, storage is not.
    resetQueueForTests();

    const seen: string[] = [];
    await flushQueue(async entry => {
      seen.push(entry.id);
      return "ok";
    });

    expect(seen).toEqual(["set-3-1"]);
  });
});
