/**
 * The page behind a modal layer that is rendered inside the page's own tree.
 *
 * The Strength record sheet lives in <main>, beside the figure that opens it, so
 * `inert` on <main> would take the sheet with it. Instead every sibling of the
 * layer, and of each of its ancestors up to <body>, is made inert: the figure,
 * the rest of the page, the header and the bottom navigation. Nothing behind the
 * sheet can be tapped, tabbed to or read out while it is open.
 *
 * Kept as they are: the elements passed in `keep` (the sheet's own scrim, which
 * has to hear the tap that dismisses it) and the app's live regions (the
 * toaster), so a save made from inside the sheet is still announced.
 *
 * The body is pinned at its scroll offset, the way the add-exercises sheet does
 * it: iOS ignores `overflow: hidden` on the body. Release puts the offset back,
 * undoes only what this call did, and is safe to call twice.
 */
export function holdPageBehind(layer: Element, keep: readonly (Element | null)[] = []): () => void {
  const madeInert: Element[] = [];
  for (let node: Element = layer; node.parentElement && node !== document.body; node = node.parentElement) {
    for (const sibling of Array.from(node.parentElement.children)) {
      if (sibling === node || keep.includes(sibling) || sibling.hasAttribute("inert") || sibling.matches(untouchedSelector)) continue;
      sibling.setAttribute("inert", "");
      madeInert.push(sibling);
    }
  }
  const body = document.body;
  const scrollY = window.scrollY;
  const previous = { position: body.style.position, top: body.style.top, left: body.style.left, right: body.style.right, width: body.style.width, overflow: body.style.overflow };
  body.style.position = "fixed";
  body.style.top = `-${scrollY}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";
  body.style.overflow = "hidden";
  let held = true;
  return () => {
    if (!held) return;
    held = false;
    madeInert.forEach((element) => element.removeAttribute("inert"));
    Object.assign(body.style, previous);
    window.scrollTo(0, scrollY);
  };
}

/** The toaster's region and any other live region that speaks for the whole app, and what never renders. */
const untouchedSelector = "[aria-live], [data-sonner-toaster], script, style, template";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "summary",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

/** Inside a closed <details>, only its own summary can be reached. */
function hiddenByDetails(element: HTMLElement): boolean {
  for (let details = element.parentElement?.closest("details"); details; details = details.parentElement?.closest("details")) {
    if (!details.open && !(element.tagName === "SUMMARY" && element.parentElement === details)) return true;
  }
  return false;
}

/** What Tab can reach inside a layer, in order, for keeping focus within it. */
export function focusableWithin(layer: Element): HTMLElement[] {
  return Array.from(layer.querySelectorAll<HTMLElement>(focusableSelector))
    .filter((element) => !element.closest("[inert], [hidden], [aria-hidden='true']") && !hiddenByDetails(element));
}

/**
 * Keeps Tab and Shift+Tab inside `layer`, wrapping at either end. A heading that
 * holds focus only on open (tabindex -1) counts as the start of the layer.
 * Returns true when it moved focus itself.
 */
export function trapTabWithin(event: KeyboardEvent, layer: Element): boolean {
  if (event.key !== "Tab") return false;
  const focusable = focusableWithin(layer);
  const active = document.activeElement;
  const inside = active instanceof Node && layer.contains(active);
  if (!focusable.length) { event.preventDefault(); return true; }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const index = inside ? focusable.indexOf(active as HTMLElement) : -1;
  if (!inside) { event.preventDefault(); (event.shiftKey ? last : first).focus(); return true; }
  if (event.shiftKey && index <= 0) { event.preventDefault(); last.focus(); return true; }
  if (!event.shiftKey && index === focusable.length - 1) { event.preventDefault(); first.focus(); return true; }
  return false;
}
