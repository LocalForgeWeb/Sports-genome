import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LaunchExperience } from "./LaunchExperience";

function FirstEntryHarness() {
  return createElement("main", null, createElement("button", { type: "button" }, "Open Training Day"), createElement(LaunchExperience, { onFinish: () => undefined }));
}

describe("automatic first-entry launch rendering", () => {
  it("keeps the primary workspace action mounted beside a compact, non-modal automatic launch panel", () => {
    const markup = renderToStaticMarkup(createElement(FirstEntryHarness));
    expect(markup).toContain("Open Training Day");
    expect(markup).toContain("launch-experience-underlay");
    expect(markup).toContain("Skip intro");
    expect(markup).not.toContain('role="dialog"');
  });
});
