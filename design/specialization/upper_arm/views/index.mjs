import { backView } from "./back.mjs";
import { frontView } from "./front.mjs";

/**
 * Every view's layers, as authored: each path carries a node's short name (`node`) or a
 * structure word (`structure`), its kind and its outline. The shared asset.mjs turns these into ids.
 */
export function buildViews() {
  return { front: frontView(), back: backView() };
}
