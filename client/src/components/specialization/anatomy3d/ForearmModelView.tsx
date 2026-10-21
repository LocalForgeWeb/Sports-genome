import { ForearmCanvas } from "./ForearmCanvas";
import { canonicalForModelSource, modelSourceForCanonical, type AnatomyModelConfig } from "./modelIdentity";
import type { CanvasFailure, CanvasStatus } from "./modelTypes";

/**
 * The lazily loaded part of the 3D view: three.js, the loaders and the canvas. It speaks
 * canonical atlas ids to the page and the model's source ids to the canvas, through
 * `modelIdentity` only. A muscle the model does not draw (biceps, an unknown id) is sent to
 * the canvas as no selection, so the canvas shows the whole forearm and never the last muscle.
 */
export default function ForearmModelView({ config, selectedNodeId, side, reducedMotion, label, onSelect, onStatusChange }: {
  config: AnatomyModelConfig;
  selectedNodeId: string | null;
  side: "left" | "right";
  reducedMotion: boolean;
  label: string;
  onSelect: (nodeId: string) => void;
  onStatusChange: (status: CanvasStatus, failure?: CanvasFailure) => void;
}) {
  return <ForearmCanvas
    modelUrl={config.modelUrl}
    decoderPath={config.decoderPath}
    selectedMuscleId={modelSourceForCanonical(selectedNodeId)}
    side={side}
    reducedMotion={reducedMotion}
    label={label}
    onMuscleSelect={(sourceId) => {
      const nodeId = canonicalForModelSource(sourceId);
      if (nodeId) onSelect(nodeId);
    }}
    onStatusChange={onStatusChange}
  />;
}
