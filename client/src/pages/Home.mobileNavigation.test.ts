import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { workspaceFromLocation } from "./Home";

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
  });
});
