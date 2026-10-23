import type { Contribution, NodeId, SpecializationRegionData, SpecializationSummary } from "./types";

/**
 * The one count of direct work (docs/specialization-atlas, note 11, §3.3):
 * the number the stack designer's total is in, and the number the page's window line and the 3D
 * panel show beside it, so all three read one function.
 *
 * - **Direct moving sets**: the distinct bouts in the summary with a part that is a reviewed
 *   `relationship: direct` mapping read as `direct_dynamic` on one of the region's own target
 *   muscles, a `mixed` contribution with such a part included. Each bout counts once however many
 *   muscles it credits; a summary that counts both sides as one (`both`) counts a one-sided set
 *   once, as the plan writes one bout per planned set.
 * - **Holds**, a second number never added in: the distinct bouts with a reviewed direct part read
 *   as `deliberate_isometric` and no moving part, with their recorded seconds (once per bout) and
 *   the count with no time recorded. A contributing hold is neither (it stays on the muscle, as the
 *   page shows it); grip, steadying and helper work are in neither number.
 *
 * Only counted rows are read: a summary's contributions are its reviewed, credited mappings
 * (drafts and strapped grip are `notCounted`), and a per-side summary's rows kept apart with no side
 * (`countedSide: "unknown"`) are left out. Nothing here names a side.
 */

export interface DirectHoldCount {
  /** Distinct hold bouts. */
  bouts: number;
  /** Their ids, each once, in id order. */
  boutIds: string[];
  /** Seconds recorded or planned, summed once per bout. */
  seconds: number;
  /** Hold bouts with no time recorded: never read as 0 s or an assumed time. */
  withoutTime: number;
}

export interface DirectWorkCount {
  /** Distinct bouts with direct moving work on one of the region's own target muscles. */
  moving: number;
  /** Their ids, each once, in id order. */
  movingBoutIds: string[];
  holds: DirectHoldCount;
  /** The region's own target muscles with direct moving work in the summary, in the region's order. */
  musclesWithMovingWork: NodeId[];
  /** How many own target muscles the region has (the "of 19"). */
  ownTargetMuscles: number;
}

type Part = Contribution["parts"][number];

/** Direct moving work: a direct mapping the calculator reads as direct dynamic. */
export const isDirectMovingPart = (part: Pick<Part, "relationship" | "category">): boolean => part.relationship === "direct" && part.category === "direct_dynamic";
/** A direct hold: a direct mapping read as a deliberate hold (a contributing hold is not one). */
export const isDirectHoldPart = (part: Pick<Part, "relationship" | "category">): boolean => part.relationship === "direct" && part.category === "deliberate_isometric";

/** The region's own target muscles: listed with the role `target` and at home in the region. */
export function ownTargetNodeIds(region: SpecializationRegionData): NodeId[] {
  return region.nodes.filter((node) => node.role === "target" && node.regionId === region.region.id).map((node) => node.id);
}

/** Seconds once per bout from its segments; null when no segment recorded a time. */
function boutSeconds(contribution: Contribution): number | null {
  const recorded = contribution.segments.map((segment) => segment.holdSeconds).filter((value): value is number => value !== null && Number.isFinite(value) && value > 0);
  return recorded.length ? recorded.reduce((total, value) => total + value, 0) : null;
}

export function directWorkCount(region: SpecializationRegionData, summary: SpecializationSummary): DirectWorkCount {
  const own = ownTargetNodeIds(region);
  const ownSet = new Set(own);
  const moving = new Set<string>();
  const holdSeconds = new Map<string, number | null>();
  const musclesWithMoving = new Set<NodeId>();
  for (const node of summary.nodes) {
    if (!ownSet.has(node.nodeId)) continue;
    for (const contribution of node.contributions) {
      if (contribution.countedSide === "unknown") continue;
      if (contribution.parts.some(isDirectMovingPart)) {
        moving.add(contribution.boutId);
        musclesWithMoving.add(node.nodeId);
      } else if (contribution.parts.some(isDirectHoldPart) && !holdSeconds.has(contribution.boutId)) {
        holdSeconds.set(contribution.boutId, boutSeconds(contribution));
      }
    }
  }
  // A bout with a moving part anywhere is moving work, never also a hold.
  for (const boutId of Array.from(moving)) holdSeconds.delete(boutId);
  const order = (ids: Iterable<string>) => Array.from(ids).sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
  const holdIds = order(holdSeconds.keys());
  return {
    moving: moving.size,
    movingBoutIds: order(moving),
    holds: {
      bouts: holdIds.length,
      boutIds: holdIds,
      seconds: holdIds.reduce((total, id) => total + (holdSeconds.get(id) ?? 0), 0),
      withoutTime: holdIds.filter((id) => holdSeconds.get(id) === null).length,
    },
    musclesWithMovingWork: own.filter((id) => musclesWithMoving.has(id)),
    ownTargetMuscles: own.length,
  };
}
