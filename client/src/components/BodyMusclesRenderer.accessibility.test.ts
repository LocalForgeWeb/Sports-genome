// @vitest-environment jsdom
import { fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BodyChart, ViewSide } from "body-muscles";

describe("body-muscles renderer accessibility contract", () => {
  afterEach(() => { document.body.innerHTML = ""; });

  it("renders real muscle paths as keyboard-addressable buttons and activates on Enter", () => {
    const onMuscleClick = vi.fn();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const chart = new BodyChart(container, { view: ViewSide.FRONT, bodyState: {}, onMuscleClick });
    const muscle = container.querySelector<SVGPathElement>(".body-chart-muscle")!;

    expect(muscle).toBeTruthy();
    expect(muscle.getAttribute("role")).toBe("button");
    expect(muscle.getAttribute("tabindex")).toBe("0");
    expect(muscle.querySelector("title")?.textContent).toBeTruthy();
    fireEvent.keyDown(muscle, { key: "Enter" });
    expect(onMuscleClick).toHaveBeenCalledTimes(1);
    chart.destroy();
  });
});
