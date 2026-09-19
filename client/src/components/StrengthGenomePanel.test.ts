import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolveStrengthObservationRoute } from "../../../shared/strengthGenomeDefinitions";
import { selectStrengthRegionRecord } from "./StrengthGenomePanel";

const source = readFileSync(new URL("./StrengthGenomePanel.tsx", import.meta.url), "utf8");
const bodyMapSource = readFileSync(new URL("./StrengthGenomeBodyMap.tsx", import.meta.url), "utf8");

describe("Strength Genome panel", () => {
  it("captures dated performance context but withholds an uncalibrated tier", () => {
    expect(source).toContain('type="date"');
    expect(source).toContain("bodyMassKgAtTest");
    expect(source).toContain("new Date(`${observedDate}T12:00:00`)");
    expect(source).toContain("All optional. They just help you compare like with like later on.");
    expect(source).toContain("Log your first lift and your progress starts tracking from there.");
    expect(source).toContain('onSelect={(region) => { setSelectedRegion(region || null); if (!region) setSelectedObservationId(""); }}');
    expect(source).toContain("Your record");
    expect(source).toContain("Want to prioritize this?");
    expect(source).toContain('active: !activePriorityIds.has(selectedRegion.id)');
    expect(source).toContain("Range of motion");
    expect(source).toContain("Variation");
    expect(source).toContain("Assistance used");
    expect(source).toContain("All optional. They just help you compare like with like later on.");
    expect(source).toContain("Review training");
    expect(source).toContain("It will not change today&apos;s workout on its own.");
    expect(source).toContain("onClick={() => { emitInteractionFeedback(); onOpenTraining(); }}");
  });

  it("uses an interactive body map without inventing an unqualified percentile or rank", () => {
    expect(source).toContain('import { StrengthGenomeBodyMap }');
    expect(source).toContain("<StrengthGenomeBodyMap");
    expect(source).not.toContain('className="group min-h-28 bg-white p-4 text-left');
    expect(bodyMapSource).toContain('aria-label="Interactive strength context body map"');
    expect(bodyMapSource).toContain("Your body");
    expect(bodyMapSource).toContain("Tap a muscle group to see");
    expect(bodyMapSource).toContain("Highlighting shows where you have lifts on record, not how strong you are.");
    expect(bodyMapSource).not.toContain("percentile score");
    // Routing now goes through the catalog-aware resolver, so a lift the reviewed
    // alias list never named — a Hack Squat, say — still reaches the region it
    // trains instead of falling off the map.
    expect(source).toContain("strengthRegionIdsForExerciseName(observation.exerciseName).includes(region.id)");
    expect(source).toContain("Your record");
    // Replaced by the rank itself; the population still travels with the number.
    expect(source).toContain("{powerliftingRank.population}");
    expect(source).toContain("latestRecord.bodyMassKgAtTest");
    expect(source).toContain("Source-sample rank range");
    expect(source).toContain("No ranking for this lift yet");
    expect(source).toContain("Compared to that competition group");
    expect(source).toContain("Where this ranks");
    expect(source).toContain("emitInteractionFeedback");
    expect(source).toContain("setObservationBodyMass");
    // The body-mass field offers the weight in effect on the lift's own day, from
    // the dated log — not today's profile value, which was the old prefill and
    // needed a warning telling the athlete to check it themselves.
    expect(source).toContain("bodyWeightKgAt(bodyWeightHistory, latestRecord.observedAt)");
    expect(source).toContain("Filled in from what you weighed that week.");
    expect(source).toContain("Save this body weight");
    expect(source).toContain("weightUnitLabel(weightUnit)");
    expect(source).toContain("displayWeightToKilograms(parsedLoad, weightUnit)");
    expect(source).toContain("displayWeightToKilograms(parsedBodyMass, weightUnit)");
    expect(source).toContain("formatDisplayWeight(latestRecord.loadKg, weightUnit)");
    expect(source).toContain("Test body mass saved. Your recorded ratio is ready.");
    expect(source).toContain("Could not save test body mass. Check your connection and try again.");
    expect(source).toContain("setBodyMassSaveError");
    expect(source).toContain("Body mass was not saved. Your entry is still here");
    expect(source).toContain('role="status"');
    expect(source).toContain('role="alert"');
    expect(source).toContain('aria-busy={!directAccess && setObservationBodyMass.isPending}');
  });

  it("leads with recorded test coverage and exposes a comparative result only after an exact source match", () => {
    expect(source).toContain('className="strength-profile-status"');
    expect(source).toContain('className="strength-profile-reference-summary"');
    expect(source).toContain('className="strength-profile-reference-details"');
    expect(source).toContain('className={`strength-profile-coverage-ring');
    // The coverage figure states its own boundary on screen rather than only to a
    // screen reader, and the ring beside it is decoration for a number the
    // definition list already carries.
    expect(source).toContain("Covered means you have lifts recorded there. It is not a rank or a score.");
    expect(source).toContain('setSelectedRegion(null); setSelectedObservationId("");');
    expect(source).not.toContain('/manus-storage/');
    expect(source).toContain("Comparison ready on {sourceMatchedObservationCount} lift");
    expect(source).toContain("line up with a study");
    expect(source).toContain("sourceMatchedObservationCount > 0 &&");
    expect(source).toContain("sourceMatchedObservationCount");
    expect(source).toContain("getPiperReferenceForObservation(observation)?.status === \"matched\"");
    expect(source).toContain("getVanDenHoek2024PowerliftingReference");
    expect(source).toContain("Competitive powerlifting reference");
    expect(source).toContain("Compared to that competition group");
    expect(source).toContain("drug-tested, unequipped competition");
    expect(source).toContain("trpc.researchEvidence.supabaseInventory.useQuery");
    expect(source).toContain("Research on file:");
    expect(source).toContain("does not by itself create a rank for you");
    expect(source).not.toContain("Top 1%");
  });

  it("keeps the default profile status concise while leaving source-match limits available on demand", () => {
    expect(source).toContain('className="strength-profile-reference-summary"');
    expect(source).toContain('className="strength-profile-reference-details"');
    expect(source).toContain("How comparison works");
  });

  it("requires catalog exercise selection and routes common curl names to biceps context", () => {
    expect(source).toContain("Search and choose a catalog exercise");
    expect(source).toContain("Search catalog, then select");
    expect(source).toContain("setSelectedExercise(exercise)");
    expect(source).toContain("getStrengthCatalogSelectionContext(selectedExercise)");
    expect(source).toContain("<StrengthCatalogSelectionPreview context={selectedExerciseContext} />");
    expect(source).toContain("Boolean(selectedExercise)");
    expect(resolveStrengthObservationRoute("Straight Bar Curl")?.regionIds).toContain("biceps");
    expect(resolveStrengthObservationRoute("biceps curl")?.domainIds).toContain("elbow_flexion");
    expect(resolveStrengthObservationRoute("Machine Preacher Curl")?.regionIds).toContain("biceps");
    expect(resolveStrengthObservationRoute("Machine Preacher Curl")?.domainIds).toContain("elbow_flexion");
  });

  it("keeps each selected regional record distinct when choosing body-mass context", () => {
    const records = [
      { id: "first", exerciseName: "Preacher Curl" },
      { id: "second", exerciseName: "EZ-Bar Preacher Curl" },
    ];
    expect(selectStrengthRegionRecord(records, "second")).toEqual(records[1]);
    expect(selectStrengthRegionRecord(records, "missing")).toEqual(records[0]);
    expect(source).toContain('aria-label="Choose recorded test"');
    expect(source).toContain("setSelectedRecordId(event.target.value)");
  });

  it("falls back to the newest dated test rather than whichever record happens to sit first", () => {
    const chronological = [
      { id: "old", exerciseName: "Preacher Curl", observedAt: "2026-06-01T12:00:00.000Z" },
      { id: "new", exerciseName: "Preacher Curl", observedAt: "2026-08-28T12:00:00.000Z" },
    ];
    expect(selectStrengthRegionRecord(chronological, "")?.id).toBe("new");
    expect(selectStrengthRegionRecord([...chronological].reverse(), "")?.id).toBe("new");
    expect(selectStrengthRegionRecord(chronological, "old")?.id).toBe("old");
    expect(selectStrengthRegionRecord([], "")).toBeUndefined();
    // The picker lists tests newest-first so the listed order matches what opens by default.
    expect(source).toContain("new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime()");
  });

  it("switches between a region's recorded tests via the test picker instead of a separate raw history list, and shows qualified percentile routes plus the missing-reference state", () => {
    expect(source).not.toContain('className="strength-region-history"');
    expect(source).toContain('aria-label="Choose recorded test"');
    expect(source).toContain('getPiperReferenceForObservation');
    expect(source).toContain('getPowerliftingReferenceForObservation');
    expect(source).not.toContain('getStrengthReferencePresentation');
    expect(source).toContain("No ranking for this lift yet");
    expect(source).toContain("Source-sample rank range");
    expect(source).toContain("Compared to that competition group");
    expect(source).toContain("Nothing logged for this muscle group yet.");
    expect(source).not.toContain("regional percentile");
  });

  it("moves a newly selected region into view with reduced-motion-safe behavior and focuses its heading", () => {
    expect(source).toContain("const regionDetailRef = useRef<HTMLDivElement | null>(null)");
    expect(source).toContain('window.matchMedia?.("(prefers-reduced-motion: reduce)").matches');
    expect(source).toContain('const stickyOffset = window.matchMedia?.("(max-width: 640px)").matches ? 172 : 28');
    expect(source).toContain('window.scrollTo({ top: targetTop, behavior: reduceMotion ? "auto" : "smooth" })');
    expect(source).toContain('data-strength-region-heading');
    expect(source).toContain('focus({ preventScroll: true })');
  });
});
