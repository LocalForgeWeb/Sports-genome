import type { AnatomyNode } from "../../types";
import { FOREARM_REGION_ID, forearmAdjacentIds, forearmGroupIds, forearmMuscleIds as m } from "./ids";

/**
 * The forearm's anatomy nodes (brief §3): the nodes whose home is the forearm. The page also
 * lists the biceps and brachialis, whose home is the upper arm (regions/upper_arm/nodes.ts);
 * members.ts says which nodes the forearm lists. Identity, layer and border are fixed here;
 * the descriptive fields (location, what it does, shape note, caveats) and `status`
 * are filled during the evidence review, and every claim behind them is in claims.ts.
 *
 * How the copy is written (brief §3, §6):
 * - Directions are anatomical. "Thumb side" is radial and "pinky side" is ulnar; "palm
 *   side" and "back" are the anterior and posterior surfaces; "near the elbow" and "near
 *   the wrist" are proximal and distal. Never screen-left or screen-right: the left arm
 *   is drawn mirrored, and a rotating forearm changes which surface faces the viewer.
 * - `whatItDoes` is the physical action only. `shapeNote` is a separate, qualified
 *   inference from location and depth ("may contribute to"), never a forecast of growth.
 * - Deep muscles say plainly that they have little or no surface contour of their own,
 *   and a visible tendon is never presented as muscle size.
 * - A node is `reviewed` only when every function claim behind it was reviewed
 *   (enforced by client/src/lib/specialization/forearmAnatomy.test.ts).
 */
type NodeSeed = Pick<AnatomyNode, "id" | "parentId" | "kind" | "role" | "name" | "shortName" | "aliases" | "layer" | "surfaceVisibility" | "catalogMuscleKey" | "databaseMuscle" | "border" | "location" | "whatItDoes" | "shapeNote"> & Partial<AnatomyNode>;

const forearm = (seed: NodeSeed): AnatomyNode => ({
  regionId: FOREARM_REGION_ID,
  status: "draft",
  caveats: [],
  ...seed,
});

/** Said wherever a contour is mentioned, so no single muscle is credited with the outline. */
const NEIGHBOURS = "Visible shape also depends on neighbouring muscles, body fat and individual anatomy.";

export const forearmNodes: AnatomyNode[] = [
  forearm({
    id: forearmGroupIds.anterior, parentId: null, kind: "compartment", role: "group",
    name: "Anterior (flexor-pronator) compartment", shortName: "Palm side", aliases: ["flexor compartment", "forearm flexors"],
    layer: "mixed", surfaceVisibility: "partial", catalogMuscleKey: "forearms", databaseMuscle: "forearm_flexors", border: "both",
    status: "reviewed",
    location: "Palm side of the forearm, in a surface, a middle and a deep layer from the elbow to the wrist.",
    whatItDoes: "Bends the wrist and the fingers and turns the palm down.",
    shapeNote: `Together these muscles make up most of the palm-side fullness of the forearm. Which muscle shapes which part of that outline cannot be read from the surface. ${NEIGHBOURS}`,
    caveats: ["A group, not a muscle: work is counted for the individual muscles inside it."],
  }),
  forearm({
    id: forearmGroupIds.posterior, parentId: null, kind: "compartment", role: "group",
    name: "Posterior (extensor-supinator) compartment", shortName: "Back side", aliases: ["extensor compartment", "forearm extensors"],
    layer: "mixed", surfaceVisibility: "partial", catalogMuscleKey: "forearms", databaseMuscle: "forearm_extensors", border: "both",
    status: "reviewed",
    location: "Back of the forearm and its thumb-side edge, in a surface layer and a deep layer from the elbow to the wrist.",
    whatItDoes: "Straightens the wrist, the fingers and the thumb and turns the palm up. The brachioradialis, also in this group, bends the elbow.",
    shapeNote: `Makes up the back of the forearm and, through the brachioradialis and the thumb-side wrist extensors, the thumb-side outline near the elbow. ${NEIGHBOURS}`,
    caveats: ["A group, not a muscle: work is counted for the individual muscles inside it."],
  }),

  forearm({
    id: m.brachioradialis, parentId: forearmGroupIds.posterior, kind: "muscle", role: "target",
    name: "Brachioradialis", shortName: "BR", aliases: ["brachioradialis"],
    layer: "surface", surfaceVisibility: "clear", catalogMuscleKey: "forearms", databaseMuscle: "brachioradialis", border: "radial",
    status: "reviewed",
    location: "Thumb side of the forearm, from just above the elbow to the wrist; the outermost muscle on that edge.",
    whatItDoes: "Bends your elbow. It works whichever way the palm faces; anatomy texts describe it as strongest with the thumb pointing up.",
    shapeNote: `Contributes to the thumb-side contour of the upper forearm, the bulge just below the elbow. It does not bend the wrist. ${NEIGHBOURS}`,
    caveats: [
      "Studies disagree on whether turning the palm up, sideways or down changes how hard it works in a curl.",
      "From a fully palm-up or palm-down start it also turns the forearm back toward thumb-up; that is not counted as a separate action here.",
    ],
  }),
  forearm({
    id: m.flexorCarpiRadialis, parentId: forearmGroupIds.anterior, kind: "muscle", role: "target",
    name: "Flexor carpi radialis", shortName: "FCR", aliases: ["FCR", "radial wrist flexor"],
    layer: "surface", surfaceVisibility: "partial", catalogMuscleKey: "forearms", databaseMuscle: "forearm_flexors", border: "radial",
    status: "reviewed",
    location: "Palm side, surface layer, running at a slant from the pinky side of the elbow to the thumb side of the wrist.",
    whatItDoes: "Bends your wrist toward the palm and toward the thumb side.",
    shapeNote: `May contribute to the palm-side contour toward the thumb side, between the elbow crease and mid-forearm. It is not the whole thumb-side width: the brachioradialis forms that edge. ${NEIGHBOURS}`,
    caveats: ["Its tendon is easy to see at the wrist; a visible tendon is not muscle size."],
  }),
  forearm({
    id: m.flexorCarpiUlnaris, parentId: forearmGroupIds.anterior, kind: "muscle", role: "target",
    name: "Flexor carpi ulnaris", shortName: "FCU", aliases: ["FCU", "ulnar wrist flexor"],
    layer: "surface", surfaceVisibility: "partial", catalogMuscleKey: "forearms", databaseMuscle: "forearm_flexors", border: "ulnar",
    status: "reviewed",
    location: "Palm side, surface layer, along the pinky-side edge from the elbow to the wrist.",
    whatItDoes: "Bends your wrist toward the palm and toward the pinky side.",
    shapeNote: `Contributes to the palm-side contour along the pinky side (ulnar). ${NEIGHBOURS}`,
    caveats: [],
  }),
  forearm({
    id: m.palmarisLongus, parentId: forearmGroupIds.anterior, kind: "muscle", role: "target",
    name: "Palmaris longus", shortName: "PL", aliases: ["PL"],
    layer: "surface", surfaceVisibility: "variable", catalogMuscleKey: "forearms", databaseMuscle: "forearm_flexors", border: "central",
    status: "reviewed",
    location: "Palm side, surface layer, down the middle: a short belly near the elbow and a long tendon to the palm.",
    whatItDoes: "Tenses the sheet of connective tissue in the palm and gives a little help bending the wrist.",
    shapeNote: "Small belly and long tendon, and missing in some people, so it is not a major driver of forearm width. Visible shape depends far more on the muscles around it.",
    caveats: [
      "Absent on one or both sides in some people; how often varies widely between populations.",
      "Its absence has not been shown to reduce grip strength.",
    ],
  }),
  forearm({
    id: m.flexorDigitorumSuperficialis, parentId: forearmGroupIds.anterior, kind: "muscle", role: "target",
    name: "Flexor digitorum superficialis", shortName: "FDS", aliases: ["FDS", "superficial finger flexor", "flexor digitorum sublimis"],
    layer: "intermediate", surfaceVisibility: "not_distinct", catalogMuscleKey: "forearms", databaseMuscle: "forearm_flexors", border: "central",
    status: "reviewed",
    location: "Palm side, middle layer: under the surface wrist flexors and over the deep finger flexor.",
    whatItDoes: "Bends your four fingers at their middle joints, and helps bend the knuckles and the wrist. Each finger has its own part of the muscle, but the parts do not work fully apart.",
    shapeNote: "May add to the general fullness of the palm side of the forearm. It lies under other muscles, so it has no separately visible outline.",
    caveats: ["Grip and finger-curl work loads it together with the deep finger flexor (FDP); how the work splits between them is not known."],
  }),
  forearm({
    id: m.flexorDigitorumProfundus, parentId: forearmGroupIds.anterior, kind: "muscle", role: "target",
    name: "Flexor digitorum profundus", shortName: "FDP", aliases: ["FDP", "deep finger flexor"],
    layer: "deep", surfaceVisibility: "not_distinct", catalogMuscleKey: "forearms", databaseMuscle: "forearm_flexors", border: "ulnar",
    status: "reviewed",
    location: "Palm side, deep layer, against the ulna on the pinky side and under the other finger flexors.",
    whatItDoes: "Bends your fingertips: it is the only muscle that bends the end joints of the four fingers. It also helps bend the middle joints, the knuckles and the wrist.",
    shapeNote: "Deep bulk under the palm-side muscles. It may add to overall palm-side thickness but has little or no separately visible surface contour, so it is not drawn as a surface stripe.",
    caveats: ["Grip and finger-curl work loads it together with FDS; how the work splits between them is not known."],
  }),
  forearm({
    id: m.flexorPollicisLongus, parentId: forearmGroupIds.anterior, kind: "muscle", role: "target",
    name: "Flexor pollicis longus", shortName: "FPL", aliases: ["FPL", "long thumb flexor"],
    layer: "deep", surfaceVisibility: "not_distinct", catalogMuscleKey: "forearms", databaseMuscle: "forearm_flexors", border: "radial",
    status: "reviewed",
    location: "Palm side, deep layer, on the thumb side against the radius.",
    whatItDoes: "Bends the tip of your thumb, and helps bend the thumb at its knuckle. No other muscle bends the thumb tip.",
    shapeNote: "Deep tissue on the thumb side of the palm side, close to the bone; little or no separately visible contour.",
    caveats: ["Hard to feel through the skin because it lies under the other flexors."],
  }),
  forearm({
    id: m.pronatorTeres, parentId: forearmGroupIds.anterior, kind: "muscle", role: "target",
    name: "Pronator teres", shortName: "PT", aliases: ["PT"],
    layer: "surface", surfaceVisibility: "partial", catalogMuscleKey: "forearms", databaseMuscle: null, border: "central",
    status: "reviewed",
    location: "Palm side just below the elbow, surface layer, slanting from the pinky side of the elbow to the middle of the radius on the thumb side.",
    whatItDoes: "Turns your palm down, and gives a little help bending the elbow.",
    shapeNote: `May contribute to the slanted palm-side contour just below the elbow crease, where it forms the pinky-side edge of the hollow in front of the elbow. ${NEIGHBOURS}`,
    caveats: ["Both pronators turn the palm down, so palm-down work loads it together with the pronator quadratus."],
  }),
  forearm({
    id: m.pronatorQuadratus, parentId: forearmGroupIds.anterior, kind: "muscle", role: "target",
    name: "Pronator quadratus", shortName: "PQ", aliases: ["PQ"],
    layer: "deep", surfaceVisibility: "not_distinct", catalogMuscleKey: "forearms", databaseMuscle: null, border: "both",
    status: "reviewed",
    location: "Palm side, deepest layer: a flat, square muscle on the two forearm bones just above the wrist.",
    whatItDoes: "Turns your palm down, and helps hold the two forearm bones together near the wrist.",
    shapeNote: "Deep and close to the bones near the wrist, under the flexor tendons; little or no direct surface definition.",
    caveats: ["Both pronators turn the palm down, so palm-down work loads it together with the pronator teres."],
  }),
  forearm({
    id: m.extensorCarpiRadialisLongus, parentId: forearmGroupIds.posterior, kind: "muscle", role: "target",
    name: "Extensor carpi radialis longus", shortName: "ECRL", aliases: ["ECRL"],
    layer: "surface", surfaceVisibility: "partial", catalogMuscleKey: "forearms", databaseMuscle: "forearm_extensors", border: "radial",
    status: "reviewed",
    location: "Back of the forearm on the thumb side, starting just above the elbow beside the brachioradialis.",
    whatItDoes: "Bends your wrist back and toward the thumb side.",
    shapeNote: `May contribute to the contour on the back and thumb side of the forearm near the elbow. ${NEIGHBOURS}`,
    caveats: ["Ordinary exercises cannot train it apart from ECRB; the two are counted together in practice."],
  }),
  forearm({
    id: m.extensorCarpiRadialisBrevis, parentId: forearmGroupIds.posterior, kind: "muscle", role: "target",
    name: "Extensor carpi radialis brevis", shortName: "ECRB", aliases: ["ECRB"],
    layer: "surface", surfaceVisibility: "partial", catalogMuscleKey: "forearms", databaseMuscle: "forearm_extensors", border: "radial",
    status: "reviewed",
    location: "Back of the forearm on the thumb side, beside and partly under ECRL.",
    whatItDoes: "Bends your wrist back and toward the thumb side.",
    shapeNote: `Part of the extensor mass on the back and thumb side of the forearm. Partly covered by ECRL, so its own outline is only partly visible. ${NEIGHBOURS}`,
    caveats: [
      "Ordinary exercises cannot train it apart from ECRL; the two are counted together in practice.",
      "In one study it was more active in wrist-extension holds with the palm turned down. That is short-term muscle activity, not growth.",
    ],
  }),
  forearm({
    id: m.extensorCarpiUlnaris, parentId: forearmGroupIds.posterior, kind: "muscle", role: "target",
    name: "Extensor carpi ulnaris", shortName: "ECU", aliases: ["ECU"],
    layer: "surface", surfaceVisibility: "partial", catalogMuscleKey: "forearms", databaseMuscle: "forearm_extensors", border: "ulnar",
    status: "reviewed",
    location: "Back of the forearm, surface layer, along the pinky-side edge from the elbow to the wrist.",
    whatItDoes: "Bends your wrist back and toward the pinky side.",
    shapeNote: `May contribute to the contour along the back of the forearm on the pinky side. ${NEIGHBOURS}`,
    caveats: [],
  }),
  forearm({
    id: m.extensorDigitorum, parentId: forearmGroupIds.posterior, kind: "muscle", role: "target",
    name: "Extensor digitorum", shortName: "ED", aliases: ["ED", "extensor digitorum communis", "EDC"],
    layer: "surface", surfaceVisibility: "partial", catalogMuscleKey: "forearms", databaseMuscle: "forearm_extensors", border: "central",
    status: "reviewed",
    location: "Back of the forearm, surface layer, down the middle; it splits into four tendons that run to the fingers.",
    whatItDoes: "Straightens your four fingers, mainly at the knuckles, and helps bend the wrist back.",
    shapeNote: `May contribute to the central mass on the back of the forearm. Its tendons on the back of the hand are tendon, not muscle bulk. ${NEIGHBOURS}`,
    caveats: [],
  }),
  forearm({
    id: m.extensorDigitiMinimi, parentId: forearmGroupIds.posterior, kind: "muscle", role: "target",
    name: "Extensor digiti minimi", shortName: "EDM", aliases: ["EDM", "extensor digiti quinti"],
    layer: "surface", surfaceVisibility: "not_distinct", catalogMuscleKey: "forearms", databaseMuscle: "forearm_extensors", border: "ulnar",
    status: "reviewed",
    location: "Back of the forearm, surface layer: a thin muscle on the pinky side of the extensor digitorum.",
    whatItDoes: "Straightens your little finger, on its own or with the other fingers.",
    shapeNote: "Small, and joined to the extensor digitorum near the elbow; not a major independent driver of forearm width.",
    caveats: ["Some anatomists treat it as the pinky-side part of the extensor digitorum."],
  }),
  forearm({
    id: m.extensorIndicis, parentId: forearmGroupIds.posterior, kind: "muscle", role: "target",
    name: "Extensor indicis", shortName: "EI", aliases: ["EI", "extensor indicis proprius"],
    layer: "deep", surfaceVisibility: "not_distinct", catalogMuscleKey: "forearms", databaseMuscle: "forearm_extensors", border: "central",
    status: "reviewed",
    location: "Back of the forearm, deep layer near the wrist, arising on the pinky side; its tendon runs to the index finger.",
    whatItDoes: "Straightens your index finger, which lets it point on its own.",
    shapeNote: "Small and deep near the wrist; little or no separately visible contour.",
    caveats: [],
  }),
  forearm({
    id: m.abductorPollicisLongus, parentId: forearmGroupIds.posterior, kind: "muscle", role: "target",
    name: "Abductor pollicis longus", shortName: "APL", aliases: ["APL"],
    layer: "deep", surfaceVisibility: "partial", catalogMuscleKey: "forearms", databaseMuscle: "forearm_extensors", border: "radial",
    status: "reviewed",
    location: "Back of the forearm, deep layer, coming to the surface on the thumb side above the wrist on its way to the base of the thumb.",
    whatItDoes: "Moves your thumb out from the hand at its base, away from the index finger, and helps straighten it there.",
    shapeNote: "Mostly deep, with little separately visible contour. Near the wrist its tendon, with EPB's, forms the thumb-side edge of the hollow at the base of the thumb; a visible tendon there is not muscle size.",
    caveats: ["References disagree about a small effect at the wrist, so no wrist action is counted for it here."],
  }),
  forearm({
    id: m.extensorPollicisBrevis, parentId: forearmGroupIds.posterior, kind: "muscle", role: "target",
    name: "Extensor pollicis brevis", shortName: "EPB", aliases: ["EPB"],
    layer: "deep", surfaceVisibility: "partial", catalogMuscleKey: "forearms", databaseMuscle: "forearm_extensors", border: "radial",
    status: "reviewed",
    location: "Back of the forearm, deep layer near the wrist on the thumb side, beside APL.",
    whatItDoes: "Straightens your thumb at its knuckle, and helps straighten it at its base.",
    shapeNote: "Small and deep, with little separately visible contour. Its tendon at the base of the thumb can be easy to see; that is tendon, not muscle size.",
    caveats: ["Where its tendon attaches varies a good deal between people."],
  }),
  forearm({
    id: m.extensorPollicisLongus, parentId: forearmGroupIds.posterior, kind: "muscle", role: "target",
    name: "Extensor pollicis longus", shortName: "EPL", aliases: ["EPL"],
    layer: "deep", surfaceVisibility: "not_distinct", catalogMuscleKey: "forearms", databaseMuscle: "forearm_extensors", border: "central",
    status: "reviewed",
    location: "Back of the forearm, deep layer in the middle; a long tendon bends around a bony bump on the back of the radius to reach the thumb tip.",
    whatItDoes: "Straightens the tip of your thumb, and helps straighten the thumb at its knuckle.",
    shapeNote: "Deep muscle with little or no separately visible contour. Its long tendon forms the pinky-side edge of the hollow at the base of the thumb; a visible tendon is not muscle size.",
    caveats: [],
  }),
  forearm({
    id: m.supinator, parentId: forearmGroupIds.posterior, kind: "muscle", role: "target",
    name: "Supinator", shortName: "SUP", aliases: ["supinator"],
    layer: "deep", surfaceVisibility: "not_distinct", catalogMuscleKey: "forearms", databaseMuscle: null, border: "radial",
    status: "reviewed",
    location: "Just below the elbow on the back and thumb side, deep layer, wrapped around the top of the radius.",
    whatItDoes: "Turns your palm up.",
    shapeNote: "Deep near the elbow, under the surface extensors; not directly visible in an ordinary surface view.",
    caveats: ["With the elbow bent the biceps is the stronger palm-up muscle, so palm-up work with a bent elbow is not supinator-only."],
  }),

  forearm({
    id: forearmAdjacentIds.anconeus, parentId: forearmGroupIds.posterior, kind: "muscle", role: "adjacent",
    name: "Anconeus", shortName: "ANC", aliases: ["anconeus"],
    layer: "surface", surfaceVisibility: "partial", catalogMuscleKey: "triceps", databaseMuscle: null, border: "ulnar",
    status: "reviewed",
    location: "Back of the elbow: a small triangle from the thumb-side bony knob of the upper-arm bone to the point of the elbow.",
    whatItDoes: "Helps straighten your elbow and steadies the joint; the triceps does most of the straightening.",
    shapeNote: "Small; may add to the contour at the back of the elbow. It is not a forearm growth target.",
    caveats: ["Shown beside the forearm muscles because of where it sits; forearm specialization does not target it."],
  }),
];
