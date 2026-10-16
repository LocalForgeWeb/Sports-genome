import type { DiagramAsset, DiagramLayerId, DiagramViewId } from "@shared/specialization/types";
import type { DiagramFill } from "./model";

/**
 * The renderer contract (02-design.md §12). Any drawing of a region (this SVG renderer, or a
 * 3D viewer later) takes these props and reads node ids only.
 *
 * Placeholder until the diagram lane lands its renderer: it says the drawing is not ready,
 * and the muscle list below it carries every selection on its own.
 */
export type SpecializationDiagramProps = {
  asset: DiagramAsset;
  view: DiagramViewId;
  layer: DiagramLayerId;
  /** The left arm: the drawing flips, its text does not. */
  mirrored: boolean;
  fillFor: (nodeId: string) => DiagramFill;
  selectedNodeId: string | null;
  onSelect: (nodeId: string) => void;
  labelFor: (nodeId: string) => string;
  describeFor?: (nodeId: string) => string;
  caption?: string;
};

export function SpecializationDiagram({ caption }: SpecializationDiagramProps) {
  return <p className="spz-note">{caption ?? "The drawing is not available yet. Choose a muscle from the list."}</p>;
}
