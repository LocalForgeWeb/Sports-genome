/**
 * Which build this is.
 *
 * Reported as "I'm not seeing these changes on the hosted site" when the
 * deployment was current and the served bundle was byte-identical to the build.
 * There was no way to tell from the device which build it had, so the question
 * could not be answered from either end.
 *
 * Vercel keeps every past deployment at its own permanent URL. A link or a
 * home-screen icon saved from one of those is pinned to that build for good, no
 * matter how many times the production alias moves - which looks exactly like a
 * deploy that did not happen.
 */

declare const __SG_BUILD__: { commit: string; builtAt: string } | undefined;

export type BuildStamp = { commit: string; builtAt: string };

const unknown: BuildStamp = { commit: "unknown", builtAt: "" };

export function buildStamp(): BuildStamp {
  try {
    return typeof __SG_BUILD__ === "undefined" ? unknown : __SG_BUILD__;
  } catch {
    return unknown;
  }
}

/** A short, readable line: "Build a1b2c3d · 19 Sep 2026". */
export function buildStampLabel(stamp: BuildStamp = buildStamp()): string {
  if (stamp.commit === "unknown") return "Build unknown";
  const when = stamp.builtAt ? new Date(stamp.builtAt) : null;
  const date = when && !Number.isNaN(when.getTime())
    ? when.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
    : "";
  return date ? `Build ${stamp.commit} · ${date}` : `Build ${stamp.commit}`;
}
