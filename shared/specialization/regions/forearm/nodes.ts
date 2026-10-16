import type { AnatomyNode } from "../../types";
import { FOREARM_REGION_ID, UPPER_ARM_REGION_ID, externalContributorIds, forearmAdjacentIds, forearmGroupIds, forearmMuscleIds as m } from "../../ids";

/**
 * The forearm's anatomy nodes (brief §3). Identity, layer and border are fixed here;
 * the descriptive fields (location, what it does, shape note, caveats) and `status`
 * are filled during the evidence review, and every claim behind them is in claims.ts.
 */
type NodeSeed = Pick<AnatomyNode, "id" | "parentId" | "kind" | "role" | "name" | "shortName" | "aliases" | "layer" | "surfaceVisibility" | "catalogMuscleKey" | "databaseMuscle" | "border"> & Partial<AnatomyNode>;

const forearm = (seed: NodeSeed): AnatomyNode => ({
  regionId: FOREARM_REGION_ID,
  status: "draft",
  location: "",
  whatItDoes: "",
  shapeNote: "",
  caveats: [],
  ...seed,
});

export const forearmNodes: AnatomyNode[] = [
  forearm({ id: forearmGroupIds.anterior, parentId: null, kind: "compartment", role: "group", name: "Anterior (flexor-pronator) compartment", shortName: "Palm side", aliases: ["flexor compartment", "forearm flexors"], layer: "mixed", surfaceVisibility: "partial", catalogMuscleKey: "forearms", databaseMuscle: "forearm_flexors", border: "both" }),
  forearm({ id: forearmGroupIds.posterior, parentId: null, kind: "compartment", role: "group", name: "Posterior (extensor-supinator) compartment", shortName: "Back side", aliases: ["extensor compartment", "forearm extensors"], layer: "mixed", surfaceVisibility: "partial", catalogMuscleKey: "forearms", databaseMuscle: "forearm_extensors", border: "both" }),

  forearm({ id: m.brachioradialis, parentId: forearmGroupIds.posterior, kind: "muscle", role: "target", name: "Brachioradialis", shortName: "BR", aliases: ["brachioradialis"], layer: "surface", surfaceVisibility: "clear", catalogMuscleKey: "forearms", databaseMuscle: "brachioradialis", border: "radial" }),
  forearm({ id: m.flexorCarpiRadialis, parentId: forearmGroupIds.anterior, kind: "muscle", role: "target", name: "Flexor carpi radialis", shortName: "FCR", aliases: ["FCR", "radial wrist flexor"], layer: "surface", surfaceVisibility: "partial", catalogMuscleKey: "forearms", databaseMuscle: "forearm_flexors", border: "radial" }),
  forearm({ id: m.flexorCarpiUlnaris, parentId: forearmGroupIds.anterior, kind: "muscle", role: "target", name: "Flexor carpi ulnaris", shortName: "FCU", aliases: ["FCU", "ulnar wrist flexor"], layer: "surface", surfaceVisibility: "partial", catalogMuscleKey: "forearms", databaseMuscle: "forearm_flexors", border: "ulnar" }),
  forearm({ id: m.palmarisLongus, parentId: forearmGroupIds.anterior, kind: "muscle", role: "target", name: "Palmaris longus", shortName: "PL", aliases: ["PL"], layer: "surface", surfaceVisibility: "variable", catalogMuscleKey: "forearms", databaseMuscle: "forearm_flexors", border: "central" }),
  forearm({ id: m.flexorDigitorumSuperficialis, parentId: forearmGroupIds.anterior, kind: "muscle", role: "target", name: "Flexor digitorum superficialis", shortName: "FDS", aliases: ["FDS", "superficial finger flexor"], layer: "intermediate", surfaceVisibility: "not_distinct", catalogMuscleKey: "forearms", databaseMuscle: "forearm_flexors", border: "central" }),
  forearm({ id: m.flexorDigitorumProfundus, parentId: forearmGroupIds.anterior, kind: "muscle", role: "target", name: "Flexor digitorum profundus", shortName: "FDP", aliases: ["FDP", "deep finger flexor"], layer: "deep", surfaceVisibility: "not_distinct", catalogMuscleKey: "forearms", databaseMuscle: "forearm_flexors", border: "ulnar" }),
  forearm({ id: m.flexorPollicisLongus, parentId: forearmGroupIds.anterior, kind: "muscle", role: "target", name: "Flexor pollicis longus", shortName: "FPL", aliases: ["FPL", "long thumb flexor"], layer: "deep", surfaceVisibility: "not_distinct", catalogMuscleKey: "forearms", databaseMuscle: "forearm_flexors", border: "radial" }),
  forearm({ id: m.pronatorTeres, parentId: forearmGroupIds.anterior, kind: "muscle", role: "target", name: "Pronator teres", shortName: "PT", aliases: ["PT"], layer: "surface", surfaceVisibility: "partial", catalogMuscleKey: "forearms", databaseMuscle: null, border: "central" }),
  forearm({ id: m.pronatorQuadratus, parentId: forearmGroupIds.anterior, kind: "muscle", role: "target", name: "Pronator quadratus", shortName: "PQ", aliases: ["PQ"], layer: "deep", surfaceVisibility: "not_distinct", catalogMuscleKey: "forearms", databaseMuscle: null, border: "both" }),
  forearm({ id: m.extensorCarpiRadialisLongus, parentId: forearmGroupIds.posterior, kind: "muscle", role: "target", name: "Extensor carpi radialis longus", shortName: "ECRL", aliases: ["ECRL"], layer: "surface", surfaceVisibility: "partial", catalogMuscleKey: "forearms", databaseMuscle: "forearm_extensors", border: "radial" }),
  forearm({ id: m.extensorCarpiRadialisBrevis, parentId: forearmGroupIds.posterior, kind: "muscle", role: "target", name: "Extensor carpi radialis brevis", shortName: "ECRB", aliases: ["ECRB"], layer: "surface", surfaceVisibility: "partial", catalogMuscleKey: "forearms", databaseMuscle: "forearm_extensors", border: "radial" }),
  forearm({ id: m.extensorCarpiUlnaris, parentId: forearmGroupIds.posterior, kind: "muscle", role: "target", name: "Extensor carpi ulnaris", shortName: "ECU", aliases: ["ECU"], layer: "surface", surfaceVisibility: "partial", catalogMuscleKey: "forearms", databaseMuscle: "forearm_extensors", border: "ulnar" }),
  forearm({ id: m.extensorDigitorum, parentId: forearmGroupIds.posterior, kind: "muscle", role: "target", name: "Extensor digitorum", shortName: "ED", aliases: ["ED", "extensor digitorum communis", "EDC"], layer: "surface", surfaceVisibility: "partial", catalogMuscleKey: "forearms", databaseMuscle: "forearm_extensors", border: "central" }),
  forearm({ id: m.extensorDigitiMinimi, parentId: forearmGroupIds.posterior, kind: "muscle", role: "target", name: "Extensor digiti minimi", shortName: "EDM", aliases: ["EDM"], layer: "surface", surfaceVisibility: "not_distinct", catalogMuscleKey: "forearms", databaseMuscle: "forearm_extensors", border: "ulnar" }),
  forearm({ id: m.extensorIndicis, parentId: forearmGroupIds.posterior, kind: "muscle", role: "target", name: "Extensor indicis", shortName: "EI", aliases: ["EI"], layer: "deep", surfaceVisibility: "not_distinct", catalogMuscleKey: "forearms", databaseMuscle: "forearm_extensors", border: "central" }),
  forearm({ id: m.abductorPollicisLongus, parentId: forearmGroupIds.posterior, kind: "muscle", role: "target", name: "Abductor pollicis longus", shortName: "APL", aliases: ["APL"], layer: "deep", surfaceVisibility: "partial", catalogMuscleKey: "forearms", databaseMuscle: "forearm_extensors", border: "radial" }),
  forearm({ id: m.extensorPollicisBrevis, parentId: forearmGroupIds.posterior, kind: "muscle", role: "target", name: "Extensor pollicis brevis", shortName: "EPB", aliases: ["EPB"], layer: "deep", surfaceVisibility: "partial", catalogMuscleKey: "forearms", databaseMuscle: "forearm_extensors", border: "radial" }),
  forearm({ id: m.extensorPollicisLongus, parentId: forearmGroupIds.posterior, kind: "muscle", role: "target", name: "Extensor pollicis longus", shortName: "EPL", aliases: ["EPL"], layer: "deep", surfaceVisibility: "not_distinct", catalogMuscleKey: "forearms", databaseMuscle: "forearm_extensors", border: "central" }),
  forearm({ id: m.supinator, parentId: forearmGroupIds.posterior, kind: "muscle", role: "target", name: "Supinator", shortName: "SUP", aliases: ["supinator"], layer: "deep", surfaceVisibility: "not_distinct", catalogMuscleKey: "forearms", databaseMuscle: null, border: "radial" }),

  forearm({ id: forearmAdjacentIds.anconeus, parentId: forearmGroupIds.posterior, kind: "muscle", role: "adjacent", name: "Anconeus", shortName: "ANC", aliases: ["anconeus"], layer: "surface", surfaceVisibility: "partial", catalogMuscleKey: "triceps", databaseMuscle: null, border: "ulnar" }),

  { id: externalContributorIds.biceps, regionId: UPPER_ARM_REGION_ID, parentId: null, kind: "muscle", role: "external", name: "Biceps brachii", shortName: "Biceps", aliases: ["biceps"], layer: "surface", surfaceVisibility: "clear", status: "draft", catalogMuscleKey: "biceps", databaseMuscle: "biceps_brachii", border: null, location: "", whatItDoes: "", shapeNote: "", caveats: [] },
  { id: externalContributorIds.brachialis, regionId: UPPER_ARM_REGION_ID, parentId: null, kind: "muscle", role: "external", name: "Brachialis", shortName: "Brachialis", aliases: ["brachialis"], layer: "deep", surfaceVisibility: "partial", status: "draft", catalogMuscleKey: "brachialis", databaseMuscle: "brachialis", border: null, location: "", whatItDoes: "", shapeNote: "", caveats: [] },
];
