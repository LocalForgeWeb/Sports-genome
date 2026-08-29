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
    expect(source).toContain("They do not create a body-mass ratio, universal estimate, tier, or population comparison.");
    expect(source).toContain("No regional strength tier is shown until supporting evidence is available.");
    expect(source).toContain('onSelect={(region) => { setSelectedRegion(region || null); if (!region) setSelectedObservationId(""); }}');
    expect(source).toContain("Regional record");
    expect(source).toContain("Planning focus");
    expect(source).toContain('active: !activePriorityIds.has(selectedRegion.id)');
    expect(source).toContain("Range or test standard");
    expect(source).toContain("Variation / technique");
    expect(source).toContain("Assistance / support");
    expect(source).toContain("These fields preserve test context for your own future comparison.");
    expect(source).toContain("They do not create a body-mass ratio, universal estimate, tier, or population comparison.");
    expect(source).toContain("Review training");
    expect(source).toContain("Does not change this day automatically.");
    expect(source).toContain("onClick={() => { emitInteractionFeedback(); onOpenTraining(); }}");
  });

  it("uses an interactive body map without inventing an unqualified percentile or rank", () => {
    expect(source).toContain('import { StrengthGenomeBodyMap }');
    expect(source).toContain("<StrengthGenomeBodyMap");
    expect(source).not.toContain('className="group min-h-28 bg-white p-4 text-left');
    expect(bodyMapSource).toContain('aria-label="Interactive strength context body map"');
    expect(bodyMapSource).toContain("Test regions");
    expect(bodyMapSource).toContain("Select a region to inspect");
    expect(bodyMapSource).toContain("Use the map to choose a test area. It is not a muscle ranking or percentile.");
    expect(bodyMapSource).not.toContain("percentile score");
    expect(source).toContain("resolveStrengthObservationRoute(observation.exerciseName)?.regionIds.includes(region.id)");
    expect(source).toContain("Regional record");
    expect(source).toContain("A percentile, universal rank, and regional force score are not shown");
    expect(source).toContain("latestRecord.bodyMassKgAtTest");
    expect(source).toContain("Recorded measurement");
    expect(source).toContain("Source-sample rank range");
    expect(source).toContain("Reference unavailable for this test.");
    expect(source).toContain("Source-sample percentile band");
    expect(source).toContain("About this rating");
    expect(source).toContain("matching validated reference");
    expect(source).toContain("emitInteractionFeedback");
    expect(source).toContain("setObservationBodyMass");
    expect(source).toContain("Use saved weight");
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
    expect(source).toContain('recorded test coverage; not a strength rank');
    expect(source).toContain('setSelectedRegion(null); setSelectedObservationId("");');
    expect(source).toContain('className="strength-reference-state-visual"');
    expect(source).toContain('/manus-storage/strength-qualified-reference-state_3ccc4f09.png');
    expect(source).toContain('/manus-storage/strength-reference-unavailable-state_f08bbf9c.png');
    expect(source).toContain("Reference status");
    expect(source).toContain("Qualified comparison ready");
    expect(source).toContain("match a reviewed source");
    expect(source).toContain("Reference unavailable");
    expect(source).toContain("sourceMatchedObservationCount");
    expect(source).toContain("getPiperReferenceForObservation(observation)?.status === \"matched\"");
    expect(source).toContain("getVanDenHoek2024PowerliftingReference");
    expect(source).toContain("Competitive powerlifting reference");
    expect(source).toContain("Source-sample percentile band");
    expect(source).toContain("drug-tested, unequipped competition");
    expect(source).not.toContain("Top 1%");
  });

  it("keeps the default profile status concise while leaving source-match limits available on demand", () => {
    expect(source).toContain('className="strength-profile-reference-summary"');
    expect(source).toContain('className="strength-profile-reference-details"');
    expect(source).toContain("Reference unavailable");
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

  it("shows selected-region record history, qualified percentile routes, and missing-reference state", () => {
    expect(source).toContain('className="strength-region-history"');
    expect(source).toContain("Recorded history ({records.length})");
    expect(source).toContain('aria-pressed={String(record.id) === String(latestRecord.id)}');
    expect(source).toContain('getPiperReferenceForObservation');
    expect(source).toContain('getPowerliftingReferenceForObservation');
    expect(source).not.toContain('getStrengthReferencePresentation');
    expect(source).toContain("Reference unavailable for this test.");
    expect(source).toContain("Source-sample rank range");
    expect(source).toContain("Source-sample percentile band");
    expect(source).toContain("No recorded test for this region yet.");
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
