import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { shouldRenderMetric, workspaceFromLocation } from "./Home";

const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");

describe("workspace side navigation", () => {
  it("resolves only supported workspace values and keeps an invalid URL on the command center", () => {
    expect(workspaceFromLocation("catalog")).toBe("catalog");
    expect(workspaceFromLocation("body")).toBe("body");
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
    expect(source).toContain('sports-genome-official-logo-64_f1d0979d.png');
    expect(source).toContain('alt="Sports Genome icon"');
    expect(source).toContain('>Sports Genome</p>');
    expect(source).toContain('Athlete workspace');
    expect(source).toContain('rail-data-line');
    expect(source).not.toContain('gym-optimizer-logo_32341cfa.png');
    expect(source).not.toContain('GYM<br />OPTIMIZER');
    expect(css).toContain('background: linear-gradient(135deg, #1d5fae, #174785) !important;');
    expect(css).toContain('box-shadow: inset 4px 0 var(--sg-gold)');
    expect(css).toContain('.rail-brand::before, .rail-brand::after { content: none; display: none; }');
    expect(css).toContain('.rail-data-line { display: flex; gap: 8px;');
  });

  it("blocks the retired coach-set readiness placeholder from rendering", () => {
    expect(shouldRenderMetric("coach-set planning marker")).toBe(false);
    expect(shouldRenderMetric("mapped muscle groups")).toBe(true);
  });
});
