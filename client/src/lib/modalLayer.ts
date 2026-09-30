/**
 * Whether a key press is meant for a different modal layer than `ownLayer`.
 *
 * Layers over the app listen for Escape and Tab on the window in the capture
 * phase, so they hear every key press, including ones meant for a layer opened
 * over them: the universal search opens over anything with Cmd/Ctrl+K. A layer
 * that acted on those would close underneath the one in front, or pull focus
 * out of it. The layer that holds focus is the one the key is for, so a layer
 * steps aside when focus sits inside another modal, including one nested in it.
 */
export function isKeyForAnotherLayer(event: KeyboardEvent, ownLayer: Element | null): boolean {
  const target = event.target instanceof Element ? event.target : null;
  const layer = target?.closest('[aria-modal="true"]');
  return Boolean(layer && layer !== ownLayer);
}
