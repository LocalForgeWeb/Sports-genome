// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { focusableWithin, holdPageBehind, trapTabWithin } from "./modalBackground";

/**
 * body
 *   div#app
 *     header (button)
 *     main
 *       section#figure (button)
 *       div#scrim
 *       div#layer (button#first, details > summary + input, button#last)
 *     nav#dock (button)
 *   section#toaster[aria-live]
 */
function buildPage() {
  document.body.innerHTML = `
    <div id="app">
      <header id="header"><button>Search</button></header>
      <main id="main">
        <section id="figure"><button id="muscle">Chest</button></section>
        <div id="scrim"></div>
        <div id="layer">
          <h2 id="title" tabindex="-1">Chest</h2>
          <button id="first">Close</button>
          <details id="about"><summary id="summary">About</summary><input id="hidden-input" /></details>
          <button id="disabled" disabled>Nope</button>
          <button id="last">Open Plan</button>
        </div>
      </main>
      <nav id="dock"><button>Home</button></nav>
    </div>
    <section id="toaster" aria-live="polite"></section>`;
  const get = (id: string) => document.getElementById(id)!;
  return { get, layer: get("layer") };
}

afterEach(() => {
  document.body.innerHTML = "";
  document.body.removeAttribute("style");
  vi.unstubAllGlobals();
});

describe("holdPageBehind", () => {
  it("makes everything around the layer inert, up to the body, and keeps the scrim and the toaster", () => {
    vi.stubGlobal("scrollTo", vi.fn());
    const { get, layer } = buildPage();
    const release = holdPageBehind(layer, [get("scrim")]);

    for (const id of ["figure", "header", "dock"]) expect(get(id).hasAttribute("inert"), id).toBe(true);
    for (const id of ["layer", "main", "app", "scrim", "toaster"]) expect(get(id).hasAttribute("inert"), id).toBe(false);

    release();
    expect(document.querySelectorAll("[inert]")).toHaveLength(0);
  });

  it("pins the body at its scroll offset and puts it back on release, once", () => {
    const scrollTo = vi.fn();
    vi.stubGlobal("scrollTo", scrollTo);
    vi.stubGlobal("scrollY", 420);
    const { layer } = buildPage();
    document.body.style.overflow = "auto";
    const release = holdPageBehind(layer);

    expect(document.body.style.position).toBe("fixed");
    expect(document.body.style.top).toBe("-420px");
    // Sep 30 review: overflow is left to the layers that lock it; the pin holds the page still.
    expect(document.body.style.overflow).toBe("auto");

    release();
    release();
    expect(document.body.style.position).toBe("");
    expect(document.body.style.top).toBe("");
    expect(document.body.style.overflow).toBe("auto");
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith(0, 420);
  });

  it("lets a layer opened over the hold lock overflow and put back the page's own value", () => {
    vi.stubGlobal("scrollTo", vi.fn());
    const { layer } = buildPage();
    const release = holdPageBehind(layer);
    // Search opens over the sheet and locks overflow, saving the value it finds.
    const savedBySearch = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // A result that leaves the page unmounts the sheet: its hold is released first (a layout
    // cleanup), then search puts back what it saved (a passive cleanup).
    release();
    document.body.style.overflow = savedBySearch;
    expect(document.body.style.overflow).toBe("");
    expect(document.body.style.position).toBe("");
  });

  it("leaves alone what was inert before it, so another layer's hold is not undone", () => {
    vi.stubGlobal("scrollTo", vi.fn());
    const { get, layer } = buildPage();
    get("dock").setAttribute("inert", "");
    const release = holdPageBehind(layer);
    release();
    expect(get("dock").hasAttribute("inert")).toBe(true);
    expect(get("figure").hasAttribute("inert")).toBe(false);
  });
});

describe("focusableWithin and trapTabWithin", () => {
  it("lists what Tab can reach, skipping disabled controls and the inside of a closed disclosure", () => {
    const { get, layer } = buildPage();
    expect(focusableWithin(layer).map((element) => element.id)).toEqual(["first", "summary", "last"]);
    (get("about") as HTMLDetailsElement).open = true;
    expect(focusableWithin(layer).map((element) => element.id)).toEqual(["first", "summary", "hidden-input", "last"]);
  });

  it("wraps Tab from the last control to the first, and Shift+Tab from the title to the last", () => {
    const { get, layer } = buildPage();
    get("last").focus();
    const forward = new KeyboardEvent("keydown", { key: "Tab", cancelable: true });
    expect(trapTabWithin(forward, layer)).toBe(true);
    expect(forward.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(get("first"));

    get("title").focus();
    const back = new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, cancelable: true });
    expect(trapTabWithin(back, layer)).toBe(true);
    expect(document.activeElement).toBe(get("last"));
  });

  it("brings focus that strayed outside back in, and leaves Tab between inner controls to the browser", () => {
    const { get, layer } = buildPage();
    get("muscle").focus();
    expect(trapTabWithin(new KeyboardEvent("keydown", { key: "Tab", cancelable: true }), layer)).toBe(true);
    expect(document.activeElement).toBe(get("first"));

    const inner = new KeyboardEvent("keydown", { key: "Tab", cancelable: true });
    expect(trapTabWithin(inner, layer)).toBe(false);
    expect(inner.defaultPrevented).toBe(false);
    expect(trapTabWithin(new KeyboardEvent("keydown", { key: "Escape" }), layer)).toBe(false);
  });
});
