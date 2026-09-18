import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");

describe("Home sport state safeguards", () => {
  it("starts with no sport selected and resets persisted athlete sport context explicitly", () => {
    expect(source).toContain('const [sportId, setSportId] = useState("")');
    expect(source).toContain('setOnboardingComplete(false);');
    expect(source).toContain('window.localStorage.removeItem(athleteProfileKey)');
  });

  it("connects workspace sport controls to the shared switch handler and recalculates the active movement collection", () => {
    expect(source).toContain('sportMovementProfiles.filter((profile) => profile.sportId === activeSportId)');
    expect(source).toContain('onSport={chooseSport}');
    expect(source).toContain('onClick={() => chooseSport(profile.id)}');
  });

  it("resets weekly sport-specific drafts without rendering an obstructive sport-change toast", () => {
    expect(source).toContain('setPlanWeeks({});');
    expect(source).toContain('setActiveWeek(1);');
	    expect(source).toContain('setCatalogQuery("");');
	    expect(source).toContain('setCatalogFilters(defaultCatalogFilters);');
    expect(source).not.toContain('toast("Sport context updated"');
    expect(source).not.toContain("Your current workout was retained for review");
  });

  it("routes automatic Smart Draft through the active split-filtered loadout instead of the sport-wide session list", () => {
	    expect(source).toContain("applyDraftToActiveDay(draftedLoadout);");
	    expect(source).not.toContain("setCustomWorkout(buildSmartDraftWorkout(sessionRecommendations))");
	    expect(source).toContain("${activeSplitDay.toLowerCase()} session is ready for review.");
  });

  it("replaces only the open day when a draft is loaded, rather than clearing prescriptions and effort for the whole week", () => {
	    expect(source).toContain("const applyDraftToActiveDay = (stack: Exercise[]) => {");
	    expect(source).toContain("setPrescriptions(Object.fromEntries(stack.map((exercise, index) => [exercise.id, prescriptionFor(index, goal)])));");
  });

  it("carries the departing day into the week and reads the arriving one back whole, through one path", () => {
	    expect(source).toContain("const departing = draftDayKeyRef.current;");
	    expect(source).toContain("if (departing === activeSlot.key) return;");
	    expect(source).toContain("const carried = commitDay(dayStore, departing, activeDraft());");
	    expect(source).toContain("adoptActiveDay(activeSlot, loadDay(carried, activeSlot.key));");
	    // Choosing a day only moves the marker; nothing else may swap a draft.
	    expect(source).toContain("const openTrainingDay = (index: number) => {");
	    expect(source).toContain("const activeImportedContext = dayStore.context[activeDayKey] || [];");
  });
});
