import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { shouldRenderMetric, workspaceFromLocation } from "./Home";

const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");
const workoutTrackerSource = readFileSync(new URL("../components/WorkoutExecutionPanel.tsx", import.meta.url), "utf8");
const stackReviewSource = readFileSync(new URL("../components/WorkoutHealthPanel.tsx", import.meta.url), "utf8");

describe("workspace side navigation", () => {
  it("resolves only supported workspace values and keeps an invalid URL on the command center", () => {
    expect(workspaceFromLocation("catalog")).toBe("catalog");
    expect(workspaceFromLocation("body")).toBe("body");
    expect(workspaceFromLocation("strength")).toBe("strength");
    expect(workspaceFromLocation("progress")).toBe("progress");
    expect(workspaceFromLocation("not-a-workspace")).toBe("command");
    expect(workspaceFromLocation(null)).toBe("command");
  });

  it("uses buttons with active-state semantics and browser history-aware navigation", () => {
    expect(source).toContain('aria-label="Primary workspace navigation"');
    expect(source).toContain('aria-current={workspace === item.id ? "page" : undefined}');
    expect(source).toContain('window.history.pushState({ workspace: next }, "", url)');
    expect(source).toContain('window.addEventListener("popstate", restoreWorkspace)');
    expect(source).toContain('className="rail-scrim"');
    expect(source).toContain('aria-label="Close workspace navigation"');
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

  it("keeps the rail reachable on desktop and dismissible by an overlay on small screens", () => {
    const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
    expect(css).toContain('@media (min-width: 1024px)');
    expect(css).toContain('.apex-rail { transform: translateX(0); }');
    expect(css).toContain('.rail-scrim { position: fixed;');
    expect(css).toContain('overflow-y: auto;');
    expect(css).toContain('overscroll-behavior-y: contain;');
    expect(css).toContain('width: min(86vw, 320px);');
  });

  it("uses the official Sports Genome drawer identity and a non-neon active state", () => {
    const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
    expect(source).toContain('sports-genome-decoding-performance-logo_0544e065.png');
    expect(source).toContain('alt="Sports Genome — Decoding Performance logo"');
    expect(source).toContain('className="rail-brand-logo shrink-0 object-contain"');
    expect(source).toContain('>Sports Genome</p>');
    expect(source).toContain('Athlete workspace');
    expect(source).toContain('rail-data-line');
    expect(source).not.toContain('gym-optimizer-logo_32341cfa.png');
    expect(source).not.toContain('GYM<br />OPTIMIZER');
    expect(css).toContain('background: linear-gradient(135deg, #1d5fae, #174785) !important;');
    expect(css).toContain('box-shadow: inset 4px 0 var(--sg-gold)');
    expect(css).toContain('.rail-brand::before, .rail-brand::after { content: none; display: none; }');
    expect(css).toContain('.rail-brand-logo { width: 66px; height: 66px; clip-path: circle(44% at 50% 50%); }');
    expect(css).toContain('.direct-workspace-mode .rail-athlete { display: none; }');
    expect(css).toContain('.rail-data-line { display: flex; gap: 8px;');
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

  it("adds a connected context-aware iPhone workspace dock without covering the content canvas", () => {
    const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
    expect(source).toContain('className="mobile-workspace-dock lg:hidden"');
    expect(source).toContain('aria-label="Current workspace actions"');
    expect(source).toContain('Track workout');
    expect(source).toContain('Choose split');
    expect(source).toContain('Review stack');
    expect(source).toContain('setSessionMode(true)');
    expect(source).toContain('document.querySelector(".day-design-rail")?.scrollIntoView');
    expect(source).toContain('document.querySelector("#stack-review")?.scrollIntoView');
    expect(source).toContain('document.querySelector<HTMLElement>("#workout-tracker")?.scrollIntoView');
    expect(source).toContain('const [loggerScrollRequest, setLoggerScrollRequest] = useState(0);');
    expect(source).toContain('if (!sessionMode || !loggerScrollRequest) return;');
    expect(workoutTrackerSource).toContain('id="workout-tracker"');
    expect(stackReviewSource).toContain('id="stack-review"');
    expect(source).toContain('Log a test');
    expect(source).toContain('Open Body Lab');
    expect(source).toContain('Find exercises');
    expect(source).toContain('Change action');
    expect(source).toContain('View matches');
    expect(source).toContain('aria-label="Primary mobile navigation"');
    expect(source).toContain('label: "Train"');
    expect(source).toContain('label: "Genome"');
    expect(source).toContain('label: "Progress"');
    expect(source).toContain('label: "Profile"');
    expect(source).toContain('aria-current={active ? "page" : undefined}');
    expect(css).toContain('.mobile-bottom-nav { display: none; }');
    expect(css).toContain('env(safe-area-inset-bottom, 0px)');
    expect(css).toContain('.apex-content { padding-bottom: calc(10.25rem');
    expect(css).toContain('.mobile-workspace-dock { position: fixed;');
    expect(css).toContain('.mobile-workspace-actions button { min-height: 2.75rem;');
    expect(css).toContain('.planner-float { bottom: calc(5.6rem');
    expect(css).toContain('.rail-brand img { display: block !important; filter: none !important; }');
    expect(css).toContain('.rail-brand::before, .rail-brand::after { content: none !important; display: none !important; }');
  });

  it("uses compact, individually truncatable sport, goal, and weekly-plan context chips in the workspace header", () => {
    const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
    expect(source).toContain('className="topbar-context-chips"');
    expect(source).toContain('Current planning context: ${selectedSport.label}, ${goal}, ${trainingDays} training days');
    expect(source).not.toContain('selectedSport.label} <span className="mx-1.5 text-[#a2aca4]">/</span> {goal}');
    expect(css).toContain('.topbar-context-chips span { max-width: 12rem; overflow: hidden;');
    expect(css).toContain('text-overflow: ellipsis; white-space: nowrap;');
    expect(css).toContain('max-width: calc(100vw - 9.5rem);');
  });
});
