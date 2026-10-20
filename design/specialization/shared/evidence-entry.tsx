/**
 * Browser entry for render-evidence.mjs: draws the real SpecializationDiagram for each figure the
 * script asks for, on a card like the page's, at phone width. Not part of the app.
 *
 * Everything it draws comes from the page (`window.EVIDENCE`): the asset the script built from the
 * region's views, checked equal to the committed diagram.generated.ts, and the region's members.
 * It imports no region, so the gate measures exactly the drawing it was run on.
 */
import { createRoot } from "react-dom/client";
import "@/components/anatomy/anatomy-figure.css";
import { SpecializationDiagram } from "@/components/specialization/SpecializationDiagram";
import type { DiagramNode } from "@/components/specialization/diagramGeometry";
import type { DiagramFill } from "@/components/specialization/model";
import type { DiagramAsset, DiagramLayerId, DiagramViewId } from "@shared/specialization/types";

type Figure = { id: string; title: string; view: DiagramViewId; layer: DiagramLayerId; mirrored: boolean; selected: string | null; fills: Record<string, DiagramFill>; caption: string };
type Member = DiagramNode & { name: string; shortName: string };
type Evidence = { region: string; asset: DiagramAsset; members: Member[]; figures: Figure[] };

const evidence = (window as unknown as { EVIDENCE: Evidence }).EVIDENCE;
const { asset, members } = evidence;
if (asset.regionId !== evidence.region) throw new Error(`The asset is ${asset.regionId}'s, not ${evidence.region}'s`);
const nodeById = new Map(members.map((node) => [node.id, node] as const));

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
            nodes={members}
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
