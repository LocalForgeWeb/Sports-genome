import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const home = readFileSync(join(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
const css = readFileSync(join(process.cwd(), "client/src/index.css"), "utf8");

/**
 * The contextual tab row scrolls horizontally and hides its own scrollbar. Measured
 * on a 390px phone, the Train group's six tabs need 697px - so three of them sat off
 * screen with nothing at all to say they existed. WorkspaceTabs.render.test.ts covers
 * how the row measures itself and brings the active tab into view; these check that
 * the stylesheet shows what the row reports.
 */
describe("the tab row admits that it scrolls", () => {
  it("keys the marks off the attributes the row sets", () => {
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
    for (const workspace of ["movement", "body", "catalog"]) {
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
