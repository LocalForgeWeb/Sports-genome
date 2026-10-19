/**
 * Browser entry for render-evidence.mjs: draws the real SpecializationDiagram for each figure the
 * script asks for, on a card like the page's, at phone width. Not part of the app.
 *
 * The region comes from the page (`window.EVIDENCE`): its id and the export of the region's data
 * module, which the script bundles in as `@evidence/region` (the module its config names).
 */
import { createRoot } from "react-dom/client";
import "@/components/anatomy/anatomy-figure.css";
import { SpecializationDiagram } from "@/components/specialization/SpecializationDiagram";
import type { DiagramFill } from "@/components/specialization/model";
import type { DiagramLayerId, DiagramViewId, SpecializationRegionData } from "@shared/specialization/types";
// @ts-expect-error The alias is set by render-evidence.mjs when it bundles this file.
import * as regionModule from "@evidence/region";

type Figure = { id: string; title: string; view: DiagramViewId; layer: DiagramLayerId; mirrored: boolean; selected: string | null; fills: Record<string, DiagramFill>; caption: string };
type Evidence = { region: string; export: string; figures: Figure[] };

const evidence = (window as unknown as { EVIDENCE: Evidence }).EVIDENCE;
const data = (regionModule as Record<string, SpecializationRegionData | undefined>)[evidence.export];
if (!data?.diagram || data.region.id !== evidence.region) throw new Error(`${evidence.export} is not ${evidence.region}'s data with a drawing`);
const asset = data.diagram;
const nodeById = new Map(data.nodes.map((node) => [node.id, node] as const));

function Page() {
  return (
    <main className="evidence">
      {evidence.figures.map((figure) => (
        <section key={figure.id} id={figure.id} className="evidence-card">
          <h2>{figure.title}</h2>
          <SpecializationDiagram
            asset={asset}
            view={figure.view}
            layer={figure.layer}
            mirrored={figure.mirrored}
            nodes={data!.nodes}
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
