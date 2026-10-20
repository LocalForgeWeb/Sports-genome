import { useEffect, useRef } from "react";
import type { AnatomyNode, SpecializationRegionData } from "@shared/specialization/types";
import { layerLabels } from "../model";
import { SpecializationSheet } from "../SpecializationSheet";
import { modelSourceForCanonical } from "./modelIdentity";

/**
 * Choose muscle (SG-FOREARM-INTEGRATION-20261019 §4, §6): every muscle the page can show, in
 * a sheet over the page rather than a list between the model and its numbers, and the way to
 * reach a muscle that is small, deep or hidden on the model. Grouped by compartment; the
 * upper-arm muscles credited here are listed too, marked as not in the 3D model.
 *
 * Back closes it first: opening adds a history entry with the same address, so the browser's
 * Back (or a phone's back gesture) pops that entry and closes the sheet instead of leaving
 * the page. Closing it any other way, or choosing a muscle, pops the entry the same way, so
 * no stray entry is left behind; a choice is applied once the page's own entry is back.
 */
export function ChooseMuscleSheet({ data, nodes, selectedId, valueFor, onChoose, onOverview, onClose }: {
  data: SpecializationRegionData;
  nodes: readonly AnatomyNode[];
  selectedId: string | null;
  /** The short number beside each muscle ("4 direct"), or the reason there is none. */
  valueFor: (nodeId: string) => string;
  onChoose: (nodeId: string) => void;
  onOverview: () => void;
  onClose: () => void;
}) {
  const pending = useRef<{ kind: "choose"; nodeId: string } | { kind: "overview" } | { kind: "close" } | null>(null);
  const pushed = useRef(false);
  const actions = useRef({ onChoose, onOverview, onClose });
  actions.current = { onChoose, onOverview, onClose };

  useEffect(() => {
    const finish = () => {
      const next = pending.current ?? { kind: "close" as const };
      pending.current = null;
      if (next.kind === "choose") actions.current.onChoose(next.nodeId);
      else if (next.kind === "overview") actions.current.onOverview();
      actions.current.onClose();
    };
    const onPop = () => {
      if (!pushed.current) return;
      pushed.current = false;
      finish();
    };
    window.history.pushState({ ...(window.history.state ?? {}), spzPicker: true }, "", window.location.href);
    pushed.current = true;
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      // Unmounted some other way (the page left): drop the picker's entry if it is still on top.
      if (pushed.current && window.history.state?.spzPicker) window.history.back();
      pushed.current = false;
    };
  }, []);

  const leave = (next: NonNullable<typeof pending.current>) => {
    pending.current = next;
    if (pushed.current && window.history.state?.spzPicker) window.history.back();
    else {
      pushed.current = false;
      if (next.kind === "choose") onChoose(next.nodeId);
      else if (next.kind === "overview") onOverview();
      onClose();
    }
  };

  const groups = [
    { id: "anterior", title: "Palm side (flexors and pronators)", nodes: nodes.filter((node) => node.role === "target" && node.parentId === "forearm.anterior") },
    { id: "posterior", title: "Back and thumb side (extensors and supinator)", nodes: nodes.filter((node) => node.role === "target" && node.parentId !== "forearm.anterior") },
    { id: "adjacent", title: "Nearby", nodes: nodes.filter((node) => node.role === "adjacent") },
    { id: "external", title: data.region.wording.externalGroup, nodes: nodes.filter((node) => node.role === "external") },
  ].filter((group) => group.nodes.length);

  return <SpecializationSheet id="sg-anatomy3d-picker" eyebrow={`${data.region.label} · ${nodes.length} muscles`} title="Choose muscle" onClose={() => leave({ kind: "close" })}>
    <div className="sg-anatomy3d-picker">
      <ul>
        <li><button type="button" className="sg-anatomy3d-pick" aria-pressed={selectedId === null} onClick={() => leave({ kind: "overview" })}>
          <span><b>Whole {data.region.label.toLowerCase()}</b><small>Overview, no muscle selected</small></span>
        </button></li>
      </ul>
      {groups.map((group) => <div key={group.id}>
        <h3>{group.title}</h3>
        <ul>
          {group.nodes.map((node) => {
            const inModel = modelSourceForCanonical(node.id) !== null;
            return <li key={node.id}>
              <button type="button" className="sg-anatomy3d-pick" aria-pressed={node.id === selectedId} onClick={() => leave({ kind: "choose", nodeId: node.id })} aria-label={`${node.name}, ${layerLabels[node.layer]}${inModel ? "" : ", not in the 3D model"}. ${valueFor(node.id)}`}>
                <span><b>{node.name}</b><small>{node.shortName} · {layerLabels[node.layer]}{inModel ? "" : " · not in the 3D model"}</small></span>
                <span className="sg-anatomy3d-pick-value">{valueFor(node.id)}</span>
              </button>
            </li>;
          })}
        </ul>
      </div>)}
    </div>
  </SpecializationSheet>;
}
