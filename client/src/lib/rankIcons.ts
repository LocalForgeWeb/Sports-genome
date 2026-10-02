/**
 * The approved rank badges as the browser fetches them.
 *
 * Two runtime files per rank, both cut from the same master by design/rank-icons/build.py:
 * 384 px for the rank card and any featured use, 128 px for compact rows and the legend. The
 * browser chooses between them from the CSS size and the screen density, so a 32 px row on a
 * 3x phone gets the 128 and a 64 px card on a 2x phone gets the 384 - never the 1.5 MB master.
 */
export const RANK_ICON_WIDTHS = { compact: 128, full: 384 } as const;

/** The 128 px sibling of a rank's 384 px file: `/rank-icons/jv.webp` -> `/rank-icons/jv-128.webp`. */
export function rankIconCompactSrc(iconSrc: string): string {
  return iconSrc.replace(/\.webp$/, `-${RANK_ICON_WIDTHS.compact}.webp`);
}

export function rankIconSources(iconSrc: string): { src: string; srcSet: string } {
  return {
    src: iconSrc,
    srcSet: `${rankIconCompactSrc(iconSrc)} ${RANK_ICON_WIDTHS.compact}w, ${iconSrc} ${RANK_ICON_WIDTHS.full}w`,
  };
}
