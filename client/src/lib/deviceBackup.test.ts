// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyBackupImport, athleteProfileKeyBase, backupFileName, backupFormat, backupMaxBytes, buildDeviceBackup, importConflicts,
  previewBackupImport, readBackup, restoreImportSnapshot, serializeBackup, workoutPlanKeyBase, favoriteExerciseKeyBase,
} from "./deviceBackup";
import { deviceWorkoutHistoryKey, loadDeviceWorkoutSessions, saveDeviceWorkoutSessions, type DeviceWorkoutSession } from "./deviceWorkoutLog";
import { bodyWeightLogKey, loadBodyWeightLog } from "./bodyWeightLog";
import { resetDeviceRecordStoreForTests, setDeviceStorageOwner } from "./deviceRecordStore";
import { strengthSyncQueueKey } from "./strengthSyncQueue";

/**
 * iOS readiness audit, A03: a web athlete's history survives export and import into another
 * install (the iOS app, another browser) exactly, nothing is overwritten silently, a bad file
 * changes nothing, and no credential leaves the device.
 */

/** 120 finished workouts across every shape the log has stored: the audit's "100+ workouts" fixture. */
function history(): DeviceWorkoutSession[] {
  const sessions: DeviceWorkoutSession[] = [];
  for (let index = 0; index < 120; index += 1) {
    const day = new Date(Date.UTC(2025, 0, 1) + index * 3 * 86_400_000).toISOString();
    const base: DeviceWorkoutSession = {
      id: `w-${index}`,
      title: index % 2 ? "Lower" : "Upper",
      dayLabel: `Day ${(index % 4) + 1}`,
      startedAt: day,
      completedAt: day,
      status: "completed",
      // Old sessions stored no unit (decision D-005); later ones lb, then kg.
      ...(index < 30 ? {} : { weightUnit: index < 80 ? "lb" : "kg" }),
      exercises: [{ id: `e-${index}`, exerciseName: "Barbell Back Squat", catalogId: 12, plannedPrescription: "3 x 5", sets: [{ weight: "225", reps: "5", completed: true, id: `s-${index}` }] }],
    };
    if (index === 5) base.exercises.push({
      // A drop set: 100 lb x 5, 70 x 6, 50 x 10, one set.
      id: "drop", exerciseName: "Dumbbell Curl", plannedPrescription: "1 x 8", sets: [{ weight: "100", reps: "5", completed: true, id: "drop-set", type: "drop", unit: "lb",
        stages: [{ id: "st1", weight: "100", reps: "5", unit: "lb" }, { id: "st2", weight: "70", reps: "6", unit: "lb" }, { id: "st3", weight: "50", reps: "10", unit: "lb" }] }],
    });
    if (index === 6) base.exercises = [
      // A mid-session swap: sissy squats, then barbell squats for the rest.
      { id: "sissy", exerciseName: "Sissy Squat", plannedPrescription: "3 x 10", sets: [{ weight: "0", reps: "10", completed: true, id: "ss1" }],
        replacedBy: { swapId: "swap-1", exerciseName: "Barbell Back Squat", catalogId: 12, afterSets: 1, at: day } },
      { id: "squat", exerciseName: "Barbell Back Squat", catalogId: 12, plannedPrescription: "3 x 10", sets: [{ weight: "185", reps: "10", completed: true, id: "bs1" }],
        swappedFrom: { swapId: "swap-1", exerciseName: "Sissy Squat", afterSets: 1, at: day } },
    ];
    if (index === 7) base.exercises.push({ id: "hang", exerciseName: "Dead Hang", plannedPrescription: "3 x 30 sec", sets: [{ weight: "", reps: "", holdSeconds: "45", completed: true, id: "h1" }] });
    if (index === 8) base.exercises.push({ id: "uni", exerciseName: "Single-Arm Dumbbell Row", plannedPrescription: "3 x 10", sets: [{ weight: "60", reps: "10", side: "left", completed: true, id: "u1" }, { weight: "60", reps: "10", side: "right", completed: true, id: "u2" }] });
    if (index === 9) base.note = "Felt strong; belt on the top set.";
    // A field a later release added, which this one must carry without knowing it.
    if (index === 10) (base as DeviceWorkoutSession & { tempoNotes?: string }).tempoNotes = "3-1-1";
    sessions.push(base);
  }
  return sessions;
}

const seedWebDevice = () => {
  expect(saveDeviceWorkoutSessions(history())).toBe(true);
  window.localStorage.setItem(bodyWeightLogKey, JSON.stringify([
    { bodyMassKg: 82.5, enteredUnit: "kg", observedAt: "2025-01-01T00:00:00.000Z", source: "onboarding" },
    { bodyMassKg: 81, enteredUnit: "lb", observedAt: "2025-06-01T00:00:00.000Z", source: "athlete_entry" },
  ]));
  window.localStorage.setItem(athleteProfileKeyBase, JSON.stringify({ version: 3, sportId: "wrestling", goal: "Athleticism", baseline: { experience: "Intermediate", weightUnit: "lb" } }));
  window.localStorage.setItem(workoutPlanKeyBase, JSON.stringify({ weeks: [{ id: "week-1" }] }));
  window.localStorage.setItem(favoriteExerciseKeyBase, JSON.stringify([12, 40]));
  // Things that must never travel.
  window.localStorage.setItem("sports-genome-auth-v1", JSON.stringify({ access_token: "secret-token", refresh_token: "secret-refresh" }));
  window.localStorage.setItem("sg-shared-by-me-v1", JSON.stringify([{ token: "t1", manageSecret: "manage-secret" }]));
  window.localStorage.setItem(strengthSyncQueueKey, JSON.stringify([{ key: "q", lift: {}, athlete: {} }]));
};

beforeEach(() => {
  window.localStorage.clear();
  resetDeviceRecordStoreForTests();
});

describe("exporting what this device holds", () => {
  it("carries every workout exactly as stored, with no credential, link secret or outbox", () => {
    seedWebDevice();
    const backup = buildDeviceBackup(null, undefined, new Date("2026-11-02T12:00:00.000Z"));
    expect(backup.format).toBe(backupFormat);
    expect(backup.version).toBe(1);
    expect(backup.records.workouts).toHaveLength(120);
    expect(backup.records.bodyWeights).toHaveLength(2);
    expect(backup.records.favorites).toEqual([12, 40]);
    const textContent = serializeBackup(backup);
    for (const secret of ["secret-token", "secret-refresh", "manage-secret", "access_token"]) expect(textContent).not.toContain(secret);
    expect(textContent).not.toContain("sports-genome-strength-sync-queue");
    expect(backupFileName(new Date("2026-11-02T12:00:00.000Z"))).toBe("sports-genome-backup-2026-11-02.json");
  });
});

describe("moving a web history into a fresh install", () => {
  it("brings across every workout, drop set, swap, hold, side, note, unit and body weight", () => {
    seedWebDevice();
    const exported = serializeBackup(buildDeviceBackup());
    const original = loadDeviceWorkoutSessions();

    // The fresh install: nothing but the onboarding defaults.
    window.localStorage.clear();
    resetDeviceRecordStoreForTests();
    const read = readBackup(exported);
    if (!read.ok) throw new Error(read.reason);
    const preview = previewBackupImport(read.backup);
    expect(preview.lists.find((item) => item.name === "workouts")).toMatchObject({ add: 120, same: 0, conflicts: 0, invalid: 0 });
    expect(preview.documents.find((item) => item.name === "plan")?.action).toBe("add");
    expect(preview.changes).toBe(true);

    const result = applyBackupImport(read.backup);
    expect(result.ok).toBe(true);
    const imported = loadDeviceWorkoutSessions();
    expect(imported).toEqual(original);
    const drop = imported.find((session) => session.id === "w-5")!.exercises[1].sets[0];
    expect(drop.stages?.map((stage) => [stage.weight, stage.reps])).toEqual([["100", "5"], ["70", "6"], ["50", "10"]]);
    const swap = imported.find((session) => session.id === "w-6")!;
    expect(swap.exercises.map((exercise) => exercise.exerciseName)).toEqual(["Sissy Squat", "Barbell Back Squat"]);
    expect(imported.find((session) => session.id === "w-7")!.exercises[1].sets[0].holdSeconds).toBe("45");
    expect(imported.find((session) => session.id === "w-8")!.exercises[1].sets.map((set) => set.side)).toEqual(["left", "right"]);
    expect(imported.find((session) => session.id === "w-9")!.note).toBe("Felt strong; belt on the top set.");
    expect(imported.find((session) => session.id === "w-2")!.weightUnit).toBeUndefined();
    expect(imported.find((session) => session.id === "w-100")!.weightUnit).toBe("kg");
    expect((imported.find((session) => session.id === "w-10") as DeviceWorkoutSession & { tempoNotes?: string }).tempoNotes).toBe("3-1-1");
    expect(loadBodyWeightLog().map((entry) => entry.bodyMassKg)).toEqual([82.5, 81]);
    expect(JSON.parse(window.localStorage.getItem(workoutPlanKeyBase)!)).toEqual({ weeks: [{ id: "week-1" }] });
  });

  it("imports into the signed-in owner's records, not the shared ones", () => {
    seedWebDevice();
    const read = readBackup(serializeBackup(buildDeviceBackup()));
    window.localStorage.clear();
    setDeviceStorageOwner("athlete-a");
    if (!read.ok) throw new Error(read.reason);
    expect(applyBackupImport(read.backup).ok).toBe(true);
    expect(window.localStorage.getItem(deviceWorkoutHistoryKey)).toBeNull();
    expect(JSON.parse(window.localStorage.getItem(`${deviceWorkoutHistoryKey}::athlete-a`)!)).toHaveLength(120);
  });

  it("is safe to run twice: the second time changes nothing", () => {
    seedWebDevice();
    const read = readBackup(serializeBackup(buildDeviceBackup()));
    if (!read.ok) throw new Error(read.reason);
    const preview = previewBackupImport(read.backup);
    expect(preview.lists.find((item) => item.name === "workouts")).toMatchObject({ add: 0, same: 120, conflicts: 0 });
    expect(preview.changes).toBe(false);
    expect(applyBackupImport(read.backup)).toEqual({ ok: false, reason: "nothing-to-import" });
  });
});

describe("importing next to records already on the device", () => {
  it("keeps the device's copy of a clashing workout, sets the imported one aside, and adds the rest", () => {
    seedWebDevice();
    const read = readBackup(serializeBackup(buildDeviceBackup()));
    if (!read.ok) throw new Error(read.reason);
    // The device has since corrected one workout and logged a new one.
    const local = loadDeviceWorkoutSessions().filter((session) => session.id !== "w-119");
    local[0] = { ...local[0], note: "corrected on this device" };
    saveDeviceWorkoutSessions([...local, { ...history()[0], id: "device-only" }]);

    const preview = previewBackupImport(read.backup);
    expect(preview.lists.find((item) => item.name === "workouts")).toMatchObject({ add: 1, same: 118, conflicts: 1 });
    const result = applyBackupImport(read.backup);
    expect(result).toMatchObject({ ok: true, added: 1, conflictsKept: 1 });
    const after = loadDeviceWorkoutSessions();
    expect(after).toHaveLength(121);
    expect(after.find((session) => session.id === local[0].id)?.note).toBe("corrected on this device");
    expect(importConflicts()).toHaveLength(1);
    expect((importConflicts()[0].record as { id: string }).id).toBe(local[0].id);
  });

  it("keeps the device's plan and profile unless asked to replace them, and then keeps the old ones", () => {
    seedWebDevice();
    const read = readBackup(serializeBackup(buildDeviceBackup()));
    if (!read.ok) throw new Error(read.reason);
    window.localStorage.setItem(workoutPlanKeyBase, JSON.stringify({ weeks: [{ id: "device-week" }] }));
    expect(previewBackupImport(read.backup).documents.find((item) => item.name === "plan")?.action).toBe("keep-device");
    expect(previewBackupImport(read.backup, { replaceDocuments: true }).documents.find((item) => item.name === "plan")?.action).toBe("replace");
    const result = applyBackupImport(read.backup, { replaceDocuments: true });
    expect(result).toMatchObject({ ok: true, needsReload: true });
    expect(JSON.parse(window.localStorage.getItem(workoutPlanKeyBase)!)).toEqual({ weeks: [{ id: "week-1" }] });
    expect(importConflicts().some((item) => item.store === "plan" && item.replacedOnDevice === true)).toBe(true);
  });

  it("does not start a second running workout: an imported one waits as a conflict", () => {
    const running = { ...history()[0], id: "running-here", status: "active" as const, completedAt: undefined };
    saveDeviceWorkoutSessions([running]);
    const elsewhere = { ...history()[1], id: "running-there", status: "active" as const, completedAt: undefined };
    const backup = { format: backupFormat, version: 1, exportedAt: "2026-11-02T00:00:00.000Z", build: { commit: "x", builtAt: "" }, records: { workouts: [elsewhere] } };
    const read = readBackup(JSON.stringify(backup));
    if (!read.ok) throw new Error(read.reason);
    expect(previewBackupImport(read.backup).lists[0]).toMatchObject({ add: 0, conflicts: 1 });
  });

  it("can be undone exactly", () => {
    seedWebDevice();
    const read = readBackup(serializeBackup(buildDeviceBackup()));
    window.localStorage.clear();
    window.localStorage.setItem(workoutPlanKeyBase, JSON.stringify({ weeks: [{ id: "device-week" }] }));
    const before = { ...window.localStorage };
    if (!read.ok) throw new Error(read.reason);
    const result = applyBackupImport(read.backup);
    if (!result.ok) throw new Error(result.reason);
    expect(loadDeviceWorkoutSessions()).toHaveLength(120);
    expect(restoreImportSnapshot(result.snapshot)).toBe(true);
    expect({ ...window.localStorage }).toEqual(before);
  });
});

describe("a file that is not a good backup", () => {
  it("is refused before anything is written, with the reason", () => {
    seedWebDevice();
    const before = { ...window.localStorage };
    expect(readBackup("not json")).toEqual({ ok: false, reason: "not-json" });
    expect(readBackup(JSON.stringify({ hello: "world" }))).toEqual({ ok: false, reason: "not-a-backup" });
    expect(readBackup(JSON.stringify({ format: backupFormat, version: 2, exportedAt: "x", records: {} }))).toEqual({ ok: false, reason: "newer-version" });
    expect(readBackup(JSON.stringify({ format: backupFormat, version: 1, exportedAt: "x", records: { workouts: "all of them" } }))).toEqual({ ok: false, reason: "malformed" });
    expect(readBackup(JSON.stringify({ format: backupFormat, version: 1.5, exportedAt: "x", records: {} }))).toEqual({ ok: false, reason: "malformed" });
    expect(readBackup(" ".repeat(backupMaxBytes + 1))).toEqual({ ok: false, reason: "too-large" });
    expect({ ...window.localStorage }).toEqual(before);
  });

  it("skips invalid and duplicated records and counts them, and cannot reach an object's prototype", () => {
    const crafted = `{"format":"${backupFormat}","version":1,"exportedAt":"2026-11-02T00:00:00.000Z","records":{"workouts":[
      {"id":"ok","startedAt":"2026-10-01T00:00:00.000Z","status":"completed","exercises":[]},
      {"id":"ok","startedAt":"2026-10-01T00:00:00.000Z","status":"completed","exercises":[]},
      {"id":"bad-status","startedAt":"2026-10-01T00:00:00.000Z","status":"deleted","exercises":[]},
      {"startedAt":"2026-10-01T00:00:00.000Z","status":"completed","exercises":[]},
      "a string",
      {"id":"proto","startedAt":"2026-10-01T00:00:00.000Z","status":"completed","exercises":[],"__proto__":{"polluted":true}}
    ]}}`;
    const read = readBackup(crafted);
    if (!read.ok) throw new Error(read.reason);
    const preview = previewBackupImport(read.backup);
    expect(preview.lists[0]).toMatchObject({ add: 2, invalid: 4 });
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
    applyBackupImport(read.backup);
    expect(loadDeviceWorkoutSessions().map((session) => session.id)).toEqual(["ok", "proto"]);
    expect(JSON.stringify(loadDeviceWorkoutSessions())).not.toContain("polluted");
  });

  it("leaves the device exactly as it was when storage refuses part of the import", () => {
    seedWebDevice();
    const read = readBackup(serializeBackup(buildDeviceBackup()));
    window.localStorage.clear();
    window.localStorage.setItem(bodyWeightLogKey, JSON.stringify([{ bodyMassKg: 90, enteredUnit: "kg", observedAt: "2026-10-01T00:00:00.000Z", source: "athlete_entry" }]));
    const before = { ...window.localStorage };
    const setItem = Storage.prototype.setItem;
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key: string, value: string) {
      if (key === bodyWeightLogKey && value.includes("82.5")) throw new DOMException("full", "QuotaExceededError");
      return setItem.call(this, key, value);
    });
    if (!read.ok) throw new Error(read.reason);
    expect(applyBackupImport(read.backup)).toEqual({ ok: false, reason: "storage-refused" });
    spy.mockRestore();
    expect({ ...window.localStorage }).toEqual(before);
  });
});
