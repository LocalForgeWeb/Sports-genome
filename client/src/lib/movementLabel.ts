/**
 * How a sport action's name reads on screen.
 *
 * The movement data stores labels as written by the research side - lower case, and with
 * slashes that are sometimes spaced and sometimes not ("overhook/whizzer",
 * "upper-body throw / hip-toss pattern"). Stored labels are also matched and lower-cased to
 * build sentences elsewhere, so they are never rewritten; only what is displayed changes:
 * sentence case, and one space either side of a slash so a long name wraps at a word
 * boundary instead of inside "overhook/whizzer" (Sep 28 regression brief §3, §10).
 */
export function movementDisplayLabel(label: string): string {
  const spaced = label.trim().replace(/\s*\/\s*/g, " / ").replace(/\s{2,}/g, " ");
  return spaced ? spaced.charAt(0).toUpperCase() + spaced.slice(1) : spaced;
}
