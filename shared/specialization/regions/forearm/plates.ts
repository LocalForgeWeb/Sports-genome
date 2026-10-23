import type { DiagramPlates, NodeId } from "../../types";
import { forearmAdjacentIds, forearmMuscleIds as m, FOREARM_REGION_ID } from "./ids";
import { forearmPlateFrame, forearmPlatePasses } from "./plates.generated";

/**
 * The forearm's Drawing: the owner's rendered plates (23 Oct 2026; design/specialization/forearm-plates/,
 * docs/specialization-atlas/08-diagram.md "Plates"). Six passes (three views, each at surface and
 * deep), built from the package by `build_plates.py` into `plates.generated.ts`; the SVG schematic
 * (`diagram.generated.ts`) stays the region's seeded drawing and the drawing of any region without plates.
 *
 * Which package muscle is which atlas node: one explicit row per slug, written out by hand, the
 * same table as the 3D model's (`anatomy3d/modelIdentity.ts`, tested equal). The anconeus is the
 * adjacent node, kept apart from the 19 core muscles as the atlas keeps it.
 */
export const forearmPlateSlugToNode = {
  brachioradialis: m.brachioradialis,
  anconeus: forearmAdjacentIds.anconeus,
  supinator: m.supinator,
  "flexor-digitorum-superficialis": m.flexorDigitorumSuperficialis,
  "flexor-digitorum-profundus": m.flexorDigitorumProfundus,
  "flexor-carpi-ulnaris": m.flexorCarpiUlnaris,
  "flexor-carpi-radialis": m.flexorCarpiRadialis,
  "palmaris-longus": m.palmarisLongus,
  "flexor-pollicis-longus": m.flexorPollicisLongus,
  "pronator-teres": m.pronatorTeres,
  "pronator-quadratus": m.pronatorQuadratus,
  "extensor-digitorum": m.extensorDigitorum,
  "extensor-carpi-radialis-brevis": m.extensorCarpiRadialisBrevis,
  "extensor-carpi-radialis-longus": m.extensorCarpiRadialisLongus,
  "extensor-carpi-ulnaris": m.extensorCarpiUlnaris,
  "extensor-digiti-minimi": m.extensorDigitiMinimi,
  "extensor-indicis": m.extensorIndicis,
  "extensor-pollicis-longus": m.extensorPollicisLongus,
  "extensor-pollicis-brevis": m.extensorPollicisBrevis,
  "abductor-pollicis-longus": m.abductorPollicisLongus,
} as const satisfies Record<string, NodeId>;

function nodeForSlug(slug: string): NodeId {
  const nodeId = (forearmPlateSlugToNode as Record<string, NodeId>)[slug];
  if (!nodeId) throw new Error(`Forearm plates: no atlas node for the package's muscle "${slug}"`);
  return nodeId;
}

export const forearmPlates: DiagramPlates = {
  key: "forearm_plates",
  version: 1,
  regionId: FOREARM_REGION_ID,
  frame: { ...forearmPlateFrame },
  // The package's passes: anterior is the palm, posterior the back, lateral the thumb side (its
  // titles: "Palmar", "Dorsal", "Thumb side"); the words are the SVG drawing's.
  viewOrder: [{ id: "palm", label: "Palm" }, { id: "back", label: "Back" }, { id: "thumb", label: "Thumb side" }],
  passes: forearmPlatePasses.map((pass) => ({
    id: pass.id,
    view: pass.view,
    layer: pass.layer,
    image: pass.image,
    labels: pass.labels,
    nodeIds: pass.muscles.map((muscle) => nodeForSlug(muscle.slug)),
  })),
  credit: [
    "Images rendered from the ",
    { text: "Open3Dmodel upper-limb model", href: "https://anatomytool.org/open3dmodel-create" },
    ", built on BodyParts3D (The Database Center for Life Science, ",
    { text: "CC BY-SA 2.1 Japan", href: "https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en" },
    ") and Z-Anatomy (",
    { text: "CC BY-SA 4.0", href: "https://creativecommons.org/licenses/by-sa/4.0/" },
    "). They are adapted renders: cropped, tinted by your training and divided by muscle; shared under CC BY-SA 4.0. One arm, never mirrored. For education, not diagnosis.",
  ],
  drawingStatement: "The drawing is adapted from renders of a third-party anatomy model (credited under it); which muscle each part of a render shows was decided from the model's own muscle renders, and has not been reviewed by an anatomist.",
};
