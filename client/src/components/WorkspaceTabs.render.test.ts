// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceTabs, type WorkspaceTab } from "./WorkspaceTabs";

/**
 * The contextual tab row scrolls horizontally and hides its own scrollbar. Measured on a
 * 390px phone, the Train group's six tabs need 697px, so three of them sat off screen with
 * nothing to say they existed. The row now marks the side that has more, and brings the
 * active tab into view.
 */
const trainTabs: WorkspaceTab[] = ["Plan", "Today", "Log", "Library", "Tracker", "History"]
  .map(label => ({ id: label.toLowerCase(), label }));

// jsdom lays nothing out, so both widths read 0; the tests set them.
const widths = { scroll: 0, client: 0 };

function renderTabs(props: Partial<Parameters<typeof WorkspaceTabs>[0]> = {}) {
  const onSelect = vi.fn();
  const view = render(createElement(WorkspaceTabs, { tabs: trainTabs, activeId: "plan", label: "Train", onSelect, ...props }));
  const shell = () => view.container.querySelector<HTMLElement>(".workspace-top-switcher-shell");
  return { ...view, onSelect, shell };
}

describe("the tab row admits that it scrolls", () => {
  let scrollIntoView: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // jsdom does not implement scrollIntoView; the active-tab effect calls it on mount.
    scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    Object.defineProperty(HTMLElement.prototype, "scrollWidth", { configurable: true, get: () => widths.scroll });
    Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, get: () => widths.client });
  });

  afterEach(() => {
    cleanup();
    delete (Element.prototype as Partial<Element>).scrollIntoView;
    delete (HTMLElement.prototype as Partial<HTMLElement>).scrollWidth;
    delete (HTMLElement.prototype as Partial<HTMLElement>).clientWidth;
  });

  it("marks the side that has more tabs, and follows the scroll", () => {
    // jsdom has no ResizeObserver, so this also covers a browser without one.
    expect(globalThis.ResizeObserver).toBeUndefined();
    widths.scroll = 697;
    widths.client = 390;
    const { shell } = renderTabs();

    expect(shell()?.dataset.overflowStart).toBe("no");
    expect(shell()?.dataset.overflowEnd).toBe("yes");

    const nav = screen.getByRole("navigation", { name: "Train" });
    nav.scrollLeft = 307;
    fireEvent.scroll(nav);

    expect(shell()?.dataset.overflowStart).toBe("yes");
    expect(shell()?.dataset.overflowEnd).toBe("no");
  });

  it("does not light a mark for a sub-pixel residue on a row that fits", () => {
    widths.scroll = 390.5;
    widths.client = 390;
    const { shell } = renderTabs();

    expect(shell()?.dataset.overflowStart).toBe("no");
    expect(shell()?.dataset.overflowEnd).toBe("no");

    const nav = screen.getByRole("navigation", { name: "Train" });
    nav.scrollLeft = 0.5;
    fireEvent.scroll(nav);

    expect(shell()?.dataset.overflowStart).toBe("no");
    expect(shell()?.dataset.overflowEnd).toBe("no");
  });

  it("renders nothing for a lone tab, and only the actions when there are some", () => {
    const lone = [trainTabs[0]];
    const { container } = renderTabs({ tabs: lone });
    expect(container.innerHTML).toBe("");
    cleanup();

    const { shell } = renderTabs({ tabs: lone, actions: createElement("span", null, "Search") });
    expect(shell()).not.toBeNull();
    expect(screen.getByText("Search")).toBeTruthy();
    expect(screen.queryByRole("navigation")).toBeNull();
  });

  it("brings the active tab into view, scrolling only the row", () => {
    const { rerender, onSelect } = renderTabs({ activeId: "history" });
    const history = screen.getByRole("button", { name: "History" });

    expect(history.getAttribute("aria-current")).toBe("page");
    for (const tab of trainTabs.filter(tab => tab.id !== "history")) {
      expect(screen.getByRole("button", { name: tab.label }).hasAttribute("aria-current")).toBe(false);
    }
    expect(scrollIntoView).toHaveBeenCalledWith(expect.objectContaining({ inline: "nearest", block: "nearest" }));
    expect(scrollIntoView.mock.contexts.at(-1)).toBe(history);

    rerender(createElement(WorkspaceTabs, { tabs: trainTabs, activeId: "today", label: "Train", onSelect }));
    expect(scrollIntoView.mock.contexts.at(-1)).toBe(screen.getByRole("button", { name: "Today" }));
  });

  it("hands the chosen tab to onSelect", () => {
    const { onSelect } = renderTabs();
    fireEvent.click(screen.getByRole("button", { name: "Library" }));
    expect(onSelect).toHaveBeenCalledWith(trainTabs[3]);
  });
});
