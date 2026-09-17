import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const component = readFileSync(join(process.cwd(), "client/src/components/WorkspaceTabs.tsx"), "utf8");
const home = readFileSync(join(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
const css = readFileSync(join(process.cwd(), "client/src/index.css"), "utf8");

/**
 * The contextual tab row scrolls horizontally and hides its own scrollbar. Measured
 * on a 390px phone, the Train group's six tabs need 697px - so three of them sat off
 * screen with nothing at all to say they existed.
 */
describe("the tab row admits that it scrolls", () => {
  it("tracks whether there is more in either direction", () => {
    expect(component).toContain("node.scrollWidth - node.clientWidth");
    expect(component).toContain("scrollLeft > 1");
    expect(component).toContain("scrollLeft < maxScroll - 1");
  });

  it("tolerates a sub-pixel residue rather than lighting a fade on a row that fits", () => {
    // Exact comparisons leave an indicator permanently on.
    expect(component).not.toContain("scrollLeft > 0");
    expect(component).not.toContain("scrollLeft < maxScroll)");
  });

  it("exposes the state as attributes the stylesheet can key off", () => {
    expect(component).toContain('data-overflow-start');
    expect(component).toContain('data-overflow-end');
    expect(css).toContain('.workspace-top-switcher-shell[data-overflow-start="yes"]::before');
    expect(css).toContain('.workspace-top-switcher-shell[data-overflow-end="yes"]::after');
  });

  it("uses a mark that stays visible, not a fade into the same colour", () => {
    // The first attempt gradiented to the surface behind it and was invisible.
    const shell = css.slice(css.indexOf(".workspace-top-switcher-shell::before,"));
    const rule = shell.slice(0, shell.indexOf("}") + 1);
    expect(rule).not.toContain("linear-gradient");
    expect(css).toContain('.workspace-top-switcher-shell::before{content:"\\2039"');
    expect(css).toContain('.workspace-top-switcher-shell::after{content:"\\203A"');
  });

  it("keeps the indicator off a label", () => {
    expect(css).toContain('[data-overflow-end="yes"] .workspace-top-switcher{padding-right:2rem}');
  });

  it("re-measures when the row or its contents change size", () => {
    expect(component).toContain("ResizeObserver");
    expect(component).toContain('node.addEventListener("scroll", measure');
  });

  it("cleans up its listeners", () => {
    expect(component).toContain('node.removeEventListener("scroll", measure)');
    expect(component).toContain("observer?.disconnect()");
  });

  it("survives a browser without ResizeObserver", () => {
    expect(component).toContain('typeof ResizeObserver === "function"');
  });
});

describe("arriving at an off-screen tab shows it", () => {
  it("scrolls the active tab into view", () => {
    expect(component).toContain('querySelector<HTMLElement>(\'[aria-current="page"]\')');
    expect(component).toContain("scrollIntoView");
  });

  it("scrolls only the row, not the page", () => {
    // block: "nearest" stops the whole document jumping to the tab strip.
    expect(component).toContain('inline: "nearest", block: "nearest"');
  });

  it("re-runs when the active tab changes", () => {
    const effect = component.slice(component.indexOf("Arriving at a tab"));
    expect(effect).toContain("[activeId]");
  });
});

/**
 * Strength Genome is where a lift is recorded. It sat under Body Lab - a tab named
 * after an anatomy viewer - while the panel reporting on those lifts sat under
 * Progress, showing "No lifts logged yet" with no route to the screen that fixes it.
 */
describe("the athlete's own record lives in one place", () => {
  it("puts Strength Genome under Progress", () => {
    const progress = home.slice(home.indexOf("progress: ["), home.indexOf("progress: [") + 260);
    expect(progress).toContain('workspace: "strength"');
  });

  it("leaves Body Lab as the reference library", () => {
    const body = home.slice(home.indexOf("body: ["), home.indexOf("body: [") + 320);
    expect(body).not.toContain('workspace: "strength"');
    for (const workspace of ["movement", "body", "catalog", "genome"]) {
      expect(body).toContain(`workspace: "${workspace}"`);
    }
  });

  it("gives Progress a real tab row rather than a single orphan", () => {
    const progress = home.slice(home.indexOf("progress: ["), home.indexOf("progress: [") + 260);
    expect([...progress.matchAll(/workspace: "/g)].length).toBeGreaterThan(1);
  });

  it("renders the row through the component rather than inline markup", () => {
    expect(home).toContain("<WorkspaceTabs");
    expect(home).not.toContain('<nav className="workspace-top-switcher"');
  });
});
