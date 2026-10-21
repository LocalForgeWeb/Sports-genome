import { useId } from "react";

/**
 * A small drawing of a joint action beside its words in the muscle sheet (brief §6, "What it
 * does" with a small wrist/finger/rotation diagram): two segments and an arrow, read from the
 * action's own id, so any region's actions get one. Decorative: the words say it all.
 */
export type ActionGlyphKind = "bend" | "straighten" | "rotate" | "tilt" | "steady";

export function actionGlyphKind(actionId: string): ActionGlyphKind {
  if (/pronation|supination|rotation/.test(actionId)) return "rotate";
  if (/deviation|abduction|adduction/.test(actionId)) return "tilt";
  if (/extension/.test(actionId)) return "straighten";
  if (/flexion/.test(actionId)) return "bend";
  return "steady";
}

export function ActionGlyph({ actionId }: { actionId: string }) {
  const kind = actionGlyphKind(actionId);
  const arrowId = `${useId().replace(/:/g, "")}-arrow`;
  return <svg className="spz-glyph" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true" focusable="false" data-kind={kind}>
    <defs>
      <marker id={arrowId} viewBox="0 0 6 6" refX="3" refY="3" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 6 3 0 6z" fill="currentColor" /></marker>
    </defs>
    {kind === "bend" && <>
      <path d="M10 4v13l10 7" className="spz-glyph-limb" />
      <path d="M22 13a9 9 0 0 1 2 8" className="spz-glyph-arrow" markerEnd={`url(#${arrowId})`} />
    </>}
    {kind === "straighten" && <>
      <path d="M12 4v13l2 11" className="spz-glyph-limb" />
      <path d="M23 26a10 10 0 0 0-2-9" className="spz-glyph-arrow" markerEnd={`url(#${arrowId})`} />
    </>}
    {kind === "rotate" && <>
      <path d="M16 3v26" className="spz-glyph-limb" />
      <path d="M6 18a10 4 0 1 0 6-5" className="spz-glyph-arrow" markerEnd={`url(#${arrowId})`} />
    </>}
    {kind === "tilt" && <>
      <path d="M16 3v15l5 10" className="spz-glyph-limb" />
      <path d="M10 26q-2-5 1-8" className="spz-glyph-arrow" markerEnd={`url(#${arrowId})`} />
      <path d="M26 20q1 4-1 7" className="spz-glyph-arrow" markerEnd={`url(#${arrowId})`} />
    </>}
    {kind === "steady" && <>
      <path d="M16 6v20" className="spz-glyph-limb" />
      <path d="M5 16h6M27 16h-6" className="spz-glyph-arrow" markerEnd={`url(#${arrowId})`} />
    </>}
  </svg>;
}
