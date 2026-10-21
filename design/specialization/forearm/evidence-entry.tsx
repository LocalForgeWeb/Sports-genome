/**
 * Browser entry for render-evidence.mjs: draws the real SpecializationDiagram for each
 * figure the script asks for, on a card like the page's, at phone width. Not part of the app.
 */
import { createRoot } from "react-dom/client";
import "@/components/anatomy/anatomy-figure.css";
import { SpecializationDiagram } from "@/components/specialization/SpecializationDiagram";
import type { DiagramFill } from "@/components/specialization/model";
import { forearmRegionData } from "@shared/specialization/regions/forearm";
import type { DiagramLayerId, DiagramViewId } from "@shared/specialization/types";

type Figure = { id: string; title: string; view: DiagramViewId; layer: DiagramLayerId; mirrored: boolean; selected: string | null; fills: Record<string, DiagramFill>; caption: string };

const figures = (window as unknown as { FIGURES: Figure[] }).FIGURES;
const asset = forearmRegionData.diagram!;
const nodeById = new Map(forearmRegionData.nodes.map((node) => [node.id, node] as const));

function Page() {
  return (
    <main className="evidence">
      {figures.map((figure) => (
        <section key={figure.id} id={figure.id} className="evidence-card">
          <h2>{figure.title}</h2>
          <SpecializationDiagram
            asset={asset}
            view={figure.view}
            layer={figure.layer}
            mirrored={figure.mirrored}
            fillFor={(id) => figure.fills[id] ?? { kind: "none" }}
            selectedNodeId={figure.selected}
            onSelect={() => {}}
            labelFor={(id) => nodeById.get(id)?.shortName ?? id}
            describeFor={(id) => nodeById.get(id)?.name ?? id}
            caption={figure.caption}
          />
        </section>
      ))}
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<Page />);
