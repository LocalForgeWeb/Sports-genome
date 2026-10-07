import { describe, expect, it } from "vitest";
import { archiveSetup, cleanDraft, draftChanged, draftFrom, duplicateSetup, emptySetupStore, isSetupStore, restoreSetup, saveSetup, selectSetup, selectedSetup, settingsLine, setupsFor, suggestedSettings, type SetupStore } from "./setupNotebook";

const ROW = 54;
const PRESS = 1;
const now = (minute: number) => `2026-10-07T10:${String(minute).padStart(2, "0")}:00.000Z`;
const draft = (label: string, settings: [string, string][] = [], extra: Partial<{ location: string; reminder: string }> = {}) => ({ label, location: extra.location ?? "", reminder: extra.reminder ?? "", settings: settings.map(([name, value]) => ({ name, value })) });

function schoolGym(): SetupStore {
  const saved = saveSetup(emptySetupStore, ROW, draft("School gym", [["Seat", "4"], ["Cable height", "low"]], { location: "Lincoln High", reminder: "Keep the same foot position" }), { newId: "s1", now: now(0), select: true });
  if (!saved.ok) throw new Error(saved.message);
  return saved.store;
}

/** Utility brief §4 acceptance journey (SN02-SN09, SN13). */
describe("My setup notebook", () => {
  it("saves a named setup with settings and a reminder, and it reads back the same after a reload", () => {
    const store = schoolGym();
    const reloaded = JSON.parse(JSON.stringify(store)) as unknown;
    expect(isSetupStore(reloaded)).toBe(true);
    const setup = selectedSetup(reloaded as SetupStore, ROW)!;
    expect(setup).toMatchObject({ id: "s1", catalogExerciseId: ROW, label: "School gym", location: "Lincoln High", reminder: "Keep the same foot position" });
    expect(settingsLine(setup)).toBe("Seat 4 · Cable height low");
  });

  it("duplicates it as Home gym with one setting changed, and the two stay distinct", () => {
    let store = schoolGym();
    const copy = duplicateSetup(store, "s1", "s2", now(1))!;
    store = copy.store;
    expect(copy.setup).toMatchObject({ id: "s2", label: "School gym (copy)" });
    const edited = saveSetup(store, ROW, { ...draftFrom(copy.setup), label: "Home gym", settings: [{ name: "Seat", value: "6" }, { name: "Cable height", value: "low" }] }, { id: "s2", newId: "unused", now: now(2), select: true });
    if (!edited.ok) throw new Error(edited.message);
    store = edited.store;
    expect(selectedSetup(store, ROW)?.label).toBe("Home gym");
    expect(settingsLine(store.setups.find((setup) => setup.id === "s1")!)).toBe("Seat 4 · Cable height low");
    // Switching back is an explicit choice, and changes nothing in either profile.
    store = selectSetup(store, ROW, "s1");
    expect(selectedSetup(store, ROW)?.label).toBe("School gym");
    expect(settingsLine(store.setups.find((setup) => setup.id === "s2")!)).toBe("Seat 6 · Cable height low");
    expect(setupsFor(store, ROW).map((setup) => setup.label)).toEqual(["Home gym", "School gym"]);
  });

  it("never picks a setup for you: none is chosen until the athlete chooses", () => {
    const saved = saveSetup(emptySetupStore, ROW, draft("Away gym"), { newId: "s1", now: now(0) });
    if (!saved.ok) throw new Error(saved.message);
    expect(setupsFor(saved.store, ROW)).toHaveLength(1);
    expect(selectedSetup(saved.store, ROW)).toBeNull();
  });

  it("keeps identical names on different exercises apart", () => {
    const first = schoolGym();
    const second = saveSetup(first, PRESS, draft("School gym", [["Bench angle", "30°"]]), { newId: "p1", now: now(3), select: true });
    if (!second.ok) throw new Error(second.message);
    expect(selectedSetup(second.store, ROW)?.id).toBe("s1");
    expect(selectedSetup(second.store, PRESS)?.id).toBe("p1");
    expect(setupsFor(second.store, ROW)).toHaveLength(1);
  });

  it("archives without deleting, unselects the archived one, and restores it", () => {
    let store = archiveSetup(schoolGym(), "s1", now(4));
    expect(selectedSetup(store, ROW)).toBeNull();
    expect(setupsFor(store, ROW)).toEqual([]);
    expect(setupsFor(store, ROW, { archived: true }).map((setup) => setup.id)).toEqual(["s1"]);
    store = restoreSetup(store, "s1", now(5));
    expect(setupsFor(store, ROW).map((setup) => setup.id)).toEqual(["s1"]);
    // Restoring brings the setup back, not the choice: choosing stays the athlete's.
    expect(selectedSetup(store, ROW)).toBeNull();
  });

  it("requires a name, trims what was typed and leaves empty fields out", () => {
    expect(cleanDraft(draft("   "))).toEqual({ ok: false, message: "Give the setup a name, like School gym." });
    const cleaned = cleanDraft(draft("  Home   gym ", [["Seat", " 6 "], ["", "orphan value"], ["Pin", ""]]));
    expect(cleaned).toEqual({ ok: true, value: { label: "Home gym", settings: [{ name: "Seat", value: "6" }] } });
    expect(cleanDraft(draft("x".repeat(200))).ok && (cleanDraft(draft("x".repeat(200))) as { value: { label: string } }).value.label).toHaveLength(60);
  });

  it("knows when a draft holds unsaved typing", () => {
    const setup = selectedSetup(schoolGym(), ROW)!;
    expect(draftChanged(draftFrom(setup), setup)).toBe(false);
    expect(draftChanged({ ...draftFrom(setup), reminder: "New cue" }, setup)).toBe(true);
    expect(draftChanged(draftFrom(), undefined)).toBe(false);
    expect(draftChanged({ ...draftFrom(), label: "G" }, undefined)).toBe(true);
  });

  it("offers setting names that fit the equipment", () => {
    expect(suggestedSettings("Machine")).toContain("Seat");
    expect(suggestedSettings("Cable")).toContain("Cable height");
    expect(suggestedSettings("Barbell")).toContain("Rack height");
  });

  it("rejects a corrupt store rather than reading it", () => {
    expect(isSetupStore({ version: 1, setups: [{ id: 1 }], selected: {} })).toBe(false);
    expect(isSetupStore(null)).toBe(false);
    expect(isSetupStore(emptySetupStore)).toBe(true);
  });
});
