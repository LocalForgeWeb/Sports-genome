import { describe, expect, it } from "vitest";
import { exercises, type Exercise } from "@/lib/exerciseCatalog";
import { buildWorkoutExport } from "./workoutExport";
import { buildWorkoutPdf } from "./workoutPdf";
import { measureText, toWinAnsi, wrapText } from "./pdf/pdfWriter";

const latin1 = (bytes: Uint8Array) => Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
function plan(list: Exercise[], over: Partial<{ dayName: string; notes: string; prescription: string }> = {}) {
  return buildWorkoutExport({
    workout: list, week: 1, dayOrdinal: "Day 02", dayName: over.dayName ?? "Pull", sport: "Wrestling", goal: "Athleticism",
    prescriptionFor: () => over.prescription ?? "4 × 3–6", settingsFor: () => ({ rpe: "RPE 7", rest: "90 sec", notes: over.notes ?? "" }),
    muscleLabel: (key) => key, now: new Date("2026-10-02T15:00:00Z"),
  });
}
/** Each page's text, decoded from its content stream. */
function pages(pdf: Uint8Array): string[] {
  const text = latin1(pdf);
  return [...text.matchAll(/stream\n([\s\S]*?)\nendstream/g)].map((match) => [...match[1].matchAll(/\(((?:\\.|[^\\)])*)\) Tj/g)].map((tj) => tj[1].replace(/\\([()\\])/g, "$1").replace(/\\(\d{3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)))).join(" | "));
}
const pull = exercises.filter((exercise) => /pull|row/i.test(exercise.movement)).slice(0, 8);
const twenty = exercises.filter((exercise) => /pull|row|Elbow/i.test(exercise.movement)).slice(0, 20);

/**
 * Oct 2 brief §8–12: the shared PDF is a document drawn for itself, not the app
 * printed - light, only pages with exercises on them, no exercise split across
 * a page, and none of a browser's headers, URLs or timestamps.
 */
describe("the workout PDF", () => {
  it("is a well-formed PDF whose cross-reference offsets point at their objects", () => {
    const pdf = buildWorkoutPdf(plan(pull));
    const text = latin1(pdf);
    expect(text.startsWith("%PDF-1.4")).toBe(true);
    expect(text.trimEnd().endsWith("%%EOF")).toBe(true);
    const xref = text.slice(text.lastIndexOf("xref\n"));
    const offsets = [...xref.matchAll(/^(\d{10}) 00000 n $/gm)].map((match) => Number(match[1]));
    offsets.forEach((offset, index) => expect(text.slice(offset, offset + 12)).toMatch(new RegExp(`^${index + 1} 0 obj`)));
  });

  it("carries the workout's name as its title, and is made by Sports Genome rather than a browser", () => {
    const text = latin1(buildWorkoutPdf(plan(pull)));
    const hex = (value: string) => "FEFF" + Array.from(value, (ch) => ch.charCodeAt(0).toString(16).padStart(4, "0").toUpperCase()).join("");
    expect(text).toContain(`/Title <${hex("Sports Genome · Week 1 · Pull")}>`);
    expect(text).toContain(`/Creator <${hex("Sports Genome")}>`);
    expect(text).not.toMatch(/Chromium|Skia/);
  });

  it("uses pages only for content: one for a single exercise, two for eight, a few for twenty", () => {
    expect(pages(buildWorkoutPdf(plan(pull.slice(0, 1))))).toHaveLength(1);
    expect(pages(buildWorkoutPdf(plan(pull)))).toHaveLength(2);
    const long = pages(buildWorkoutPdf(plan(twenty)));
    expect(long.length).toBeGreaterThanOrEqual(3);
    expect(long.length).toBeLessThanOrEqual(4);
    // Every page holds at least one exercise: no empty or near-empty last page.
    for (const page of long) expect(page).toMatch(/\| \d{2} \|/);
  });

  it("keeps each exercise and all of its set lines on one page", () => {
    const list = pages(buildWorkoutPdf(plan(twenty)));
    twenty.forEach((exercise, index) => {
      const number = String(index + 1).padStart(2, "0");
      const page = list.find((text) => text.includes(`| ${number} |`))!;
      const after = page.slice(page.indexOf(`| ${number} |`));
      expect(after, `${exercise.name} keeps its sets`).toMatch(/Set 1[\s\S]*Set 4/);
    });
  });

  it("puts the exercises in the app's order, with the prescription beside each", () => {
    const joined = pages(buildWorkoutPdf(plan(pull))).join(" | ");
    let at = -1;
    for (const exercise of pull) {
      const next = joined.indexOf(exercise.name, at + 1);
      expect(next, exercise.name).toBeGreaterThan(at);
      at = next;
    }
    // "4 × 3–6" in the standard fonts' encoding: × is 0xD7, the en dash 0x96.
    expect(joined).toContain("4 \u00d7 3\u00966");
  });

  it("opens with what a thumbnail needs: brand, the day, sport, goal and count", () => {
    const first = pages(buildWorkoutPdf(plan(pull)))[0];
    expect(first.indexOf("SPORTS GENOME")).toBeLessThan(first.indexOf(pull[0].name));
    expect(first).toContain("TRAINING PLAN");
    expect(first).toContain("PULL");
    expect(first).toContain("WRESTLING · ATHLETICISM · 8 EXERCISES".replace(/·/g, "·"));
  });

  it("has its own footer and no browser artifacts", () => {
    const list = pages(buildWorkoutPdf(plan(pull)));
    list.forEach((page, index) => expect(page).toContain(`Page ${index + 1} of ${list.length}`));
    const all = list.join(" ");
    expect(all).not.toMatch(/https?:|vercel|localhost|workspace=/i);
    expect(all).not.toMatch(/\d{1,2}\/\d{1,2}\/\d{2},/); // a browser's "10/2/26, 9:02 PM"
  });

  it("wraps a long name inside its column instead of running under the prescription", () => {
    const name = "Rope Face Pull with External Rotation and a Two-Second Pause at Full Retraction";
    const lines = wrapText(name, "bold", 12.5, 380 - 74 - 14);
    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) expect(measureText(line, "bold", 12.5)).toBeLessThanOrEqual(380 - 74 - 14);
    const long = { ...pull[0], name } as Exercise;
    expect(pages(buildWorkoutPdf(plan([long])))[0]).toContain(lines[0]);
  });
});

describe("the PDF writer's text", () => {
  it("writes the app's typography in the standard fonts' encoding", () => {
    expect(toWinAnsi("4 × 3–6 · RPE 7 — Coach’s note…")).toEqual([0x34, 0x20, 0xd7, 0x20, 0x33, 0x96, 0x36, 0x20, 0xb7, 0x20, 0x52, 0x50, 0x45, 0x20, 0x37, 0x20, 0x97, 0x20, 0x43, 0x6f, 0x61, 0x63, 0x68, 0x92, 0x73, 0x20, 0x6e, 0x6f, 0x74, 0x65, 0x85]);
    expect(toWinAnsi("−5")).toEqual([0x2d, 0x35]);
  });

  it("measures with Helvetica's own widths", () => {
    expect(measureText("A", "regular", 10)).toBeCloseTo(6.67, 2);
    expect(measureText("W", "bold", 10)).toBeCloseTo(9.44, 2);
    expect(measureText("ab", "regular", 10, 1)).toBeCloseTo(12.12, 2);
  });
});
