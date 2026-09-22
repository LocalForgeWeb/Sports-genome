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

/**
 * Reported on Home: "the top thing looks empty".
 *
 * Measured at 390px, with the search and Profile controls taking their fixed 112px
 * and the strip getting the remaining 278px:
 *
 *     destination   tabs   tabs occupy   blank
 *     Home             1          66px   212px   (76% of the strip, 54% of the row)
 *     Progress         2         198px    80px
 *     Train            4         316px   overflows and scrolls
 *     Body Lab         4         368px   overflows and scrolls
 *
 * Home is the only destination with one page, and that one tab navigated to the page
 * it was already on. So on Home the row stops being a switcher and becomes a title:
 * the name, the date under it, and the same two controls. Blank went 212px -> 56px.
 *
 * No control was added - one that did nothing was removed.
 */
describe("a destination with nothing to switch between", () => {
  it("draws a title instead of a tab that leads where you already are", () => {
    expect(component).toContain("const single = tabs.length <= 1;");
    expect(component).toContain('<div className="workspace-top-title">');
    expect(component).toContain("{single ? (");
  });

  it("keeps the controls, which are the row's other job", () => {
    // Profile is deliberately absent from the bottom nav, so this row is its only
    // route. A single-page destination that dropped the row would strand it.
    const shell = component.slice(component.indexOf('className="workspace-top-switcher-shell"'));
    expect(shell).toContain('{actions && <div className="workspace-top-actions">{actions}</div>}');
    expect(shell.indexOf("workspace-top-actions")).toBeGreaterThan(shell.indexOf("workspace-top-title"));
  });

  it("still draws real tabs wherever there is more than one page", () => {
    expect(component).toContain('<nav className="workspace-top-switcher"');
    expect(component).toContain("{tabs.map(tab => {");
  });

  it("holds both shapes to one height and one text inset", () => {
    // Otherwise the chrome changes size as you move between destinations. Measured
    // after: Home, Body Lab, Train and Progress are all 63px at 390px wide.
    expect(css).toMatch(/--sg-top-row-item:\s*46px/);
    expect(css).toMatch(/--sg-top-row-pad:\s*7px/);
    expect(css).toContain("min-height: var(--sg-top-row-item, 46px)");
    expect(css).toContain("min-height: calc(var(--sg-top-row-item, 46px) + 2 * var(--sg-top-row-pad, 7px) + 1px)");
    // The breakpoint that actually wins on a phone moves the same tokens rather
    // than restating the numbers.
    expect(css).toContain("--sg-top-row-item: 52px; --sg-top-row-pad: 5px;");
    expect(css).toContain("min-height: var(--sg-top-row-item); padding: 0 .9rem;");
  });

  it("says the date rather than repeating the plan position", () => {
    // The card below already prints "Week 1 - Day 02 - Pull".
    expect(home).toContain("caption={activePrimaryDestination === \"home\"");
    expect(home).toContain("toLocaleDateString");
    expect(home).not.toContain("caption={activeDayLabel}");
  });
});
