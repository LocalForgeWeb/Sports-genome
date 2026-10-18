import { backView } from "./back.mjs";
import { palmView } from "./palm.mjs";
import { thumbView } from "./thumb.mjs";

/**
 * Every view's layers, as authored: each path carries a node abbreviation (`node`) or a
 * structure word (`structure`), its kind and its outline. asset.mjs turns these into ids.
 */
export function buildViews() {
  return { palm: palmView(), back: backView(), thumb: thumbView() };
}
