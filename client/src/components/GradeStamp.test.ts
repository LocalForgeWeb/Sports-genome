// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { Grade } from "@/lib/exerciseCatalog";
import { GradeStamp } from "./GradeStamp";

const grades: Grade[] = ["SS", "S", "A", "B", "C", "D", "F"];

function stamp(props: { grade: Grade; score?: number; compact?: boolean; label?: string }) {
  const { container } = render(createElement(GradeStamp, props));
  const element = container.querySelector("span");
  if (!element) throw new Error("GradeStamp rendered no span");
  return element;
}

describe("GradeStamp", () => {
  afterEach(cleanup);

  // The catalog card prints the exercise's own letter ("Catalog tag A"), so
  // the stamp in its overlay must print that same letter, not a higher one.
  it.each(grades)("shows grade %s as itself in the text, the name and the hover title", (grade) => {
    const element = stamp({ grade, compact: true });
    expect(element.textContent).toBe(grade);
    expect(element.getAttribute("aria-label")).toBe(`Catalog planning tier ${grade}`);
    expect(element.getAttribute("title")).toBe(`Catalog planning tier ${grade}`);
  });

  it("adds the modelled match to the name without changing the letter", () => {
    const element = stamp({ grade: "A", score: 82 });
    expect(element.getAttribute("aria-label")).toBe("Catalog planning tier A, 82 modelled overall match");
    expect(element.textContent).toBe("A");
  });

  // A plain span cannot carry a name, so screen readers read only the letter.
  // As an image, the stamp is announced by its label: what the letter means.
  it("is announced as the catalog planning tier, with the letter still shown", () => {
    render(createElement(GradeStamp, { grade: "SS", score: 88, compact: true }));
    const named = screen.getByRole("img", { name: "Catalog planning tier SS, 88 modelled overall match" });
    expect(named.textContent).toBe("SS");
    cleanup();

    render(createElement(GradeStamp, { grade: "B" }));
    expect(screen.getByRole("img", { name: "Catalog planning tier B" }).textContent).toBe("B");
  });

  // The same letters also grade contextual fit and a muscle's involvement; a
  // stamp for either must not be announced as the exercise's catalog tier.
  it("is announced by the label it is given, in the name and the hover title", () => {
    render(createElement(GradeStamp, { grade: "B", label: "Contextual fit", compact: true }));
    const named = screen.getByRole("img", { name: "Contextual fit B" });
    expect(named.textContent).toBe("B");
    expect(named.getAttribute("title")).toBe("Contextual fit B");
    expect(screen.queryByRole("img", { name: /Catalog planning tier/ })).toBeNull();
    cleanup();

    const element = stamp({ grade: "A", score: 82, label: "Muscle involvement tier" });
    expect(element.getAttribute("aria-label")).toBe("Muscle involvement tier A, 82 modelled overall match");
    expect(element.getAttribute("title")).toBe("Muscle involvement tier A · 82 modelled overall match");
  });
});
