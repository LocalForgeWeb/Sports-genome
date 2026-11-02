// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BrandMark } from "./BrandMark";
import { sportsGenomeAssets } from "@/lib/sportsGenomeAssets";

/**
 * iOS readiness audit, A07: the brand mark reserves its size before it loads, and a failed image
 * becomes a drawn mark, never the browser's broken-image icon or alt text crammed into a circle.
 */
afterEach(cleanup);

describe("the brand mark", () => {
  it("reserves its size and names itself only when asked to", () => {
    const { container } = render(createElement(BrandMark, { size: 44, label: "Sports Genome", className: "topbar-brand-logo" }));
    const image = container.querySelector("img")!;
    expect(image.getAttribute("src")).toBe(sportsGenomeAssets.circularBadge);
    expect([image.getAttribute("width"), image.getAttribute("height")]).toEqual(["44", "44"]);
    expect(image.getAttribute("alt")).toBe("Sports Genome");
    const decorative = render(createElement(BrandMark, { size: 38 })).container.querySelector("img")!;
    expect(decorative.getAttribute("alt")).toBe("");
  });

  it("serves the official logo for the logo variant", () => {
    const { container } = render(createElement(BrandMark, { variant: "logo", size: 36 }));
    expect(container.querySelector("img")!.getAttribute("src")).toBe(sportsGenomeAssets.officialLogo);
  });

  it("draws its own mark, at the same size, when the image fails", () => {
    const { container } = render(createElement(BrandMark, { size: 44, label: "Sports Genome", className: "topbar-brand-logo" }));
    fireEvent.error(container.querySelector("img")!);
    expect(container.querySelector("img")).toBeNull();
    const mark = container.querySelector("svg[data-fallback='brand']")!;
    expect([mark.getAttribute("width"), mark.getAttribute("height")]).toEqual(["44", "44"]);
    expect(mark.getAttribute("class")).toContain("topbar-brand-logo");
    expect(mark.getAttribute("role")).toBe("img");
    expect(mark.getAttribute("aria-label")).toBe("Sports Genome");
    expect(mark.textContent).toBe("SG");
  });

  it("keeps a decorative mark decorative when it falls back", () => {
    const { container } = render(createElement(BrandMark, { size: 38 }));
    fireEvent.error(container.querySelector("img")!);
    const mark = container.querySelector("svg")!;
    expect(mark.getAttribute("aria-hidden")).toBe("true");
    expect(mark.getAttribute("role")).toBeNull();
  });
});
