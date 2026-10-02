/**
 * Landing on a place inside a workspace, not just on the workspace.
 *
 * Search results can name `workspace#anchor`. The workspace behind the anchor is
 * lazily loaded and mounts a frame or two after the navigation, so a single
 * `getElementById` immediately after it finds nothing - hence the bounded poll
 * rather than one lookup or an arbitrary timeout.
 *
 * Focus rather than scroll alone: the interaction contract's §11 requires focus
 * to return near the triggering object, and a page that has merely scrolled
 * leaves a keyboard or screen-reader user at the top of it with no idea anything
 * moved. `preventScroll` keeps the smooth scroll from being cut short by the
 * browser's own jump to the focused element.
 */

export const anchorPollIntervalMs = 60;
export const anchorPollCeilingMs = 1_500;

export function revealWorkspaceAnchor(
  anchorId: string,
  { document: doc = globalThis.document, ceilingMs = anchorPollCeilingMs }: { document?: Document; ceilingMs?: number } = {}
): () => void {
  if (!anchorId || !doc) return () => undefined;
  const startedAt = Date.now();
  let timer = 0;

  const attempt = () => {
    const element = doc.getElementById(anchorId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      // The anchor is a section rather than a control, so it carries
      // tabindex="-1" and is focusable only programmatically.
      (element as HTMLElement).focus?.({ preventScroll: true });
      return;
    }
    if (Date.now() - startedAt >= ceilingMs) return;
    timer = (globalThis.setTimeout as typeof setTimeout)(attempt, anchorPollIntervalMs) as unknown as number;
  };

  timer = (globalThis.setTimeout as typeof setTimeout)(attempt, 0) as unknown as number;
  return () => globalThis.clearTimeout(timer);
}
