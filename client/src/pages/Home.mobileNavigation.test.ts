import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { primaryDestinationForWorkspace, shouldRenderMetric, workspaceFromLocation } from "./Home";

const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");
const tabsComponent = readFileSync(new URL("../components/WorkspaceTabs.tsx", import.meta.url), "utf8");
const workoutTrackerSource = readFileSync(new URL("../components/WorkoutExecutionPanel.tsx", import.meta.url), "utf8");
const deviceTrackerSource = readFileSync(new URL("../components/DeviceWorkoutTracker.tsx", import.meta.url), "utf8");
const stackReviewSource = readFileSync(new URL("../components/WorkoutHealthPanel.tsx", import.meta.url), "utf8");
const aboutMeSource = readFileSync(new URL("../components/AthleteAboutMePanel.tsx", import.meta.url), "utf8");
const anatomySource = readFileSync(new URL("../components/AnatomyMap.tsx", import.meta.url), "utf8");
const athleteQuizSource = readFileSync(new URL("../components/AthleteBaselineQuiz.tsx", import.meta.url), "utf8");
const athleteQuizStyles = readFileSync(new URL("../athlete-baseline-quiz.css", import.meta.url), "utf8");
const mobileStyles = readFileSync(new URL("../mobile-navigation.css", import.meta.url), "utf8");
const trainingDayStyles = readFileSync(new URL("../workout-planner.css", import.meta.url), "utf8");

describe("workspace side navigation", () => {
  it("resolves only supported workspace values and keeps an invalid URL on the command center", () => {
    expect(workspaceFromLocation("catalog")).toBe("catalog");
    expect(workspaceFromLocation("body")).toBe("body");
    expect(workspaceFromLocation("strength")).toBe("strength");
    expect(workspaceFromLocation("progress")).toBe("progress");
    expect(workspaceFromLocation("tracker")).toBe("tracker");
    expect(workspaceFromLocation("not-a-workspace")).toBe("command");
    expect(workspaceFromLocation(null)).toBe("command");
    expect(primaryDestinationForWorkspace("day-plan")).toBe("train");
    expect(primaryDestinationForWorkspace("recommended")).toBe("train");
    expect(primaryDestinationForWorkspace("catalog")).toBe("body");
    // Strength Genome is the athlete's own record, so it lives with Progress rather
    // than in the reference library.
    expect(primaryDestinationForWorkspace("strength")).toBe("progress");
    expect(primaryDestinationForWorkspace("profile")).toBe("secondary");
  });

  it("uses bottom-only primary navigation and browser history-aware contextual navigation", () => {
    expect(source).toContain('aria-label="Primary mobile navigation"');
    expect(source).toContain('const active = activePrimaryDestination === item.id;');
    expect(source).toContain('const dockTouchNavigationRef = useRef');
    expect(source).toContain('const navigateDockDestination = (next: Workspace, event: React.PointerEvent<HTMLButtonElement> | React.MouseEvent<HTMLButtonElement>) =>');
    expect(source).toContain('onPointerUp={(event) => navigateDockDestination(item.defaultWorkspace!, event)}');
    expect(source).toContain('onClick={(event) => navigateDockDestination(item.defaultWorkspace!, event)}');
    expect(source).toContain('aria-current={active ? "page" : undefined}');
    expect(source).toContain('window.history.pushState({ workspace: next }, "", url)');
    expect(source).toContain('window.addEventListener("popstate", restoreWorkspace)');
    expect(source).not.toContain('className="apex-rail');
    expect(source).not.toContain('className="rail-scrim"');
    // The header's "Design day" shortcut went with the header. The destination keeps
    // three routes: the Train tab in the bottom nav, and the two panels that hand off
    // to it — so nothing became unreachable.
    expect(source).toContain('onOpenTraining={() => navigateWorkspace("day-plan")}');
    expect(source).toContain('{ id: "train", label: "Train", icon: Layers3, defaultWorkspace: "day-plan" }');
    expect(source).toContain('onOpenAtlas={() => navigateWorkspace("movement")}');
    expect(source).toContain('navigateWorkspace("catalog")');
    expect(source).toContain('navigateWorkspace("recommended")');
  });

  it("keeps the email and passkey entry implementation available behind a reversible direct-workspace access switch", () => {
    expect(source).toContain("const directWorkspaceAccess = true;");
    expect(source).toContain('if (!directWorkspaceAccess && !isAuthenticated) return <EmailAuthScreen');
    expect(source).toContain('if (!directWorkspaceAccess && loading) return <div className="account-entry-loading">');
  });

  it("keeps the sidebar out of the active app shell", () => {
    const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
    expect(source).not.toContain('setRailOpen');
    expect(source).toContain('<div className="mobile-workspace-dock" aria-label="Primary workspace navigation">');
    expect(css).toContain('@media (min-width: 1024px) {\n  .apex-content { padding-bottom: 6.25rem; }');
  });

  it("colours the shell by destination and keeps a non-neon active state", () => {
    const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
    expect(source).toContain('shell-${activePrimaryDestination}');
    expect(source).toContain('destination-${activePrimaryDestination}');
    expect(css).toContain('.apex-content.destination-train');
    expect(css).toContain('.apex-content.destination-body');
    expect(css).toContain('.apex-content.destination-progress');
    expect(css).toContain('.apex-content.destination-secondary');
    expect(source).toContain('workspace === "profile" && <section className="more-workspace"');
    expect(source).not.toContain('gym-optimizer-logo_32341cfa.png');
    expect(source).not.toContain('GYM<br />OPTIMIZER');
    expect(css).toContain('background: linear-gradient(135deg, #1d5fae, #174785) !important;');
    expect(css).toContain('box-shadow: inset 4px 0 var(--sg-gold)');
    expect(css).toContain('.rail-brand::before, .rail-brand::after { content: none; display: none; }');
  });

  it("uses the supplied circular badge as a larger natural onboarding mark without changing title or progress controls", () => {
    const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
    expect(source).toContain('src={sportsGenomeAssets.circularBadge} alt="Sports Genome circular badge" className="pulse-brand-badge"');
    expect(source).toContain('<span className="font-display text-2xl font-bold uppercase tracking-wide text-white">Sports Genome</span>');
    expect(source).toContain('<div className="pulse-progress"><span>STEP {step + 1} / 4</span>');
    expect(css).toContain('.pulse-header .pulse-brand-badge { display: block !important; width: 54px; height: 54px;');
    expect(css).toContain('border-radius: 999px;');
    expect(css).toContain('.pulse-header > div:first-child::before, .pulse-header > div:first-child::after { content: none; display: none; }');
  });

  it("uses the supplied circular badge in the active eleven-step onboarding header at a natural readable scale", () => {
    // The mark is decorative here: the brand name sits beside it as real text,
    // so an alt would make a screen reader announce the name twice.
    expect(athleteQuizSource).toContain('src={sportsGenomeAssets.circularBadge} alt=""');
    expect(athleteQuizSource).toContain('<span>Sports Genome</span>');
    expect(athleteQuizStyles).toContain('.athlete-quiz-brand img { width: 38px; height: 38px; flex: 0 0 38px; border-radius: 999px;');
    // Progress is one segment per step now, so the header only carries the count.
    expect(athleteQuizSource).toContain('className="athlete-quiz-count"');
    expect(athleteQuizSource).toContain('className="athlete-quiz-segments"');
  });

  it("blocks the retired coach-set readiness placeholder from rendering", () => {
    expect(shouldRenderMetric("coach-set planning marker")).toBe(false);
    expect(shouldRenderMetric("mapped muscle groups")).toBe(true);
    expect(source).not.toContain('label="Session readiness"');
    expect(source).not.toContain('value="82"');
    expect(source).not.toContain('detail="coach-set planning marker"');
    expect(source).toContain('const activePlanStatus = customWorkout.length ? `${customWorkout.length} staged` : "Build a day";');
    expect(source).toContain('const activePlanStatusDetail = customWorkout.length ? `${completedExerciseCount} marked complete in the active workspace` : "No exercises are staged in the current Training Day";');
  });

  it("uses a four-item mobile bottom bar (the philosophy's Home/Body Lab/Train/Progress contract) and moves contextual workspace controls to the top", () => {
    const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
    expect(source).toContain('className="mobile-workspace-dock"');
    expect(source).toContain('aria-label="Primary workspace navigation"');
    expect(source).toContain('label: "Session", workspace: "tracker"');
    expect(source).toContain('label: "Review", workspace: "review"');
    expect(source).toContain('navigateWorkspace("tracker")');
    expect(source).toContain('<DeviceWorkoutTracker');
    expect(workoutTrackerSource).toContain('id="workout-tracker"');
    expect(deviceTrackerSource).toContain('id="workout-tracker"');
    expect(deviceTrackerSource).toContain('Finish workout');
    expect(stackReviewSource).toContain('id="stack-review"');
    expect(source).toContain('aria-label="Primary mobile navigation"');
    expect(source).toContain('label: "Train"');
    expect(source).toContain('label: "Body Lab"');
    expect(source).toContain('label: "Progress"');
    expect(source).toContain('aria-label="Profile and settings"');
    expect(source).toContain('type PrimaryDestination = "home" | "train" | "body" | "progress" | "secondary";');
    expect(source).toContain('contextualWorkspaces');
    expect(source).toContain("<WorkspaceTabs");
    expect(tabsComponent).toContain('className="workspace-top-switcher"');
    expect(source).not.toContain('<details className="plan-context">');
    expect(source).toContain('workspace pages`');
    /**
     * A tab is a place. "Stack Review" and "Prep" were tabs that scrolled the page you
     * were already on and force-opened a `<details>`, which the navigation principle
     * lists first among its anti-patterns: "tabs that execute actions". The scroll
     * mechanism went with them, so it cannot come back by adding one more entry.
     */
    expect(source).not.toContain("scrollTarget");
    expect(source).not.toContain('label: "Stack Review"');
    expect(source).not.toContain('label: "Prep"');
    expect(source).not.toContain("scrollIntoView({ behavior: \"smooth\", block: \"start\" })");
    expect(source).toContain('const navigateContextualWorkspace = (tab: ContextualWorkspaceTab)');
    expect(source).toContain('aria-current={active ? "page" : undefined}');
    expect(source).toContain('const activeContextTabId = activeContextTab ?? contextualWorkspaceTabs.find((tab) => tab.workspace === workspace)?.id ?? contextualWorkspaceTabs[0]?.id ?? null;');
    // Active-tab resolution moved into the row component with the markup.
    expect(source).toContain("activeId={activeContextTabId}");
    expect(tabsComponent).toContain("const active = tab.id === activeId;");
    expect(css).toContain('.workspace-top-switcher button:not(.workspace-top-switcher-active) { border-bottom-color: transparent !important; }');
    expect(mobileStyles).toContain('.workspace-top-switcher { top: 0; min-height: 54px;');
    expect(mobileStyles).toContain('overflow-x: auto; overscroll-behavior-x: contain;');
    expect(mobileStyles).toContain('.workspace-top-switcher button { min-width: max-content; min-height: 46px;');
    expect(css).toContain('.mobile-bottom-nav { display: none; }');
    expect(css).not.toContain('main > section:has(.custom-row) { display: none; }');
    expect(css).toContain('env(safe-area-inset-bottom, 0px)');
    expect(css).toContain('.apex-content { padding-bottom: calc(5.8rem');
    expect(css).toContain('.mobile-workspace-dock { position: fixed;');
    expect(source).not.toContain('className="mobile-workspace-actions"');
    expect(css).toContain('grid-template-columns: repeat(4, minmax(0, 1fr));');
    expect(css).toContain('min-height: 4.25rem;');
    expect(css).toContain('touch-action: manipulation;');
    expect(css).toContain('font-size: var(--sg-text-xs);');
    expect(css).toContain('.rail-brand img { display: block !important; filter: none !important; }');
    expect(css).toContain('.rail-brand::before, .rail-brand::after { content: none !important; display: none !important; }');
  });

  /**
   * The header carries the mark and the athlete; the tab row carries the routes.
   *
   * The header was deleted for the 82px it spends on a phone, and the screen that
   * left behind was reported as worse: the mark, the sport, the goal and the
   * training frequency went with it. It is back, carrying only what it states -
   * the two controls that lead somewhere stayed in the tab row, so neither is
   * rendered twice.
   *
   * Profile is the one that matters: it is deliberately absent from the bottom
   * nav, so the tab row's button is the only route to About Me, and the row
   * therefore has to render on every destination, including single-page ones.
   */
  it("puts the mark and the athlete's context in the header, and the routes in the tab row", () => {
    const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
    expect(source).toContain('className="apex-topbar"');
    expect(source).toContain('className="topbar-context-chips"');
    expect(source).toContain('className="topbar-brand-logo shrink-0 object-cover"');
    expect(css).toContain('.apex-topbar {');
    expect(css).toContain('.topbar-context-chips {');
    // It pins under the header rather than at the top of the page, and the
    // safe-area inset belongs to whichever of the two is topmost.
    expect(css).toContain('.workspace-top-switcher-shell { top: var(--sg-topbar-height); padding-top: 0; }');
    expect(css).toContain('.apex-topbar { position: sticky; top: 0;');

    // The header names the place only where the tab row does not: on Home the two
    // are the same word, one above the other, which is the duplication that got
    // the header deleted in the first place.
    expect(source).toContain("const topbarLabel = workspaceLabel.toLowerCase() === activeContextTabLabel.toLowerCase() ? \"\" : workspaceLabel;");
    expect(source).toContain("{topbarLabel && <p className=\"metric-label\">{topbarLabel}</p>}");

    // Rendered unconditionally: gated on `length > 1` it would skip Home, which has one
    // page, and stranded Profile behind no route at all.
    expect(source).not.toContain('contextualWorkspaceTabs.length > 1 && <WorkspaceTabs');
    expect(source).toContain('<WorkspaceTabs');
    expect(source).toContain('aria-label="Profile and settings"');
    expect(source).toContain('className="topbar-profile-button"');
    expect(source).toContain('<UniversalSearch onOpenResult={openSearchResult} />');
    expect(tabsComponent).toContain('{actions && <div className="workspace-top-actions">{actions}</div>}');

    // Outside the scrolling nav, so scrolling the tabs cannot carry them off the edge.
    expect(tabsComponent).not.toMatch(/<nav className="workspace-top-switcher"[\s\S]*workspace-top-actions[\s\S]*<\/nav>/);
    expect(css).toContain('.workspace-top-switcher-shell{--sg-top-actions:7rem;display:flex;');
    // The overflow arrow is positioned from the same number, or it lands on the search button.
    expect(css).toContain('.workspace-top-switcher-shell::after{right:calc(var(--sg-top-actions) + .25rem)}');
    // The row is the top of the page now, on both stylesheets that set it.
    expect(css).toContain('.workspace-top-switcher-shell{position:sticky;top:0;z-index:29}');
    expect(mobileStyles).toContain('.workspace-top-switcher { top: 0;');
  });

  it("keeps the retired accents retired", () => {
    const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
    // The acid-lime accent is retired: it was the calm_precision anti-pattern
    // ("competing highlights") and had accumulated four conflicting !important
    // override mappings. Guard that it stays gone rather than re-suppressed.
    expect(css).not.toContain('#b8ff5b');
    expect(css).not.toContain('metric-lime');
    expect(css).toContain('.hover\\:text-\\[\\#142019\\]:hover { color: var(--sg-text-on-light) !important; }');
  });

  it("retains one explicit active contextual route for every Train and Body Lab tab", () => {
    // Train is four places in the order the work happens, each its own page.
    ["Plan", "Review", "Session", "Matches", "Movement", "Body Lab", "Catalog", "Genome", "Strength"].forEach((label) => expect(source).toContain(`label: "${label}"`));
    expect(source).toContain('const activeContextTabId = activeContextTab ?? contextualWorkspaceTabs.find((tab) => tab.workspace === workspace)?.id ?? contextualWorkspaceTabs[0]?.id ?? null;');
    expect(source).toContain('aria-current={active ? "page" : undefined}');
    expect(tabsComponent).toContain('className={active ? "workspace-top-switcher-active" : ""}');
  });

  it("defers isolated Explore presentation workspaces from the initial planning shell", () => {
    expect(source).toContain('const MovementAtlasPanel = lazy(() => import("@/components/MovementAtlasPanel")');
    expect(source).toContain('const BodyLabNavigator = lazy(() => import("@/components/BodyLabNavigator")');
    expect(source).toContain('const CatalogDiscoveryPanel = lazy(() => import("@/components/CatalogDiscoveryPanel")');
    expect(source).toContain('const StrengthGenomePanel = lazy(() => import("@/components/StrengthGenomePanel")');
    expect(source).toContain('const ExerciseGenomeWorkspace = lazy(() => import("@/components/ExerciseGenomeWorkspace")');
    expect(source).toContain('Preparing this workspace…');
  });

  /**
   * These two cases used to be about hiding things on a phone: a hero paragraph,
   * a week-generator paragraph, and two shortcuts that each had their own panel
   * further down. None of that is rendered any more, so there is nothing to
   * hide - the duplicates are gone rather than display:none. What has to survive
   * is that every one of those capabilities is still reachable.
   */
  it("keeps every Training Day action reachable, without a second copy of any of them", () => {
    expect(source).toContain('className="day-action-add"');
    expect(source).toContain('label: "Session", workspace: "tracker"');
    expect(source).toContain('PrintWorkoutButton disabled={!customWorkout.length}');
    expect(source).toContain("Import plan");
    // Starting the workout opens the destination that owns it rather than a
    // logger rendered a second time inside the plan.
    expect(source).toContain('className="day-action-session" onClick={() => navigateWorkspace("tracker")}');
    expect(source).not.toContain("<WorkoutExecutionPanel");
    expect(trainingDayStyles).not.toContain('.day-active-actions button:nth-child(');
  });

  it("chooses a week and a day in one tap each, with no block between them and the day", () => {
    // Five blocks and about 900px stood in front of the first exercise, three of
    // them naming the same day. Weeks are pills and days are tabs now.
    expect(source).toContain("<TrainingPlanHeader");
    expect(source).toContain("onSelectWeek={selectWeek}");
    expect(source).toContain("onGenerateWeek={generateWeek}");
    expect(source).toContain("onChooseDay={openTrainingDay}");
    expect(trainingDayStyles).toContain(".training-plan-weeks {");
    expect(trainingDayStyles).toContain(".training-plan-days {");
    // The blocks they replaced are gone, not merely unrendered.
    expect(source).not.toContain("<ThreeWeekPlanner");
    expect(source).not.toContain("<WeeklyPlanBoard");
    expect(source).not.toContain("<TrainingDayNav");
  });

  it("keeps Movement Atlas mobile discovery concise while retaining every family filter", () => {
    const atlasStyles = readFileSync(new URL("../movement-atlas.css", import.meta.url), "utf8");
    expect(atlasStyles).toContain(".atlas-improved-head > div:first-child > p:last-child { display: none; }");
    expect(atlasStyles).toContain(".atlas-family-row { flex-wrap: nowrap; overflow-x: auto;");
    expect(atlasStyles).toContain(".atlas-family-row button { flex: 0 0 auto; min-height: 38px; white-space: nowrap; }");
    expect(source).toContain('id: "movement", label: "Movement"');
    expect(source).toContain('id: "body", label: "Body Lab"');
    expect(source).toContain('id: "catalog", label: "Catalog"');
  });

  it("keeps equipment editing and evidence details reachable on demand after Plan Context removal", () => {
    expect(source).not.toContain('<details className="plan-context">');
    expect(source).toContain('aria-label="Profile and settings"');
    expect(source).toContain('workspace === "profile" && <AthleteAboutMePanel');
    expect(aboutMeSource).toContain("Available equipment");
    // The Atlas now renders behind the browsing notice, so the workspace opens a
    // fragment rather than the panel directly — and only once a sport is chosen. Without
    // one, the gate takes its place rather than the Atlas defaulting to someone else's sport.
    expect(source).toMatch(/workspace === "movement" && hasSportContext && <>.*<MovementAtlasPanel/);
    expect(source).toContain('workspace === "movement" && !hasSportContext && <SportContextGate');
    expect(source).toContain('workspace === "body" && <section className="body-lab-v2');
    expect(source).toContain('<CatalogExerciseEvidenceCard exercise={inspectedExercise} />');
    expect(anatomySource).toContain("View methodology");
    expect(anatomySource).toContain("<dt>Evidence</dt>");
  });
});
