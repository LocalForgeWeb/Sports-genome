/**
 * The viewer's own types (from the handoff's src/anatomy/types.ts, the parts the canvas
 * uses). `MuscleId` is a viewer *source* id ("flexor-carpi-ulnaris"), never a canonical atlas
 * id ("forearm.fcu"); `modelIdentity.ts` is the only place one becomes the other.
 */
export type MuscleId = string;
export type Side = "left" | "right";

export interface MuscleManifestEntry {
  id: MuscleId;
  displayName: string;
  meshNames: string[];
  layer: "outer" | "superficial" | "deep";
  group: "landmark" | "flexors" | "extensors";
  cameraPreset: string;
  revealPreset: string;
}

export type CanvasStatus = "idle" | "loading" | "ready" | "error";

/**
 * Why the 3D view is not showing, so the page can say which and offer the right way back:
 * a model or decoder that did not load can be retried; a browser without WebGL cannot.
 */
export type CanvasFailure = "webgl" | "model" | "context-lost";
