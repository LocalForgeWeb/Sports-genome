// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const feedback = vi.hoisted(() => ({ emit: vi.fn() }));
vi.mock("@/lib/interactionFeedback", () => ({ emitInteractionFeedback: feedback.emit }));
vi.mock("@/lib/trpc", () => ({ trpc: { useUtils: () => ({}), strengthGenome: {} } }));

import { StrengthObservationReviewButton } from "./StrengthGenomePanel";

describe("Strength observation Review action", () => {
  afterEach(() => { feedback.emit.mockReset(); document.body.innerHTML = ""; });

  it("gives optional feedback and passes the saved observation into the region-detail opener", () => {
    const observation = { id: "local-1", exerciseName: "Preacher Curl", observedAt: "2026-08-28T12:00:00.000Z", measurementType: "MULTI_REP", loadKg: 36, repetitions: 10 };
    const onReview = vi.fn();
    render(React.createElement(StrengthObservationReviewButton, { observation, onReview }));
    expect(screen.getByRole("button", { name: "Review" }).className).toContain("strength-observation-review");
    fireEvent.click(screen.getByRole("button", { name: "Review" }));
    expect(feedback.emit).toHaveBeenCalledTimes(1);
    expect(onReview).toHaveBeenCalledWith(observation);
  });
});
