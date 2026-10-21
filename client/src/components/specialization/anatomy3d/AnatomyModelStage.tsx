import { Component, Suspense, lazy, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AnatomyModelConfig } from "./modelIdentity";
import type { CanvasFailure, CanvasStatus } from "./modelTypes";

/**
 * The 3D view's stage (SG-FOREARM-INTEGRATION-20261019 §6–§8): a box of fixed height that
 * holds the canvas, its loading and error states, and the Overview control. The box is the
 * same size before, during and after loading, so nothing on the page moves when the model
 * arrives. three.js and the model load only when this stage is on screen (a lazy chunk), and
 * only on the specialization page.
 *
 * Failures are told apart (§8): no WebGL (the drawing and the list stand in), a model or
 * decoder that did not load, or a lost context (both can be retried). The muscle list and
 * the row of muscles above it work throughout: they never depend on the canvas.
 */

const loadView = () => import("./ForearmModelView");

/** Whether this browser can make a WebGL context at all. Checked once, without keeping a context. */
export function webglAvailable(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (typeof (window as unknown as { WebGLRenderingContext?: unknown }).WebGLRenderingContext === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const context = (canvas.getContext("webgl2") ?? canvas.getContext("webgl")) as WebGLRenderingContext | null;
    if (!context) return false;
    context.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** The athlete's reduced-motion setting, kept current while the page is open. */
export function usePrefersReducedMotion(): boolean {
  const query = "(prefers-reduced-motion: reduce)";
  const [reduced, setReduced] = useState(() => (typeof window !== "undefined" && typeof window.matchMedia === "function" ? window.matchMedia(query).matches : false));
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const list = window.matchMedia(query);
    const onChange = () => setReduced(list.matches);
    onChange();
    list.addEventListener?.("change", onChange);
    return () => list.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

/** Catches a 3D chunk that failed to download or a canvas that threw, so the page around it stays. */
class ModelBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: unknown) {
    console.error("Forearm anatomy: the 3D view failed", error);
    this.props.onError();
  }
  render() { return this.state.failed ? null : this.props.children; }
}

type StageStatus = { status: CanvasStatus; failure?: CanvasFailure };

export function AnatomyModelStage({ config, selectedNodeId, selected, label, onSelect, onShowDrawing }: {
  config: AnatomyModelConfig;
  selectedNodeId: string | null;
  /** The selected muscle's name and layer, shown on the model as the supplied demo did; null for the whole region. */
  selected: { name: string; layer: string } | null;
  /** What the canvas shows, for a screen reader: the region and the selection. */
  label: string;
  onSelect: (nodeId: string) => void;
  onShowDrawing: () => void;
}) {
  const webgl = useMemo(() => webglAvailable(), []);
  const reducedMotion = usePrefersReducedMotion();
  // Each attempt is a fresh lazy component and a fresh canvas: a retry downloads a failed chunk
  // again and builds a new WebGL context, after the old one was disposed.
  const [attempt, setAttempt] = useState(0);
  const View = useMemo(() => lazy(loadView), [attempt]);
  const [stage, setStage] = useState<StageStatus>(webgl ? { status: "loading" } : { status: "error", failure: "webgl" });
  const retry = () => { setStage({ status: "loading" }); setAttempt((value) => value + 1); };

  const failure = stage.status === "error" ? stage.failure ?? "model" : null;
  return <div className="sg-anatomy3d-stage" data-status={stage.status} data-failure={failure ?? undefined}>
    <div className="sg-anatomy3d-grid" aria-hidden="true" />
    {webgl && <ModelBoundary key={attempt} onError={() => setStage({ status: "error", failure: "model" })}>
      <Suspense fallback={null}>
        <View
          config={config}
          selectedNodeId={selectedNodeId}
          side="right"
          reducedMotion={reducedMotion}
          label={label}
          onSelect={onSelect}
          onStatusChange={(status, why) => setStage({ status, failure: why })}
        />
      </Suspense>
    </ModelBoundary>}
    {stage.status !== "ready" && stage.status !== "error" && <div className="sg-anatomy3d-overlay" role="status">
      <span className="sg-anatomy3d-ring" aria-hidden="true" />
      <span>Preparing the 3D forearm…</span>
    </div>}
    {failure && <div className="sg-anatomy3d-overlay sg-anatomy3d-failed" role="alert">
      <p>{failure === "webgl"
        ? "This browser cannot show the 3D model: WebGL is off or not available."
        : failure === "context-lost"
          ? "The device reset the 3D view."
          : "The 3D model did not load."}</p>
      <p className="sg-anatomy3d-small">The row above and the list below still have every muscle and its numbers.</p>
      <div className="sg-anatomy3d-actions">
        {failure !== "webgl" && <button type="button" className="sg-anatomy3d-button" onClick={retry}>{failure === "context-lost" ? "Reload the model" : "Try again"}</button>}
        <button type="button" className="sg-anatomy3d-button sg-anatomy3d-button-quiet" onClick={onShowDrawing}>Show the drawing</button>
      </div>
    </div>}
    {stage.status === "ready" && selected && <div className="sg-anatomy3d-selected" aria-hidden="true">
      <small>Selected structure</small>
      <b>{selected.name}</b>
      <small>{selected.layer}</small>
    </div>}
  </div>;
}
