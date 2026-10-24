// @vitest-environment jsdom
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import React, { createElement, useState } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SpecializationPanel, preloadStackModel } from "./SpecializationPanel";
import { exercises } from "@/lib/exerciseCatalog";
import { defaultEquipmentProfile } from "@/lib/equipmentProfile";
import { loadRegionData } from "@/lib/specialization/loadRegion";
import { loadRegionExtras } from "@/lib/specialization/regionExtras";
import { clearSummaryCache } from "@/lib/specialization/useSpecializationSummary";
import { currentExposureRule } from "@shared/specialization/rules";
import { forearmContent } from "@shared/specialization/regions/forearm";
import { forearmMappingsV1, forearmMappingVersionV1 } from "@shared/specialization/__fixtures__/forearmMappingsV1";
import { sourceById } from "@shared/specialization/sources";
import { upperArmContent } from "@shared/specialization/regions/upper_arm";
import { defaultSpecializationState, type SpecializationViewState } from "@/lib/specialization/viewState";
import { NOW, goals, sessions, slots, store, storeWithOneArm } from "./__fixtures__/forearmWeek";

/**
 * The forearm page says what main says (4dac1ae: both arms counted as one, owner 20 Oct 2026; the
 * athlete's current reality), apart from the changes wave 0 states (docs/specialization-atlas/
 * 09-page.md, "What wave 0 changes on the forearm page"; 10-multi-region.md §9.1, §11 decision 11(a)
 * and the appendix "Both sides as one"), and the biceps' and brachialis' words wave A moves to the forearm's
 * membership of them (10-multi-region.md §1.3). The week of __fixtures__/forearmWeek.ts is rendered, both
 * arms as one, for three windows and the plan week; the page is read with every disclosure open and
 * every finding shown, and so are five muscles' sheets with their ledgers open (one target muscle
 * with two-handed, one-arm and no-arm rows; one with holds and strapped sets; the adjacent anconeus
 * and the external biceps, each with a target saved earlier for one arm, now read for both; the
 * external brachialis, with none), the sets behind every total (the region's, the window line's pair,
 * each exercise's, each day's, those for the forearms only, those not counted here), and the wrist
 * flexion movement; once more for the plan week with a one-arm exercise in the plan. The 3D model,
 * which a phone shows by default, is read too, for this week and the plan week: the page with the
 * model's row of muscles and its Overview, then the model's panel for each muscle of the row, its
 * disclosures open. jsdom has no WebGL, so the stage is a stand-in that shows what the page hands
 * it, as the stage does over a drawn model: its accessible name and the selected muscle's name and
 * layer (the drawing states never render it).
 *
 * Each of those readings is a list of lines in the order the page shows them, kept apart per state
 * and per sheet, and compared in order with the same reading taken on main at 4dac1ae
 * (__fixtures__/pageText.4dac1ae.json) once the stated changes are applied to it: a line rewritten
 * (`stated`), runs of lines gone (`gone`) or new (`added`), each in the sheets it names. Anything
 * else that is new, gone or moved, in any sheet, fails, and every stated change must still be one
 * the page makes. The drawing's own labels (data) and the live region's announcements are not read.
 * (Wave 0 first held these lines against 3986178 per arm; the reconciliation of 21 Oct 2026
 * re-baselined them on main for both arms, and its stated changes are those wave 0 still makes.)
 *
 * To read the reference again: copy this file and __fixtures__/forearmWeek.ts into a tree at
 * 4dac1ae, leave out the region loader (that tree has none) and the rule import (the stated changes
 * are not read there), and run it with READ_PAGE_TEXT=<path>.
 */

/**
 * F3 (11-forearm-research-and-stack.md §1.7): the comparison with the reference reads the forearm as
 * wave A left it, under forearm_mappings_v1 (`forearmRegionDataV1`, the frozen rows); what v2 changes
 * is read apart, the tree's page against that one, in the last test. The loader serves the version asked.
 */
const forearmVersion = vi.hoisted(() => ({ current: "v1" as "v1" | "v2" }));
vi.mock("@/lib/specialization/loadRegion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/specialization/loadRegion")>();
  const { forearmRegionDataV1 } = await import("@/lib/specialization/__fixtures__/forearmV1");
  const asV1 = (id: string) => id === "forearm" && forearmVersion.current === "v1";
  return {
    ...actual,
    loadedRegionData: (id: Parameters<typeof actual.loadedRegionData>[0]) => (asV1(id) ? forearmRegionDataV1 : actual.loadedRegionData(id)),
    loadRegionData: (id: Parameters<typeof actual.loadRegionData>[0]) => (asV1(id) ? Promise.resolve(forearmRegionDataV1) : actual.loadRegionData(id)),
  };
});

vi.mock("./anatomy3d/AnatomyModelStage", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./anatomy3d/AnatomyModelStage")>()),
  AnatomyModelStage: ({ label, selected }: { label: string; selected: { name: string; layer: string } | null }) =>
    createElement("div", { className: "sg-anatomy3d-stage", role: "img", "aria-label": label },
      selected && createElement("div", { className: "sg-anatomy3d-selected" }, createElement("small", null, "Selected structure"), createElement("b", null, selected.name), createElement("small", null, selected.layer))),
}));

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
if (!window.matchMedia) (window as unknown as Record<string, unknown>).matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
Element.prototype.scrollIntoView = () => {};
window.scrollBy = (() => {}) as typeof window.scrollBy;
window.scrollTo = (() => {}) as typeof window.scrollTo;

function Harness({ initial, planned }: { initial: SpecializationViewState; planned: typeof store }) {
  const [state, setState] = useState(initial);
  return createElement(SpecializationPanel, {
    state, onStateChange: setState,
    plan: { ready: true, slots, weeks: { 1: planned }, choice: null, activeWeek: 1 },
    catalog: exercises, equipmentProfile: defaultEquipmentProfile, accountId: null, goal: "Muscle growth", weightUnit: "lb",
    onApplyPlanChange: () => ({ ok: true, undo: () => {} }), onInspectExercise: () => {}, onOpenSession: () => {},
    backLabel: null, onBack: null,
  });
}

const BLOCK = new Set(["P", "LI", "H1", "H2", "H3", "H4", "DT", "DD", "SUMMARY", "BUTTON", "LABEL", "LEGEND", "OPTION", "DIV", "SECTION", "HEADER", "UL", "OL", "DL", "DETAILS", "FORM", "FIELDSET", "SELECT", "TABLE", "TR", "TD", "TH", "SMALL", "STRONG"]);
/** Each run of text between block boundaries, and each accessible name, under `root`, in order; not the drawing, not the live region. */
function linesOf(root: Element): string[] {
  const out: string[] = [];
  let run = "";
  const flush = () => { const text = run.replace(/\s+/g, " ").trim(); if (text) out.push(text); run = ""; };
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) { run += node.textContent ?? ""; return; }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const element = node as Element;
    // The drawing itself: the SVG, or a rendered plate with its canvas and its row of muscles (the
    // same muscles' buttons the SVG holds inside it, by the same names).
    if (element.tagName.toLowerCase() === "svg" || element.classList.contains("spz-plate-group") || element.hasAttribute("aria-live")) return;
    const block = BLOCK.has(element.tagName);
    if (block) flush();
    const name = element.getAttribute("aria-label");
    if (name) out.push(`[name] ${name.replace(/\s+/g, " ").trim()}`);
    element.childNodes.forEach(walk);
    if (block) flush();
  };
  walk(root);
  flush();
  return out;
}

/** One state's reading: each part's lines, in the page's order. "page" is the page itself; every other key is a sheet. */
type Reading = Record<string, string[]>;

const click = async (element: Element) => { await act(async () => { fireEvent.click(element); }); await act(async () => {}); };
/**
 * Every disclosure, open; but the stack card (F1, 11-forearm-research-and-stack.md §3.2), whose
 * content is the stack designer's (StackDesigner.render.test.ts reads it), and tendon exposure (F2,
 * §4.3), whose content TendonExposure.render.test.ts reads. Their closed summaries are read here as
 * stated changes.
 */
const openAll = async (root: ParentNode) => {
  for (const details of Array.from(root.querySelectorAll("details:not(.spz-stack):not(#spz-tendon)"))) await act(async () => { (details as HTMLDetailsElement).open = true; fireEvent(details, new Event("toggle")); });
  await act(async () => {});
};
const dialog = () => screen.getByRole("dialog");
async function readSheet(key: string, open: Element | null | undefined, into: Reading) {
  if (!open) return;
  await click(open);
  await openAll(dialog());
  into[key] = linesOf(dialog());
  await click(within(dialog()).getAllByRole("button").find((button) => /^Close/.test(button.getAttribute("aria-label") ?? button.textContent ?? ""))!);
}
const pageButton = (name: RegExp) => Array.from(document.querySelectorAll<HTMLElement>(".spz-page button")).find((button) => name.test(button.textContent ?? "") || name.test(button.getAttribute("aria-label") ?? ""));

async function readPage(state: SpecializationViewState, planned: typeof store): Promise<Reading> {
  render(createElement(Harness, { initial: state, planned }));
  await act(async () => {});
  const seen: Reading = {};
  const more = pageButton(/^Show \d+ more$/);
  if (more) await click(more);
  await openAll(document.querySelector(".spz-page")!);
  seen.page = linesOf(document.querySelector(".spz-page")!);
  // The sets behind each total, before a muscle is selected: the region's, the pair's, each exercise's and each day's.
  await readSheet("sets: the region's", pageButton(/^See these sets\s*$/), seen);
  await readSheet("sets: logged and planned", document.querySelector(".spz-window-open"), seen);
  const all = (selector: string) => Array.from(document.querySelectorAll(selector));
  const exerciseLinks = ".spz-exercise-list .spz-link-box[aria-label^='The sets of']";
  for (let index = 0; index < all(exerciseLinks).length; index += 1) await readSheet(`sets: exercise ${index + 1}`, all(exerciseLinks)[index], seen);
  for (let index = 0; index < all("button.spz-day").length; index += 1) await readSheet(`sets: day ${index + 1}`, all("button.spz-day")[index], seen);
  for (const name of ["Brachioradialis", "Flexor digitorum superficialis", "Anconeus", "Biceps brachii", "Brachialis"]) await readSheet(`muscle: ${name}`, pageButton(new RegExp(`^${name}, `)), seen);
  await readSheet("sets: for the forearms only", pageButton(/^See the \d+ sets? for the forearms only/), seen);
  await readSheet("sets: not counted here", pageButton(/^See (this set|these sets) and why/), seen);
  await readSheet("movement: Wrist flexion", pageButton(/^Open Wrist flexion$/), seen);
  cleanup();
  return seen;
}

/**
 * The page with the 3D model (its row of muscles, the stage and the Overview panel), every
 * finding shown and every disclosure open; then each muscle of the row chosen in turn, and the stage and the model's panel
 * read for it, the panel's disclosures open. The sheets are the drawing states' own.
 */
async function readModel(state: SpecializationViewState, planned: typeof store): Promise<Reading> {
  render(createElement(Harness, { initial: state, planned }));
  await act(async () => {});
  const seen: Reading = {};
  const more = pageButton(/^Show \d+ more$/);
  if (more) await click(more);
  await openAll(document.querySelector(".spz-page")!);
  seen.page = linesOf(document.querySelector(".spz-page")!);
  const chips = () => Array.from(document.querySelectorAll<HTMLElement>(".sg-anatomy3d-rail-chip"));
  for (let index = 1; index < chips().length; index += 1) {
    const chip = chips()[index];
    await click(chip);
    const model = document.querySelector(".sg-anatomy3d")!;
    await openAll(model);
    seen[`model: ${chip.lastChild?.textContent}`] = Array.from(model.children).filter((part) => !part.classList.contains("sg-anatomy3d-rail")).flatMap((part) => linesOf(part));
  }
  cleanup();
  return seen;
}

/** The targets of the fixture but those saved earlier on the biceps and the anconeus: each muscle that is not a target here then has none. */
const onTargetMusclesOnly = goals.filter((goal) => goal.nodeId !== "upper_arm.biceps" && goal.nodeId !== "forearm.anconeus");

/**
 * Both arms as one: this week, the rolling 7 days, a custom window and the plan week; this week with
 * no target saved earlier on a muscle that is not a target here; the plan week with a one-arm
 * exercise in the plan; and this week and the plan week with the 3D model.
 */
const states: [string, Partial<SpecializationViewState>, unknown[], typeof store][] = [
  ["week", {}, goals, store],
  ["7d", { window: "7d" }, goals, store],
  ["custom", { window: "custom", from: "2026-10-05", to: "2026-10-16" }, goals, store],
  ["planned", { mode: "planned" }, goals, store],
  ["week, targets on target muscles only", {}, onTargetMusclesOnly, store],
  ["planned, a one-arm exercise in the plan", { mode: "planned" }, goals, storeWithOneArm],
  ["week, 3D model", { figure: "model" }, goals, store],
  ["planned, 3D model", { mode: "planned", figure: "model" }, goals, store],
];

// The region's rep profiles too (F1, §5.2): a muscle sheet shows the starting ranges once they arrive, so they are here before any sheet opens.
beforeAll(async () => { await loadRegionData("forearm"); await loadRegionExtras("forearm"); await preloadStackModel(); });
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(NOW));
  window.localStorage.clear();
  window.localStorage.setItem("sports-genome-device-workout-history-v1", JSON.stringify(sessions));
  clearSummaryCache();
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

async function readAll(): Promise<Record<string, Reading>> {
  const read: Record<string, Reading> = {};
  for (const [id, over, saved, planned] of states) {
    window.localStorage.setItem("sports-genome-specialization-goals-v1", JSON.stringify(saved));
    clearSummaryCache();
    read[id] = await (over.figure === "model" ? readModel : readPage)({ ...defaultSpecializationState("forearm"), ...over }, planned);
  }
  return read;
}

const out = process.env.READ_PAGE_TEXT;
describe.runIf(out)("reading the page's text", () => {
  it("writes it", async () => {
    writeFileSync(out!, `${JSON.stringify(await readAll(), null, 1)}\n`);
  }, 300000);
});

// ---------------------------------------------------------------- what wave 0 and wave A change, each where it is stated

/** A sheet of the reading, by its key ("page" for the page itself). */
type Where = RegExp;
const ANYWHERE: Where = /./;
const MUSCLES_NOT_TARGETS: Where = /^muscle: (Anconeus|Biceps brachii|Brachialis)$/;

/** A line of the reference rewritten wherever it is: `was` → `now`. */
const stated: { why: string; was: RegExp; now: string }[] = [
  { why: "appendix 'Both sides as one'; §9.1: both arms are one count, so a set is not said to count once per arm (main's lede kept it)", was: /^Each set counts once per muscle and once per arm, from /, now: "Each set counts once per muscle, from " },
  { why: "09 item 4; §4.3: the strapped finding's words come from the published rule and the calculator's note", was: /^(\d+ strapped sets?) earned no grip credit$/, now: "$1: grip not counted" },
  { why: "09 item 4; §4.3: the strapped finding's detail is the published rule's straps clause", was: /^Straps hold the bar for the hand, so the finger flexors are not credited for those sets\. The rest of each set still counts\.$/, now: `${currentExposureRule.specification.straps} The rest of each set still counts.` },
  // The anconeus's target of 3 is the fixture's only one of 3; the biceps' target of 5 is counted, and its row keeps "0 of your 5".
  { why: "09 item 5; §2.2: a target on a muscle nothing can be counted for (the anconeus: no mapping) says so, never a zero", was: /^3 per calendar week · 0 of your 3$/, now: "3 per calendar week · cannot be counted yet" },
  { why: "09 item 8; appendix 'Both sides as one', §4.4: the Progress subtitle says no side", was: /^Circumference and grip, by arm$/, now: "Circumference and grip" },
  { why: "09 item 9; appendix 'Both sides as one': the 3D model's panel counts a set once per muscle, not per arm", was: /^One bout per set, per muscle, per arm$/, now: "One bout per set, per muscle" },
  { why: "09 item 10; appendix 'Both sides as one': a movement's ledger row says no side for a planned one-arm set", was: /^(By [^.]+\.) Each side assumed\.$/, now: "$1" },
  { why: "09 item 11; appendix 'Both sides as one': the 3D model's credits name no side and claim no mirror image (the model is never mirrored)", was: /^It is one model of a right arm; the left arm is shown as its mirror image, not a separate model\. /, now: "It is one model of one arm, never mirrored. " },
  // Wave A (10-multi-region.md §1.3): the biceps and brachialis keep neutral anatomy text in their home, the upper arm.
  { why: "wave A, §1.3: the biceps' location is its home's neutral text", was: /^Front of the upper arm, crossing the elbow to the radius\.$/, now: "Front of the upper arm, at the surface: its two heads start on the shoulder blade, and it crosses the elbow to the radius." },
  { why: "wave A, §1.3: what the biceps does is its home's text, which adds its weak help at the shoulder", was: /^Bends your elbow and turns your palm up; with the elbow bent it is the strongest palm-up muscle\.$/, now: "Bends your elbow and turns your palm up; with the elbow bent it is the strongest palm-up muscle. It also crosses the shoulder, where references describe only weak help raising the arm forward." },
  { why: "wave A, §1.3: the biceps' shape note is neutral anatomy; its forearm words are the forearm's caveat", was: /^Shapes the front of the upper arm\. It is an upper-arm muscle and does not add forearm size\.$/, now: "May contribute most of the front contour of the upper arm above the elbow crease, since it is the surface muscle there. Visible shape also depends on neighbouring muscles, body fat and individual anatomy." },
  { why: "wave A, §1.3: the brachialis' location is its home's neutral text", was: /^Front of the lower upper arm, under the biceps, crossing the elbow to the ulna\.$/, now: "Front of the lower half of the upper arm, under the biceps, crossing the elbow to the ulna." },
  { why: "wave A, §1.3: the brachialis' shape note is neutral anatomy, its outer edge the one the sources confirm; its forearm words are the forearm's caveat", was: /^Mostly covered by the biceps; may show at the sides of the lower upper arm\. It is not a forearm muscle\.$/, now: "Mostly covered by the biceps, so most of it has little or no contour of its own. Its outer edge and lower end lie close to the surface and may add to the outer side of the lower upper arm, beside the biceps. Visible shape also depends on neighbouring muscles, body fat and individual anatomy." },
  // Wave A (10-multi-region.md §4.3): rule v2, published with the upper arm; every page reads it.
  { why: "wave A, §4.3: How this is counted names rule v2", was: /^specialization_exposure_v1 · forearm_mappings_v1$/, now: "specialization_exposure_v2 · forearm_mappings_v1" },
  { why: "wave A, §4.3: Why this counts names rule v2", was: /counting rule \(specialization_exposure_v1\)/, now: "counting rule (specialization_exposure_v2)" },
  { why: "wave A, §4.3: rule v2's straps clause, in words for every region (shown only where a mapping here needs a bare hand)", was: /^Grip credit that needs a bare hand is not given to a set logged with straps\. /, now: "A grip mapping that needs a bare hand does not credit a set logged with straps. " },
  { why: "wave A, §4.3: rule v2's region-only clause names the region's catalog keys and tag scope and its own muscles", was: /^Work tagged with the region in the exercise catalog but with no reviewed atlas mapping counts only at region level, /, now: "Work tagged in the exercise catalog with one of the region's catalog keys, within the region's tag scope, but with no reviewed atlas mapping for any of the region's own muscles, counts only at region level, " },
  { why: "wave A, §4.3: rule v2 says incidental work in words for every region", was: /^Incidental grip is never counted as dynamic work\.$/, now: "Incidental work (holding or steadying while something else is trained) is never counted as dynamic work." },
  { why: "wave A, §2.2: the biceps' target saved on this page is the upper arm's (re-homed on read), so the forearm holds one fewer", was: /^5 active$/, now: "4 active" },
  // F1, lane S4 (11-forearm-research-and-stack.md §3.3): the one count of direct moving sets, in the window line's words.
  { why: "F1 S4; 11 §3.3: in Planned mode the window line says the plan week's direct moving sets where it said the logged bouts (the logged week stays in the sets it opens); with the one-arm exercise in the plan, 12", was: /^Plan Week 1, as written: 15 bouts planned · \d+ logged this week$/, now: "Plan Week 1, as written: 15 bouts planned · 12 direct moving sets" },
  { why: "F1 S4; 11 §3.3: in Planned mode the window line says the plan week's direct moving sets where it said the logged bouts (the logged week stays in the sets it opens)", was: /^Plan Week 1, as written: (\d+) bouts planned · \d+ logged this week$/, now: "Plan Week 1, as written: $1 bouts planned · 9 direct moving sets" },
  { why: "F1 S4; 11 §3.3: in Planned mode the 3D model's Overview says the plan week's direct moving sets, in the window line's words", was: /^(\d+) distinct bouts are planned for the forearms in Plan Week 1\. (Tap a muscle on the model, or in the row above it, for its numbers\.)$/, now: "$1 distinct bouts are planned for the forearms in Plan Week 1; 9 are direct moving sets. $2" },
];
/** Runs of the reference's lines, one after another, gone from the sheets `in` names. */
const gone: { why: string; in: Where; lines: RegExp[] }[] = [
  // Wave A: the heading is the region picker, now that two regions have a page (§6.1).
  { why: "wave A, §6.1: with two production regions the heading is the region picker, named by the region's label", in: /^page$/, lines: [/^Forearm specialization$/] },
  // Wave A: the upper arm's version credits the biceps and brachialis (§4.2; decision 11(b)), so their rows change (pageNumbers.render.test.ts holds the numbers).
  { why: "wave A, §4.2: the brachialis' and biceps' rows as the forearm's own rows credited them", in: /^page$/, lines: [/^\[name\] Brachialis, Deep\. (3|4) direct dynamic bouts\. Open details\.$/, /^Brachialis$/, /^Brachialis$/, /^Deep(3|4) direct$/, /^\[name\] Biceps brachii, Surface\. (3|4) other dynamic\. Open details\.$/, /^Biceps brachii$/, /^Biceps$/, /^(3|4) other$/] },
  { why: "09 item 5; §2.2: a target saved earlier on a muscle that is not a target here is no target behind, with exercises for it", in: /^page$/, lines: [/^(Biceps brachii|Anconeus): 0 of your \d+$/, /^Direct dynamic bouts, .+\. The target is yours, not a prescription\.$/, /^See exercises for it$/] },
  { why: "09 item 2; §2.2, §9.1: a target saved earlier on a muscle that is not a target here can be ended or removed, not changed", in: ANYWHERE, lines: [/^\[name\] Change the target of .+ for (Anconeus|Biceps brachii|Brachialis)$/, /^Change$/] },
  { why: "09 item 2: no target is offered on a muscle that is not a target here", in: MUSCLES_NOT_TARGETS, lines: [/^Set a target$/] },
  { why: "09 item 2: nor is it said to be untargeted, as if it could take one", in: MUSCLES_NOT_TARGETS, lines: [/^Not targeted\. Nothing here is behind: a muscle without a target has no gap to show\.$/] },
  { why: "09 item 10; appendix 'Both sides as one': a ledger row says no side for a planned one-arm set", in: ANYWHERE, lines: [/^Each side assumed$/] },
  { why: "09 'The owner's plates' (23 Oct): the Drawing is the owner's rendered plates, a surface and a deep plate per view (FDS is on the palm's surface plate), so the layer choice has no Middle", in: /^page$/, lines: [/^\[name\] Layer$/, /^Surface$/, /^Middle$/, /^Deep$/] },
  // Wave A: the biceps' target saved on this page is read as the upper arm's (§2.2), so the Targets overview does not hold it (after wave 0's rules, which take its Change out first).
  { why: "wave A, §2.2: the biceps' target saved here earlier is the upper arm's now: gone from the Targets overview", in: /^page$/, lines: [/^Biceps brachii$/, /^Muscle$/, /^\[name\] Open Biceps brachii$/, /^Open$/, /^Direct dynamic bouts$/, /^5 per calendar week · 0 of your 5$/, /^\[name\] End the target of 5 direct dynamic bouts per calendar week for Biceps brachii$/, /^End$/, /^\[name\] Remove the target of 5 direct dynamic bouts per calendar week for Biceps brachii$/, /^Remove$/] },
];
/** Runs of lines new in the sheets `in` names (each run may stand anywhere in them). */
const added: { why: string; in: Where; lines: RegExp[] }[] = [
  // First: its middle line is the note the next rule takes out anywhere else.
  { why: "09 item 5; §2.2: a target saved earlier on a muscle that is not a target here is said last, as one to end or remove", in: /^page$/, lines: [/^(Biceps brachii|Anconeus): a target saved earlier$/, /^Targets are for this region's target muscles\. You can end or remove this one\.$/, /^End or remove it$/] },
  { why: "09 item 2; §2.2: said beside such a target", in: ANYWHERE, lines: [/^Targets are for this region's target muscles\. You can end or remove this one\.$/] },
  { why: "09 item 2; §2.2: said on such a muscle with no target", in: /^muscle: Anconeus$/, lines: [/^Targets are for this region's target muscles, and this one is not one of them\.$/] },
  // (Wave 0's "Targets for this muscle are set on the upper arm page, which is not available yet." on the biceps' and brachialis'
  // sheets is superseded by wave A: the upper-arms page exists, and the sheets' credited part is checked apart, `creditedSheets`.)
  // Wave A: the region picker (§6.1), with the upper arm's targets (the biceps' one, re-homed) and the forearm's.
  { why: "wave A, §6.1: the heading's region picker, the grid closed under it: Upper arms (the biceps' target re-homed there) and Forearms", in: /^page$/, lines: [/^Forearms$/, /^Choose a body region$/, /^\[name\] Body region$/, /^Upper arms$/, /^1 target$/, /^Forearms$/, /^\d+ targets$/] },
  { why: "wave A, §6.1: the heading's region picker, with no target on the upper arm", in: /^page$/, lines: [/^Forearms$/, /^Choose a body region$/, /^\[name\] Body region$/, /^Upper arms$/, /^Forearms$/, /^\d+ targets$/] },
  { why: "wave A, §4.2: the brachialis' and biceps' rows credited by the upper arm, which adds the rows logged and planned (43, 46; 45)", in: /^page$/, lines: [/^\[name\] Brachialis, Deep\. (4 direct dynamic bouts · 4|3 direct dynamic bouts · 3) other dynamic\. Open details\.$/, /^Brachialis$/, /^Brachialis$/, /^Deep(4 direct · 4|3 direct · 3) other$/, /^\[name\] Biceps brachii, Surface\. (8|6) other dynamic\. Open details\.$/, /^Biceps brachii$/, /^Biceps$/, /^(8|6) other$/] },
  { why: "wave A, §4.3: rule v2's clause on another region's muscles, said where this page credits one (the biceps and brachialis)", in: /^page$/, lines: [/^A muscle of another region is credited as its home region's current mapping version credits it; where that region has no published version, the listing region's own reviewed rows credit it\. Crediting it never moves a set into or out of this region's own totals\.$/] },
  { why: "09 item 3; §8: the plain statement about automated review, under How this is counted", in: /^page$/, lines: [/^“Reviewed” means an automated agent checked each sentence/] },
  { why: "09 item 6; §8: How this is counted names the sets of exercises the forearm leaves unmapped, and opens them", in: /^page$/, lines: [/^\d+ sets? of exercises left unmapped here (is|are) not counted, each for the reason given with it\.$/, /^See (this set|these sets) and why$/] },
  // Wave A (§1.3): the node's own caveats, then the forearm's caveats on its membership; the last of those is the caveat the node said before.
  {
    why: "wave A, §1.3: the biceps' own caveats, then the forearm's words on it, moved from its shape note",
    in: /^muscle: Biceps brachii$/,
    lines: [
      /^Its two heads are counted as one muscle; anatomy references describe their elbow and forearm actions together\.$/,
      /^Its help raising the arm forward is weak, and studies disagree on whether its long head works in shoulder movement at all\.$/,
      /^Some people have an extra head; it usually causes no symptoms\.$/,
      /^It is an upper-arm muscle and does not add forearm size\.$/,
    ],
  },
  {
    why: "wave A, §1.3: the brachialis' own caveat, then the forearm's words on it, moved from its shape note",
    in: /^muscle: Brachialis$/,
    lines: [/^It bends the elbow whatever the grip, so curls with the palm down or the thumb up load it too\.$/, /^It is not a forearm muscle\.$/],
  },
  { why: "09 'The owner's plates' (23 Oct): the plates' layers, surface and deep", in: /^page$/, lines: [/^\[name\] Layer$/, /^Surface$/, /^Deep$/] },
  { why: "09 'The owner's plates' (23 Oct): the credit under the plates: the source model, its licences, and that the images are adapted renders", in: /^page$/, lines: [/^Images rendered from the Open3Dmodel upper-limb model, built on BodyParts3D \(.+CC BY-SA 2\.1 Japan\) and Z-Anatomy \(CC BY-SA 4\.0\)\. They are adapted renders: .+ shared under CC BY-SA 4\.0\. .+$/] },
  // F1, lane S4 (11-forearm-research-and-stack.md §3.2): the stack card under the map and its ways in. The finding's run first, then the card's, so the strip's one line is what is left.
  { why: "F1 S4; 11 §3.2: Planned mode's Coverage to review leads with the movements the plan week gives no direct moving work, and opens the stack card", in: /^page$/, lines: [/^9 movements have no direct moving work in Plan Week 1$/, /^Pronation, supination, radial deviation and 6 more\.$/, /^Design a stack$/] },
  { why: "F1 S4; 11 §3.2: the stack card, closed, right under the map: its two-line summary", in: /^page$/, lines: [/^Design a stack$/, /^Plan Week 1 · (9|12) direct moving sets now$/] },
  { why: "F1 S4; 11 §3.2: the drawing's strip with nothing selected opens the stack card, beside See these sets", in: /^page$/, lines: [/^Design a stack$/] },
  { why: "F1 S4; 11 §5.2, §5.3: a muscle sheet says once, right above its suggestions, that the ranges are the app's starting ranges, not measured for the muscle", in: /^muscle: /, lines: [/^Starting ranges the app uses for this kind of movement\. They are practical defaults, not measured for this muscle\. .+ Change them any time\.$/] },
  { why: "F1 S4; 11 §5.3: where a hold range appears, the hold sentence, once", in: /^muscle: /, lines: [/^Holds of \d+–\d+ s are the app's starting range, not a tested one\. .+the plan counts the number written\.$/] },
  { why: "F1 S4; 11 §5.2: each suggested exercise shows its starting range", in: /^muscle: /, lines: [/^Starting range: \d+–\d+ (reps|s holds)$/] },
  // F1, not wave 0 (11-forearm-research-and-stack.md §8.2, lane S2; 10-multi-region.md decision 6).
  { why: "F1 S2: 139 Wrist Curl and 140 Reverse Wrist Curl are filed as Barbell, as their variants and photos define them, so the suggestions' equipment list names Barbell", in: /^movement: Wrist flexion$/, lines: [/^Barbell$/, /^Suggested$/] },
  // F2, lane T3 (11-forearm-research-and-stack.md §4.3): tendon exposure's closed card and its ways in.
  { why: "F2 T3; 11 §4.3: tendon exposure, closed, after Exercises in this window: its two-line summary", in: /^page$/, lines: [/^Tendon exposure$/, /^Sets by attachment area(, Plan Week 1, as written)?$/] },
  { why: "F2 T3; 11 §4.3: a muscle's sheet says where it attaches, by tendon area, and opens tendon exposure", in: /^muscle: /, lines: [/^Attaches at: [a-z].+\)\.$/, /^See tendon exposure$/] },
  { why: "F2 T3; 11 §4.3: the 3D model's panel says where the chosen muscle attaches, and opens tendon exposure", in: /^model: /, lines: [/^Attaches at: [a-z].+\)\.$/, /^See tendon exposure$/] },
];
/**
 * Wave A (10-multi-region.md §4.2; §11 decision 11(b)): on the forearm page the biceps and brachialis
 * are credited by the upper arm's published version, so everything their sheets say from the window
 * line to "Sources and method" is that version's: the counts, the sets and why each counts (the
 * upper arm's rows, rationales and sources), the target section (set on the upper-arms page) and the
 * suggestions. That span is checked apart, here, and the rest of each sheet, its anatomy and its
 * sources, against the reference as everywhere else.
 */
const creditedSheets = /^muscle: (Biceps brachii|Brachialis)$/;
const CREDITED_SPAN = "[credited by the upper arm's version: checked apart]";
function creditedSpan(lines: string[]): [before: string[], span: string[], after: string[]] {
  const start = lines.findIndex((line) => /^(Completed|Planned) · /.test(line));
  const end = lines.indexOf("Sources and method");
  expect(start, "the window line").toBeGreaterThan(-1);
  expect(end, "Sources and method").toBeGreaterThan(start);
  return [lines.slice(0, start), lines.slice(start, end), lines.slice(end)];
}
function expectUpperArmCredit(key: string, span: string[]): void {
  const nodeId = key.endsWith("Biceps brachii") ? "upper_arm.biceps" : "upper_arm.brachialis";
  const upperArmWords = new Set(upperArmContent.mappings.filter((mapping) => mapping.nodeId === nodeId).map((mapping) => mapping.rationale));
  const forearmWords = new Set(forearmContent.mappings.filter((mapping) => mapping.nodeId === nodeId).map((mapping) => mapping.rationale));
  expect(span, key).toContain("Targets for this muscle are set on the upper-arms page.");
  expect(span, key).toContain("Open the upper-arms page");
  expect(span.filter((line) => forearmWords.has(line)), `${key}: none of the forearm's own rows' words`).toEqual([]);
  expect(span.some((line) => upperArmWords.has(line)), `${key}: the upper arm's rows' words`).toBe(true);
  expect(span.filter((line) => /specialization_exposure_v1/.test(line)), key).toEqual([]);
  expect(span.filter((line) => /^Targets are for this region's target muscles/.test(line)), `${key}: no target held here`).toEqual([]);
}

/** Sheets new with wave 0. */
const addedSheets: { why: string; key: RegExp }[] = [
  { why: "09 item 6; §8: the sets not counted here, each with its reason", key: /^sets: not counted here$/ },
];

/** `lines` without each run of `runs` that stands in it, the runs found in order; `used` collects the rules that matched. */
function withoutRuns(lines: string[], rules: { why: string; lines: RegExp[] }[], used: Set<string>): string[] {
  const result = [...lines];
  for (const rule of rules) {
    for (let start = 0; start + rule.lines.length <= result.length;) {
      if (rule.lines.every((pattern, offset) => pattern.test(result[start + offset]))) {
        result.splice(start, rule.lines.length);
        used.add(rule.why);
      } else start += 1;
    }
  }
  return result;
}

describe.skipIf(out)("the forearm page says what main says (4dac1ae, both arms as one), apart from wave 0's and wave A's stated changes", () => {
  it("reads the same lines, in the same order, in every state and every sheet (the forearm under forearm_mappings_v1)", async () => {
    forearmVersion.current = "v1";
    const reference = JSON.parse(readFileSync(join(process.cwd(), "client/src/components/specialization/__fixtures__/pageText.4dac1ae.json"), "utf8")) as Record<string, Reading>;
    const read = await readAll();
    expect(Object.keys(read)).toEqual(Object.keys(reference));
    const used = new Set<string>();
    const rewrite = (line: string) => stated.reduce((text, rule) => (rule.was.test(text) ? (used.add(rule.why), text.replace(rule.was, rule.now)) : text), line);
    const differences: Record<string, { expected: string[]; read: string[] } | string> = {};
    let total = 0;
    for (const state of Object.keys(reference)) {
      const sheetsNow = Object.keys(read[state]).filter((key) => !addedSheets.some((rule) => rule.key.test(key) && used.add(rule.why)));
      if (JSON.stringify(sheetsNow) !== JSON.stringify(Object.keys(reference[state]))) differences[`${state}: sheets`] = `${Object.keys(reference[state]).join(", ")} → ${sheetsNow.join(", ")}`;
      for (const key of Object.keys(reference[state])) {
        let referenceLines = reference[state][key];
        let readLines = read[state][key] ?? [];
        if (creditedSheets.test(key)) {
          const [before, , after] = creditedSpan(referenceLines);
          const [nowBefore, span, nowAfter] = creditedSpan(readLines);
          expectUpperArmCredit(`${state}: ${key}`, span);
          referenceLines = [...before, CREDITED_SPAN, ...after];
          readLines = [...nowBefore, CREDITED_SPAN, ...nowAfter];
        }
        const expected = withoutRuns(referenceLines, gone.filter((rule) => rule.in.test(key)), used).map(rewrite);
        const shown = withoutRuns(readLines, added.filter((rule) => rule.in.test(key)), used);
        total += shown.length;
        if (JSON.stringify(shown) !== JSON.stringify(expected)) differences[`${state}: ${key}`] = { expected, read: shown };
      }
    }
    expect(total).toBeGreaterThan(2000);
    expect(differences).toEqual({});
    // Every stated change is still one the page makes.
    expect([...stated, ...gone, ...added, ...addedSheets].map((rule) => rule.why).filter((why) => !used.has(why))).toEqual([]);
  }, 300000);
});

// ---------------------------------------------------------------- what F3 changes: forearm_mappings_v2 against v1, on the same tree

/**
 * Release F3 (11-forearm-research-and-stack.md §1.7, "What athletes see change"): the page as the tree
 * shows it, under forearm_mappings_v2, against the same page under forearm_mappings_v1, state by state
 * and sheet by sheet. On the page itself every changed line is stated below: How this is counted names
 * v2 and says its method notes; the wrist flexors and the thumb flexor gain incidental grip or steadying
 * (and in the year's window the wrist extensors more of it); the thumb flexor's pending-review finding
 * goes; Planned mode's finding counts one more movement (420 reaches the index and little finger
 * extensors). The sheets whose ledgers and suggestions v2's rows change (F3_SHEETS) are checked apart:
 * every line they lose and gain is of a stated kind, and what each must now say is said. Every other
 * sheet is unchanged.
 */
/** A row's value line ("8 direct", "DeepNo work") is rewritten only in that muscle's row: right after its short name. */
const F3_STATED: { why: string; in: RegExp; was: string; now: string; after?: RegExp }[] = [
  { why: "F3: How this is counted names forearm_mappings_v2", in: /./, was: "specialization_exposure_v2 · forearm_mappings_v1", now: "specialization_exposure_v2 · forearm_mappings_v2" },
  { why: "F3: How this is counted says v2's method notes", in: /./, was: forearmMappingVersionV1.methodNotes, now: forearmContent.mappingVersion!.methodNotes },
  ...(["radialis", "ulnaris"] as const).flatMap((muscle) => [
    { why: `F3: the wrist flexors steady the wrist in the hangs and carries (flexor carpi ${muscle})`, in: /^(week|7d)|^week, /, was: `[name] Flexor carpi ${muscle}, Surface. 8 direct dynamic bouts. Open details.`, now: `[name] Flexor carpi ${muscle}, Surface. 8 direct dynamic bouts · 4 incidental grip or steadying. Open details.` },
    { why: `F3: the wrist flexors steady the wrist in the hangs and carries (flexor carpi ${muscle}, the year)`, in: /^custom$/, was: `[name] Flexor carpi ${muscle}, Surface. 11 direct dynamic bouts. Open details.`, now: `[name] Flexor carpi ${muscle}, Surface. 11 direct dynamic bouts · 6 incidental grip or steadying. Open details.` },
  ]),
  { why: "F3: the wrist flexors' rows say their grip", in: /^(week|7d)|^week, /, was: "8 direct", now: "8 direct · 4 grip", after: /^FC[RU]$/ },
  { why: "F3: the wrist flexors' rows say their grip (the year)", in: /^custom$/, was: "11 direct", now: "11 direct · 6 grip", after: /^FC[RU]$/ },
  ...(["radialis longus", "radialis brevis", "ulnaris"] as const).map((muscle) => ({ why: `F3: the wrist extensors steady the wrist in the hangs too (the year; extensor carpi ${muscle})`, in: /^custom$/, was: `[name] Extensor carpi ${muscle}, Surface. 8 direct dynamic bouts · 5 incidental grip or steadying. Open details.`, now: `[name] Extensor carpi ${muscle}, Surface. 8 direct dynamic bouts · 7 incidental grip or steadying. Open details.` })),
  { why: "F3: the wrist extensors' rows (the year)", in: /^custom$/, was: "8 direct · 5 grip", now: "8 direct · 7 grip", after: /^(ECRL|ECRB|ECU)$/ },
  { why: "F3: the thumb flexor's carries are incidental grip, no longer pending review", in: /^(week|7d)|^week, /, was: "[name] Flexor pollicis longus, Deep. No work for it in this window. 4 sets matched a mapping still under review and are not counted. Open details.", now: "[name] Flexor pollicis longus, Deep. 2 incidental grip or steadying. Open details." },
  { why: "F3: the thumb flexor's carries are incidental grip, no longer pending review (the year)", in: /^custom$/, was: "[name] Flexor pollicis longus, Deep. No work for it in this window. 4 sets matched a mapping still under review and are not counted. Open details.", now: "[name] Flexor pollicis longus, Deep. 4 incidental grip or steadying. Open details." },
  { why: "F3: the thumb flexor's row", in: /^(week|7d)|^week, /, was: "DeepNo work", now: "Deep2 grip", after: /^FPL$/ },
  { why: "F3: the thumb flexor's row (the year)", in: /^custom$/, was: "DeepNo work", now: "Deep4 grip", after: /^FPL$/ },
  { why: "F3: Planned mode's finding counts the index and little finger extension, which 420 trains directly", in: /^planned/, was: "9 movements have no direct moving work in Plan Week 1", now: "10 movements have no direct moving work in Plan Week 1" },
  { why: "F3: Planned mode's finding, its list", in: /^planned/, was: "Pronation, supination, radial deviation and 6 more.", now: "Pronation, supination, radial deviation and 7 more." },
];
const F3_GONE: { why: string; in: RegExp; lines: string[] }[] = [
  { why: "F3: no thumb-flexor row is pending review, so its finding goes", in: /^(week|7d|custom)|^week, /, lines: ["Mapping under review for Flexor pollicis longus", "4 sets in this window matched a mapping that is not reviewed yet. They are shown in the ledger and not counted.", "Inspect coverage"] },
];

/** The sheets v2's rows change, each with the lines it may lose and gain and what it must now say. */
const F3_SHEETS: { key: RegExp; mayGo: RegExp[]; mayCome: RegExp[]; must: (state: string) => string[] }[] = [
  {
    key: /^muscle: Flexor digitorum superficialis$/,
    mayGo: [/^Also loads /, /^(Plate Pinch|Towel Dead Hang)$/, /^\[name\] Do not suggest (Plate Pinch|Towel Dead Hang)$/],
    mayCome: [/^Also loads /, /^Barbell Hold$/, /^\[name\] Do not suggest Barbell Hold$/],
    must: () => ["Barbell Hold"],
  },
  {
    key: /^movement: Wrist flexion$/,
    mayGo: [/^0$/, /^Also loads /, /^Helps /, /^Wrist Roller(, Extension Wind)?$/, /^\[name\] Do not suggest Wrist Roller(, Extension Wind)?$/],
    mayCome: [
      /^\d+$/, /^\d+ bouts$/, /^\d+ s$/, /^About (Farmer Hold|Suitcase Carry|Dead Hang|Farmer’s Walk)$/, /^(Farmer Hold|Suitcase Carry|Dead Hang|Farmer’s Walk|Behind-the-Back Wrist Curl|Cable Wrist Curl|Cable)$/,
      /^By FCR, FCU\.( Straps not recorded\.)?$/, /^Incidental grip \/ stabilization$/, /^Measured by EMG$/, /^Anatomy reference$/, /^Open this workout$/, /^(Flexor carpi (radialis|ulnaris)|Palmaris longus) · Wrist flexion$/,
      /^Steadies the joint, holds still\. Counted as incidental grip \/ stabilization\.$/, /^Direct target, moves the joint\. Counted as direct dynamic\.$/, /^Direct wrist flexion; \d+ of your 8 direct dynamic bouts in Plan Week 1\.$/,
      /^Suggested$/, /^Week 1 · Day \d+ · .+$/, /^Which kind of work a mapping counts as is set by the counting rule \(specialization_exposure_v2\)/, /^Why this counts$/, /^Also loads /, /^\[name\] Do not suggest (Behind-the-Back Wrist Curl|Cable Wrist Curl)$/,
    ],
    must: (state) => (state.startsWith("planned") ? ["Cable Wrist Curl", "Behind-the-Back Wrist Curl"] : ["By FCR, FCU.", "Incidental grip / stabilization"]),
  },
  {
    key: /^model: (Flexor carpi (radialis|ulnaris)|Flexor pollicis longus)$/,
    mayGo: [/^0$/, /^Muscle details$/, /^None logged in this window\.$/, /^Nothing logged for it in this window\. \d+ sets matched a mapping still under review and are shown, not counted\.$/],
    mayCome: [/^\d+$/, /^\d+ incidental grip \/ stabilization$/, /^(Farmer Hold|Suitcase Carry)$/, /^View$/, /^View contributions$/, /^\[name\] View (Farmer Hold|Suitcase Carry)$/],
    must: () => ["2 incidental grip / stabilization"],
  },
];

/** Every line v2's rows can put on a sheet in their own words: their rationales, and their sources as a ledger cites them. */
const v2RowWords = new Set(forearmContent.mappings.flatMap((mapping) => [
  mapping.rationale,
  ...mapping.sources.flatMap((ref) => [`${sourceById.get(ref.sourceId)?.title} · ${ref.locator}`, `Limit: ${ref.limitation}`]),
]));
const v1RowWords = new Set(forearmMappingsV1.map((mapping) => mapping.rationale));

describe.skipIf(out)("F3: the forearm page under forearm_mappings_v2 against v1, on the same tree", () => {
  it("changes only the stated lines on the page, and only the stated kinds of line in the sheets v2's rows change", async () => {
    forearmVersion.current = "v1";
    const before = await readAll();
    forearmVersion.current = "v2";
    const after = await readAll();
    const used = new Set<string>();
    const differences: Record<string, unknown> = {};
    for (const state of Object.keys(before)) {
      expect(Object.keys(after[state]), state).toEqual(Object.keys(before[state]));
      for (const key of Object.keys(before[state])) {
        const was = before[state][key];
        const now = after[state][key];
        const sheet = F3_SHEETS.find((entry) => entry.key.test(key));
        if (sheet) {
          const count = (lines: string[]) => lines.reduce((map, line) => map.set(line, (map.get(line) ?? 0) + 1), new Map<string, number>());
          const [a, b] = [count(was), count(now)];
          const gone = [...a].filter(([line, n]) => (b.get(line) ?? 0) < n).map(([line]) => line);
          const fresh = [...b].filter(([line, n]) => (a.get(line) ?? 0) < n).map(([line]) => line);
          const badGone = gone.filter((line) => !v1RowWords.has(line) && !v2RowWords.has(line) && !sheet.mayGo.some((pattern) => pattern.test(line)));
          const badFresh = fresh.filter((line) => !v2RowWords.has(line) && !sheet.mayCome.some((pattern) => pattern.test(line)));
          if (badGone.length || badFresh.length) differences[`${state}: ${key}`] = { badGone, badFresh };
          if (gone.length || fresh.length) for (const line of sheet.must(state)) expect(now, `${state}: ${key} says "${line}"`).toContain(line);
          continue;
        }
        const rewritten = was.map((line, index) => {
          const rule = F3_STATED.find((entry) => entry.in.test(state) && entry.was === line && (!entry.after || entry.after.test(was[index - 1] ?? "")));
          if (!rule) return line;
          used.add(rule.why);
          return rule.now;
        });
        const expected = withoutRuns(rewritten, F3_GONE.filter((rule) => rule.in.test(state)).map((rule) => ({ why: rule.why, lines: rule.lines.map((line) => new RegExp(`^${line.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`)) })), used);
        if (JSON.stringify(now) !== JSON.stringify(expected)) differences[`${state}: ${key}`] = { expected: expected.filter((line) => !now.includes(line)), read: now.filter((line) => !expected.includes(line)) };
      }
    }
    expect(differences).toEqual({});
    // Every stated change is one the page makes.
    expect([...F3_STATED, ...F3_GONE].map((rule) => rule.why).filter((why) => !used.has(why))).toEqual([]);
    // The sheets v2 changes are changed somewhere: the thumb flexor's panel, the wrist flexion ledger, the finger flexors' suggestions.
    const changedSheets = new Set(Object.keys(before).flatMap((state) => Object.keys(before[state]).filter((key) => JSON.stringify(before[state][key]) !== JSON.stringify(after[state][key]))));
    for (const sheet of F3_SHEETS) expect(Array.from(changedSheets).some((key) => sheet.key.test(key)), String(sheet.key)).toBe(true);
  }, 600000);
});
