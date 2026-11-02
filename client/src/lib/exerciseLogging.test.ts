import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  comparisonSetupFieldsOf, editableSetupFieldsOf, headDirectionActionOf, headDirectionPrompt, isLoadUnmeasured, loadBasisText, normalizeSetup, protocolKeyOf, setsOwnTarget,
  setupNumberText, setupSummaryOf,
} from "./exerciseLogging";
import { exerciseExecutionById } from "./exerciseExecution";
import { exerciseLoggingFacts } from "./exerciseLoggingFacts.generated";

/**
 * How a set of the Zercher, neck and bench rows is recorded and compared (the owner's handoff of
 * 23 Oct 2026, §3.2-3.4): which rows ask the head's direction and how, what the load box means,
 * which setup values make two sets a different protocol.
 */
type ManifestRecord = { key: string; logging: { measure: string; loadBasis: string; directionRequired: boolean; extraFields: string[]; comparisonKeyFields: string[] } };
const handoff = readFileSync(join(process.cwd(), "docs/exercise-additions/2026-10-23-zercher-neck-bench-handoff.md"), "utf8");
const manifest = JSON.parse(/<!-- EXERCISE_MANIFEST_START -->\s*```json\s*([\s\S]*?)\s*```/.exec(handoff)![1]) as { exercises: ManifestRecord[] };
const idOfKey = new Map(Array.from(exerciseExecutionById, ([id, record]) => [record.key, id]));

describe("the rows' logging, against the handoff's manifest", () => {
  it("compares sets on exactly the manifest's comparison key fields: the setup fields that are not notes, and the head direction on a row done to a side", () => {
    let checked = 0;
    for (const record of manifest.exercises) {
      const id = idOfKey.get(record.key);
      // The handoff's Smith incline is the existing row 15, which has no execution record of its own.
      if (id === undefined) { expect(record.key).toBe("smith_incline_bench"); continue; }
      const { comparisonKeyFields, measure, loadBasis, directionRequired, extraFields } = record.logging;
      expect(comparisonSetupFieldsOf(id), record.key).toEqual(comparisonKeyFields.filter((field) => !["key", "loadBasis", "headDirection"].includes(field)));
      expect(comparisonKeyFields.includes("headDirection"), record.key).toBe(headDirectionActionOf(id) !== null);
      expect(directionRequired, record.key).toBe(headDirectionActionOf(id) !== null);
      expect([exerciseExecutionById.get(id)!.measure, exerciseLoggingFacts.get(id)!.load], record.key).toEqual([measure, loadBasis]);
      // "effort" is the set's own effort (shared/setEffort.ts), recorded per set and never a setup value or a key.
      expect([...exerciseLoggingFacts.get(id)!.setupFields].sort(), record.key).toEqual(extraFields.filter((field) => field !== "effort").sort());
      expect(comparisonKeyFields, record.key).not.toContain("effort");
      checked += 1;
    }
    expect(checked).toBe(23);
  });
});

describe("head direction", () => {
  it("is asked on side bends and rotations only: Head direction where the head moves, Push / turn toward on a hold (T09)", () => {
    for (const id of [427, 431, 432]) expect(headDirectionPrompt(id), `catalog ${id}`).toBe("Head direction");
    for (const id of [435, 436]) expect(headDirectionPrompt(id), `catalog ${id}`).toBe("Push / turn toward");
    for (const id of [425, 426, 428, 429, 430, 433, 434, 421, 437, 1, 143, undefined]) expect(headDirectionPrompt(id), `catalog ${id}`).toBeNull();
  });
});

describe("what the load box means", () => {
  it("has no load on a manually resisted row, and says how every other row's load is counted", () => {
    expect([433, 434, 435, 436].every(isLoadUnmeasured)).toBe(true);
    expect([424, 425, 428, 437, 440].some(isLoadUnmeasured)).toBe(false);
    expect(loadBasisText(435, undefined)).toBe("Manual resistance · force not measured");
    expect(loadBasisText(437, undefined)).toBe("Plates per arm");
    expect(loadBasisText(438, undefined)).toBe("Machine load as displayed");
    expect(loadBasisText(428, undefined)).toBe("Harness load");
    expect(loadBasisText(440, undefined)).toBe("Load basis not recorded");
    expect(loadBasisText(440, { load_convention: "plates_only" })).toBe("Plates only");
    expect(loadBasisText(440, { load_convention: "total_known_bar" })).toBe("Plates + known bar");
    expect(loadBasisText(421, undefined)).toBeNull();
    expect(loadBasisText(1, undefined)).toBeNull();
  });

  it("asks a Smith machine's basis, and states every other row's own convention instead of asking it", () => {
    expect(editableSetupFieldsOf(440)).toContain("load_convention");
    for (const id of [437, 438, 439]) expect(editableSetupFieldsOf(id), `catalog ${id}`).not.toContain("load_convention");
    expect(editableSetupFieldsOf(1)).toEqual([]);
  });
});

describe("setup values", () => {
  it("keeps text, a number only as a number, a Smith basis only as one of two, a later release's key as stored, and nothing empty", () => {
    expect(normalizeSetup({ start_height_cm: "45", bar_type: "  Standard  ", pause_seconds: "2s", hover_distance_cm: "", load_convention: "45 lb bar", seat_setting: 4, laterField: "kept" })).toEqual({ start_height_cm: "45", bar_type: "Standard", laterField: "kept" });
    expect(normalizeSetup({ load_convention: "plates_only" })).toEqual({ load_convention: "plates_only" });
    expect(normalizeSetup({})).toBeNull();
    expect(normalizeSetup(["45"])).toBeNull();
    expect(normalizeSetup(null)).toBeNull();
    expect(setupNumberText("45,5 cm")).toBe("45.5");
    expect(setupNumberText("-3")).toBe("3");
  });

  it("says what was recorded and names what was not (T04: the height is always in view)", () => {
    expect(setupSummaryOf(422, { start_height_cm: "45" })).toBe("Start height 45 cm · Bar not recorded");
    expect(setupSummaryOf(422, { start_height_cm: "45", bar_type: "Standard" })).toBe("Start height 45 cm · Bar: Standard");
    expect(setupSummaryOf(422, undefined)).toBe("Setup not recorded");
    expect(setupSummaryOf(437, { machine_model: "Hammer Strength" })).toBe("Machine: Hammer Strength · Seat or bench not recorded");
    expect(setupSummaryOf(440, { load_convention: "plates_only" })).toBe("Plates only · Machine, seat or bench not recorded");
    expect(setupSummaryOf(443, { pause_seconds: "1", hover_distance_cm: "3" })).toBe("Pause 1 s · Hover 3 cm");
    // A note is shown, never asked for as missing.
    expect(setupSummaryOf(433, undefined)).toBeNull();
    expect(setupSummaryOf(433, { setup_note: "towel on forehead" })).toBe("Setup note: towel on forehead");
    expect(setupSummaryOf(1, { bar_type: "Standard" })).toBeNull();
  });
});

describe("which sets compare (T03, T04, T14, T18)", () => {
  it("never puts a 30 cm and a 45 cm block pull, or a floor pull and a block pull, in one protocol", () => {
    const at30 = protocolKeyOf(422, { start_height_cm: "30", bar_type: "Standard" });
    const at45 = protocolKeyOf(422, { start_height_cm: "45", bar_type: "Standard" });
    expect(at30).not.toBe(at45);
    expect(protocolKeyOf(422, { start_height_cm: "45.0", bar_type: " standard " })).toBe(at45);
    expect(protocolKeyOf(421, { start_height_cm: "30", bar_type: "Standard" })).not.toBe(at30);
    // A height not recorded is unknown, and matches no recorded height.
    expect(protocolKeyOf(422, { bar_type: "Standard" })).not.toBe(at30);
  });

  it("changes the protocol with the machine, the seat or a Smith machine's declared basis, never with a note", () => {
    const base = protocolKeyOf(437, { machine_model: "Hammer Strength", seat_or_bench_setting: "4" });
    expect(protocolKeyOf(437, { machine_model: "Life Fitness", seat_or_bench_setting: "4" })).not.toBe(base);
    expect(protocolKeyOf(437, { machine_model: "Hammer Strength", seat_or_bench_setting: "5" })).not.toBe(base);
    expect(protocolKeyOf(440, { load_convention: "plates_only" })).not.toBe(protocolKeyOf(440, { load_convention: "total_known_bar" }));
    expect(protocolKeyOf(441, { setup_note: "board under the bar" })).toBe(protocolKeyOf(441, undefined));
    expect(protocolKeyOf(423, { bar_type: "Standard", rom_note: "to knee" })).toBe(protocolKeyOf(423, { bar_type: "Standard", rom_note: "mid shin" }));
  });

  it("keeps a Spoto press and a paused bench apart, the hover distance a setup value of the Spoto press only", () => {
    expect(protocolKeyOf(443, { pause_seconds: "1", hover_distance_cm: "3" })).not.toBe(protocolKeyOf(442, { pause_seconds: "1" }));
    expect(protocolKeyOf(443, { pause_seconds: "1", hover_distance_cm: "3" })).not.toBe(protocolKeyOf(443, { pause_seconds: "1", hover_distance_cm: "5" }));
    expect(protocolKeyOf(442, { pause_seconds: "1", hover_distance_cm: "3" })).toBe(protocolKeyOf(442, { pause_seconds: "1" }));
  });

  it("separates a left and a right set of a row done to a side, and an unknown direction from both", () => {
    const left = protocolKeyOf(432, { attachment_setup: "harness" }, { headDirection: "left" });
    const right = protocolKeyOf(432, { attachment_setup: "harness" }, { headDirection: "right" });
    expect(left).not.toBe(right);
    expect(protocolKeyOf(432, { attachment_setup: "harness" }, {})).not.toBe(left);
    expect(protocolKeyOf(426, undefined, { headDirection: "left" })).toBe(protocolKeyOf(426, undefined, {}));
    expect(protocolKeyOf(1, undefined)).toBeNull();
  });
});

describe("prescriptions", () => {
  it("leave the target to the athlete on every neck row, and only there", () => {
    for (let id = 425; id <= 436; id += 1) expect(setsOwnTarget(id), `catalog ${id}`).toBe(true);
    for (const id of [421, 422, 423, 424, 437, 443, 1, 143]) expect(setsOwnTarget(id), `catalog ${id}`).toBe(false);
  });
});
