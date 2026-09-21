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
    expect(source).toContain('onClick={() => navigateWorkspace("day-plan")}');
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
    expect(source).toContain('className="topbar-brand-logo shrink-0 object-cover"');
    expect(css).toContain('.topbar-brand-logo { width: 56px; height: 56px; border-radius: 999px;');
    expect(css).toContain('@media (min-width: 1024px) {\n  .apex-content { padding-bottom: 6.25rem; }');
  });

  it("uses the official Sports Genome header identity and a non-neon active state", () => {
    const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
    expect(source).toContain('shell-${activePrimaryDestination}');
    expect(source).toContain('destination-${activePrimaryDestination}');
    expect(css).toContain('.apex-content.destination-train');
    expect(css).toContain('.apex-content.destination-body');
    expect(css).toContain('.apex-content.destination-progress');
    expect(css).toContain('.apex-content.destination-secondary');
    expect(source).toContain('sportsGenomeAssets.circularBadge');
    expect(source).toContain('alt="Sports Genome circular badge"');
    expect(source).toContain('className="topbar-brand-logo shrink-0 object-cover"');
    expect(source).toContain('className="topbar-context-chips"');
    expect(css).not.toContain('topbar-brand-logo { width: 50px; height: 50px; clip-path');
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
    expect(source).toContain('label: "Tracker", workspace: "tracker"');
    expect(source).toContain('label: "Stack Review", workspace: "day-plan"');
    expect(source).toContain('label: "Prep", workspace: "custom"');
    expect(source).toContain('navigateWorkspace("tracker")');
    expect(source).toContain('const target = document.querySelector(scrollTarget);');
    expect(source).toContain('target?.scrollIntoView({ behavior: "smooth", block: "start" });');
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
    expect(source).toContain('label: "Stack Review", workspace: "day-plan", scrollTarget: "#stack-review"');
    expect(source).toContain('label: "Prep", workspace: "custom", scrollTarget: "#session-prep"');
    expect(source).toContain('const navigateContextualWorkspace = (tab: ContextualWorkspaceTab)');
    expect(source).toContain('if (scrollTarget) window.requestAnimationFrame(() => window.requestAnimationFrame(() => {');
    expect(source).toContain('if (tab.id === "stack-review") target?.querySelector<HTMLDetailsElement>("details")?.setAttribute("open", "");');
    expect(source).toContain('aria-current={active ? "page" : undefined}');
    expect(source).toContain('const activeContextTabId = activeContextTab ?? contextualWorkspaceTabs.find((tab) => tab.workspace === workspace && !tab.scrollTarget)?.id ?? contextualWorkspaceTabs[0]?.id ?? null;');
    // Active-tab resolution moved into the row component with the markup.
    expect(source).toContain("activeId={activeContextTabId}");
    expect(tabsComponent).toContain("const active = tab.id === activeId;");
    expect(css).toContain('.workspace-top-switcher button:not(.workspace-top-switcher-active) { border-bottom-color: transparent !important; }');
    expect(mobileStyles).toContain('.workspace-top-switcher { top: 78px; min-height: 54px;');
    expect(mobileStyles).toContain('overflow-x: auto; overscroll-behavior-x: contain;');
    expect(mobileStyles).toContain('.workspace-top-switcher button { min-width: max-content; min-height: 46px;');
    expect(mobileStyles).toContain('.topbar-brand-logo { width: 56px; height: 56px; }');
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

  it("uses compact, individually truncatable sport, goal, and weekly-plan context chips in the workspace header", () => {
    const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
    expect(source).toContain('className="topbar-context-chips"');
    expect(source).toContain('Current planning context: ${selectedSport.label}, ${goal}, ${trainingDays} training days');
    expect(source).not.toContain('selectedSport.label} <span className="mx-1.5 text-[#a2aca4]">/</span> {goal}');
    expect(css).toContain('.topbar-context-chips span { max-width: 12rem; overflow: hidden;');
    // The strip is bounded by its own column, not by the viewport: a
    // viewport-derived width cannot know how wide the topbar's right-hand
    // cluster is, and `overflow: visible` let the chips run underneath it
    // (measured: "5 days" 57px behind the search trigger at 390px). Within that
    // column they wrap rather than scroll - as a hidden-scrollbar strip the
    // same chip was cut mid-word at 272px, with nothing on screen saying there
    // was anything to scroll to, which reads as a clipped layout.
    expect(css).toContain('.topbar-context-chips { flex-wrap: wrap; max-width: 100%; overflow-x: visible;');
    expect(css).toContain('.topbar-context-chips span { max-width: none; flex: 0 0 auto; }');
    expect(mobileStyles).toContain('max-width: calc(100vw - 5.5rem);');
    expect(mobileStyles).toContain('flex: 0 0 auto;');
    // Both files style this strip and only source order decides which wins, so
    // neither may quietly put the scroller back.
    expect(mobileStyles).toContain('.topbar-context-chips { flex-wrap: wrap;');
    expect(mobileStyles).not.toMatch(/\.topbar-context-chips \{[^}]*overflow-x: auto/);
    expect(mobileStyles).toContain('.apex-topbar button:last-child { display: none; }');
    // The acid-lime accent is retired: it was the calm_precision anti-pattern
    // ("competing highlights") and had accumulated four conflicting !important
    // override mappings. Guard that it stays gone rather than re-suppressed.
    expect(css).not.toContain('#b8ff5b');
    expect(css).not.toContain('metric-lime');
    expect(css).toContain('.hover\\:text-\\[\\#142019\\]:hover { color: var(--sg-text-on-light) !important; }');
  });

  it("retains one explicit active contextual route for every Train and Body Lab tab", () => {
    ["Training Day", "Tracker", "Matches", "Builder", "Stack Review", "Prep", "Movement", "Body Lab", "Catalog", "Genome", "Strength"].forEach((label) => expect(source).toContain(`label: "${label}"`));
    expect(source).toContain('const activeContextTabId = activeContextTab ?? contextualWorkspaceTabs.find((tab) => tab.workspace === workspace && !tab.scrollTarget)?.id ?? contextualWorkspaceTabs[0]?.id ?? null;');
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

  it("removes duplicate mobile Training Day shortcuts while keeping dedicated Tracker and Builder destinations reachable", () => {
    expect(trainingDayStyles).toContain('.day-design-import { display: none; }');
    expect(trainingDayStyles).toContain('.day-active-actions button:nth-child(1), .day-active-actions button:nth-child(2) { display: none; }');
    expect(source).toContain('label: "Tracker", workspace: "tracker"');
    expect(source).toContain('label: "Builder", workspace: "custom"');
    expect(source).toContain('PrintWorkoutButton disabled={!customWorkout.length}');
    expect(source).toContain('Import this plan');
  });

  it("compresses Training Day’s mobile default without removing week-selection controls", () => {
    expect(trainingDayStyles).toContain(".day-design-hero p:last-child { display: none; }");
    expect(trainingDayStyles).toContain(".three-week-head p:last-child { display: none; }");
    expect(trainingDayStyles).toContain(".three-week-tabs { grid-template-columns: repeat(3, minmax(0, 1fr)); }");
    expect(trainingDayStyles).toContain(".three-week-tabs button { min-height: 76px;");
    expect(source).toContain("<ThreeWeekPlanner activeWeek={activeWeek}");
    expect(source).toContain("<WeeklyPlanBoard days={splitDays}");
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
    // fragment rather than the panel directly; what matters is that it is still
    // the Movement Atlas the athlete reaches.
    expect(source).toMatch(/workspace === "movement" && <>.*<MovementAtlasPanel/);
    expect(source).toContain('workspace === "body" && <section className="body-lab-v2');
    expect(source).toContain('<CatalogExerciseEvidenceCard exercise={inspectedExercise} />');
    expect(anatomySource).toContain("View methodology");
    expect(anatomySource).toContain("<dt>Evidence</dt>");
  });
});
