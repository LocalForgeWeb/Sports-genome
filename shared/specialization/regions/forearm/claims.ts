import type { Claim, ClaimSourceRef } from "../../types";
import { externalContributorIds as ext, forearmAdjacentIds as adj, forearmGroupIds as grp, forearmMuscleIds as m } from "../../ids";

/**
 * Function, appearance, selectivity and variation claims per node, with sources.
 *
 * Ids are `<node id without its region>.<kind>[.<n>]` (`fcu.function`, `fds.selectivity.1`),
 * so a claim's owner can be read from its id and node actions can cite it by name.
 *
 * Kinds and bases are kept apart on purpose (brief §2, "mark anatomical inference,
 * experimental evidence, and product accounting choices distinctly"):
 * - `function` claims are physical actions, basis `established_anatomy`.
 * - `appearance` claims are always `anatomical_inference`: where a muscle sits and how
 *   deep it lies, read as what part of the outline it MAY contribute to. Never a
 *   measured or predicted change in size.
 * - `selectivity` claims say what experiments do and do not show about loading one
 *   muscle or one finger apart from its neighbours. They are short-term activity
 *   findings (EMG), never evidence of growth, and never a credit coefficient.
 * - `variation` claims are differences between people (a muscle that may be absent).
 *
 * Review (16 Oct 2026): every source was checked through web-search results only, since
 * the build environment could not open the pages. A claim is `reviewed` when those
 * results support every sentence of it; each citation's `qualification` says what the
 * source cannot carry. The method and its limits are in
 * docs/specialization-atlas/03-anatomy-evidence.md.
 */

const REVIEWED_ON = "2026-10-16";
const REVIEW_NOTE = "Checked against the cited sources through web search on 16 Oct 2026; automated review, not a clinician or anatomist.";
const APPEARANCE_REVIEW_NOTE =
  "Checked against the cited sources through web search on 16 Oct 2026, as an anatomical inference from the muscle's cited location and depth; not a measured prediction. Automated review, not a clinician or anatomist.";

/** Common qualifications, said once so every citation of the same limit reads the same. */
const ACUTE_EMG = "Short-term muscle activity in a controlled task; not a measurement of growth and not a set-credit weight.";
const SEARCH_EXCERPT = "Seen through web-search excerpts of the page, not the full text.";
const LOCATION_ONLY = "Gives location and layer only; the contour statement is inferred from them, not reported by the source.";

const src = (sourceId: string, locator: string, qualification: string | null = null): ClaimSourceRef => ({ sourceId, locator, qualification });

/** The node id without its region prefix: `forearm.fcu` → `fcu`. */
const short = (nodeId: string) => nodeId.slice(nodeId.indexOf(".") + 1);

type ClaimSeed = Pick<Claim, "nodeId" | "statement" | "sources"> & { n?: number };

function reviewedClaim(kind: Claim["kind"], basis: Claim["basis"], seed: ClaimSeed): Claim {
  return {
    id: `${short(seed.nodeId)}.${kind}${seed.n ? `.${seed.n}` : ""}`,
    nodeId: seed.nodeId,
    kind,
    statement: seed.statement,
    basis,
    reviewStatus: "reviewed",
    reviewedAt: REVIEWED_ON,
    reviewNote: kind === "appearance" ? APPEARANCE_REVIEW_NOTE : REVIEW_NOTE,
    sources: seed.sources,
  };
}

const fn = (seed: ClaimSeed) => reviewedClaim("function", "established_anatomy", seed);
const look = (seed: ClaimSeed) => reviewedClaim("appearance", "anatomical_inference", seed);
const select = (seed: ClaimSeed) => reviewedClaim("selectivity", "experimental", seed);
const varies = (seed: ClaimSeed) => reviewedClaim("variation", "established_anatomy", seed);

export const forearmClaims: Claim[] = [
  // ---------------------------------------------------------------- compartments
  fn({
    nodeId: grp.anterior,
    statement: "The palm-side (anterior) compartment holds the muscles that bend the wrist and fingers and turn the palm down. They lie in a surface layer, a middle layer (flexor digitorum superficialis) and a deep layer.",
    sources: [
      src("A52", "Introduction; Structure and Function", SEARCH_EXCERPT),
      src("A12", "Introduction: intermediate layer"),
      src("S6", "Abstract", "Abstract only; describes superficial and deep groups of eight muscles."),
    ],
  }),
  look({
    nodeId: grp.anterior,
    statement: "Together the palm-side muscles make up most of the palm-side fullness of the forearm. Which muscle shapes which part of that outline cannot be read from the surface.",
    sources: [src("A53", "Overview of the superficial group", LOCATION_ONLY), src("A20", "Deep flexors: under FDS, close to the bones", LOCATION_ONLY)],
  }),
  fn({
    nodeId: grp.posterior,
    statement: "The back (posterior) compartment holds the muscles that straighten the wrist, fingers and thumb and turn the palm up, plus the brachioradialis, which bends the elbow. They lie in a surface layer and a deep layer.",
    sources: [
      src("A52", "Introduction; Structure and Function", SEARCH_EXCERPT),
      src("A54", "Overview: muscles of the superficial group and their functions"),
      src("A55", "Overview: functions of the deep group"),
    ],
  }),
  look({
    nodeId: grp.posterior,
    statement: "Together the back-of-forearm muscles make up the back of the forearm and, through the brachioradialis and the thumb-side wrist extensors, the thumb-side outline near the elbow.",
    sources: [src("A54", "Overview of the superficial group", LOCATION_ONLY), src("A3", "Overview: most superficial muscle on the thumb side", LOCATION_ONLY)],
  }),

  // ---------------------------------------------------------------- brachioradialis
  fn({
    nodeId: m.brachioradialis,
    statement: "Brachioradialis bends the elbow and is active whether the palm faces up, sideways or down. Anatomy references describe it as strongest with the forearm half-turned (thumb up). From a fully palm-up or palm-down start it also turns the forearm back toward thumb-up. It does not cross the wrist.",
    sources: [
      src("A1", "Structure and Function", SEARCH_EXCERPT),
      src("A2", "Quick Facts: Action", "Relays Gray's Anatomy; a textbook statement, not a measurement."),
    ],
  }),
  select({
    nodeId: m.brachioradialis,
    n: 1,
    statement: "Whether forearm position changes how hard the brachioradialis works when bending the elbow is unsettled. A surface-EMG study of 16 people found its share differed with the palm down compared with palm up or thumb up; a fine-wire EMG study of 10 people found no difference between the three positions. Neither study measured growth.",
    sources: [
      src("A4", "Abstract: Results", `${ACUTE_EMG} Surface electrodes; slow single repetitions.`),
      src("A5", "Record summary", `${ACUTE_EMG} Authors and journal not confirmed by the search.`),
    ],
  }),
  look({
    nodeId: m.brachioradialis,
    statement: "Brachioradialis is the most superficial muscle on the thumb side of the forearm and forms the fleshy bulge in its upper half, so it may contribute to the thumb-side contour just below the elbow. Visible shape also depends on neighbouring muscles, body fat and individual anatomy.",
    sources: [src("A3", "Overview and palpation", LOCATION_ONLY), src("A2", "Relations: border of the hollow in front of the elbow", LOCATION_ONLY)],
  }),

  // ---------------------------------------------------------------- palm side, surface layer
  fn({
    nodeId: m.flexorCarpiRadialis,
    statement: "Flexor carpi radialis bends the wrist toward the palm and tilts the hand toward the thumb side (radial deviation).",
    sources: [src("A6", "Key facts: Function"), src("A7", "Function", "IMAIOS gives StatPearls as its reference; seen through the imaios.cn mirror.")],
  }),
  select({
    nodeId: m.flexorCarpiRadialis,
    n: 1,
    statement: "In a controlled study of 40 arms holding the same wrist-flexion force, FCR was more active with the palm turned up than with the thumb up or the palm down. Forearm rotation therefore belongs in how an exercise is described; the study does not show which position grows the muscle more.",
    sources: [src("S2", "Abstract: Results", `${ACUTE_EMG} Static holds at three quarters of the neutral-position maximum, healthy adults.`)],
  }),
  look({
    nodeId: m.flexorCarpiRadialis,
    statement: "FCR lies in the surface layer of the palm side, slanting from the pinky side of the elbow toward the thumb side of the wrist, so it may contribute to the palm-side contour toward the thumb side. It is not the whole thumb-side width; the brachioradialis forms that edge.",
    sources: [src("A6", "Overview: superficial layer of the anterior forearm", LOCATION_ONLY), src("A3", "Overview: most superficial muscle on the thumb side", LOCATION_ONLY)],
  }),

  fn({
    nodeId: m.flexorCarpiUlnaris,
    statement: "Flexor carpi ulnaris bends the wrist toward the palm and tilts the hand toward the pinky side (ulnar deviation). Anatomy references describe it as the most powerful wrist flexor.",
    sources: [src("A8", "Introduction; Structure and Function")],
  }),
  select({
    nodeId: m.flexorCarpiUlnaris,
    n: 1,
    statement: "In the same controlled wrist-flexion study, FCU was less active with the palm turned down than with the thumb up. This is evidence that forearm rotation changes wrist-flexor activity, not that one position grows FCU more.",
    sources: [src("S2", "Abstract: Results", `${ACUTE_EMG} Static holds at three quarters of the neutral-position maximum, healthy adults.`)],
  }),
  look({
    nodeId: m.flexorCarpiUlnaris,
    statement: "FCU runs in the surface layer along the pinky-side edge of the palm side, from the elbow to the wrist, so it may contribute to the palm-side ulnar contour. Visible shape also depends on neighbouring muscles and individual anatomy.",
    sources: [src("A8", "Introduction: superficial flexor; Structure: attachments", LOCATION_ONLY), src("A53", "Overview of the superficial group", LOCATION_ONLY)],
  }),

  fn({
    nodeId: m.palmarisLongus,
    statement: "Palmaris longus tenses the sheet of connective tissue in the palm (palmar aponeurosis). It crosses the wrist but is small, so its help in bending the wrist is likely minimal.",
    sources: [src("A9", "Structure and Function", SEARCH_EXCERPT)],
  }),
  varies({
    nodeId: m.palmarisLongus,
    n: 1,
    statement: "Palmaris longus is absent on one or both sides in a minority of people, and how often depends strongly on the population. A review pooling 26 clinical studies found the lowest rates in East and South-East African groups and the highest in Arab Middle Eastern groups, so no single figure applies to everyone. Its absence has not been shown to reduce grip strength.",
    sources: [
      src("A10", "Abstract: Results", "Clinical-examination studies; rates depend on the populations sampled and the test used. Abstract only."),
      src("A11", "Variant anatomy", SEARCH_EXCERPT),
      src("A9", "Clinical Significance", SEARCH_EXCERPT),
    ],
  }),
  look({
    nodeId: m.palmarisLongus,
    statement: "Palmaris longus has a small belly near the elbow and a long tendon, and it is missing in some people, so it is not a major driver of forearm width. Any contribution would be to the middle of the palm-side contour near the elbow.",
    sources: [src("A9", "Structure and Function", LOCATION_ONLY), src("A53", "Overview of the superficial group", LOCATION_ONLY)],
  }),

  fn({
    nodeId: m.pronatorTeres,
    statement: "Pronator teres turns the forearm palm-down (pronation) and gives a small amount of help bending the elbow.",
    sources: [src("A21", "Structure and Function", SEARCH_EXCERPT), src("A22", "Key facts: Function")],
  }),
  look({
    nodeId: m.pronatorTeres,
    statement: "Pronator teres lies in the surface layer just below the elbow, slanting from the pinky side of the elbow to the middle of the radius on the thumb side, and forms the pinky-side edge of the hollow in front of the elbow. It may contribute to the slanted palm-side contour there.",
    sources: [src("A21", "Structure and Function: attachments and the hollow in front of the elbow", LOCATION_ONLY), src("A22", "Key facts: Origin and insertion", LOCATION_ONLY)],
  }),

  // ---------------------------------------------------------------- palm side, middle and deep layers
  fn({
    nodeId: m.flexorDigitorumSuperficialis,
    statement: "Flexor digitorum superficialis is the main muscle bending the four fingers at their middle (PIP) joints. It also helps bend the knuckles (MCP) and the wrist. It has a separate part, with its own tendon, for each finger.",
    sources: [src("A12", "Introduction; Structure and Function"), src("A13", "Quick Facts: Action")],
  }),
  select({
    nodeId: m.flexorDigitorumSuperficialis,
    n: 1,
    statement: "The finger parts of FDS can be recruited selectively to some degree, with coupling between fingers. When one finger flexed at half its maximum force, fewer than half of the motor units serving the other fingers' parts became active, and units serving a neighbouring finger were recruited most readily. This supports describing finger actions; it does not show that one finger's part can be trained in isolation.",
    sources: [src("S3", "Abstract", `${ACUTE_EMG} Single-motor-unit recordings during isometric finger flexion in healthy adults.`)],
  }),
  select({
    nodeId: m.flexorDigitorumSuperficialis,
    n: 2,
    statement: "Ordinary gym grip and finger-flexion exercises load FDS together with the deep finger flexor (FDP). In a video-EMG study of fist making, FDP did most of the work in a light fist and FDS joined in every tight fist, in an order that differed between people. No ordinary exercise has been shown to split the work between them, so the atlas shows it as shared and invents no split.",
    sources: [
      src("A16", "Abstract: Results and Conclusions", "Clinical cohort that included injured hands; fist making, not gym exercises. Abstract only."),
      src("A12", "Structure and Function: joints it crosses"),
      src("A14", "Structure and Function: joints it crosses"),
    ],
  }),
  look({
    nodeId: m.flexorDigitorumSuperficialis,
    statement: "FDS forms the middle layer of the palm side, covered by the surface wrist flexors and lying over the deep finger flexor, so it may add to the general fullness of the palm side but has no separately visible outline.",
    sources: [src("A12", "Introduction: intermediate layer", LOCATION_ONLY), src("A53", "Overview: FDS beneath the superficial four", LOCATION_ONLY)],
  }),

  fn({
    nodeId: m.flexorDigitorumProfundus,
    statement: "Flexor digitorum profundus is the only muscle that bends the four fingers at their end (DIP) joints. It also helps bend the middle joints, the knuckles and the wrist. The force it makes at the fingertips depends on wrist position and falls when the wrist is fully bent.",
    sources: [src("A14", "Structure and Function", SEARCH_EXCERPT), src("A15", "Quick Facts: Action")],
  }),
  select({
    nodeId: m.flexorDigitorumProfundus,
    n: 1,
    statement: "Ordinary gym grip and finger-flexion exercises load FDP together with FDS. In a video-EMG study of fist making, FDP did most of the work in a light fist and FDS joined in every tight fist. No ordinary exercise has been shown to train FDP apart from FDS, so the atlas shows the work as shared and invents no split.",
    sources: [
      src("A16", "Abstract: Results and Conclusions", "Clinical cohort that included injured hands; fist making, not gym exercises. Abstract only."),
      src("A14", "Structure and Function: joints it crosses"),
    ],
  }),
  look({
    nodeId: m.flexorDigitorumProfundus,
    statement: "FDP lies in the deep layer of the palm side, against the ulna under the other finger flexors, and is hard to feel through the skin. It may add to overall palm-side thickness but has little or no separately visible surface contour, so it cannot be drawn as an isolated surface stripe.",
    sources: [src("A20", "Deep flexors: under FDS, close to the bones, difficult to palpate", LOCATION_ONLY), src("A14", "Structure: tendons deep to FDS", LOCATION_ONLY)],
  }),

  fn({
    nodeId: m.flexorPollicisLongus,
    statement: "Flexor pollicis longus is the only muscle that bends the tip (IP joint) of the thumb, and it also helps bend the thumb at its knuckle.",
    sources: [src("A17", "Introduction", SEARCH_EXCERPT), src("A18", "Summary: Action"), src("A19", "Function")],
  }),
  look({
    nodeId: m.flexorPollicisLongus,
    statement: "FPL lies in the deep layer on the thumb side of the palm side, close to the radius and under the surface and middle flexors, so it has little or no separately visible contour.",
    sources: [src("A17", "Structure: course along the thumb side, deep to FDS", LOCATION_ONLY), src("A20", "Deep flexors: under FDS, close to the bones", LOCATION_ONLY)],
  }),

  fn({
    nodeId: m.pronatorQuadratus,
    statement: "Pronator quadratus turns the forearm palm-down (pronation). It is also a dynamic stabiliser of the joint between the two forearm bones at the wrist (the distal radioulnar joint), pressing them together.",
    sources: [
      src("A23", "Summary: Action"),
      src("A24", "Key facts: Function"),
      src("A25", "Abstract", "German-language review; library-record abstract only."),
      src("A26", "Dynamic stabilizers", "Review; says the deep head is the main stabiliser and the superficial head the stronger pronator."),
    ],
  }),
  look({
    nodeId: m.pronatorQuadratus,
    statement: "Pronator quadratus is the most distal muscle of the deepest palm-side layer, a flat square muscle on the bones just above the wrist under the flexor tendons, so it has little or no direct surface definition.",
    sources: [src("A23", "Summary: location", LOCATION_ONLY), src("A24", "Overview", LOCATION_ONLY)],
  }),

  // ---------------------------------------------------------------- back, surface layer
  fn({
    nodeId: m.extensorCarpiRadialisLongus,
    statement: "Extensor carpi radialis longus bends the wrist back (extension) and tilts the hand toward the thumb side (radial deviation).",
    sources: [src("A27", "Key facts: Function"), src("A28", "Quick Facts: Action")],
  }),
  select({
    nodeId: m.extensorCarpiRadialisLongus,
    n: 1,
    statement: "No ordinary exercise is known to train ECRL apart from ECRB. Both bend the wrist back and toward the thumb side, they lie side by side, and EMG texts long held that their activity could not be told apart even with needle electrodes: recording them separately takes fine wires placed by measurement, and surface electrodes record them together. The atlas does not split their work.",
    sources: [
      src("A30", "Abstract", "A methods paper with three volunteers; it shows separate recording is possible, not that exercises load the two differently."),
      src("A29", "Structure and Function: works with ECRL"),
    ],
  }),
  look({
    nodeId: m.extensorCarpiRadialisLongus,
    statement: "ECRL starts just above the elbow on the thumb side and runs beside the brachioradialis in the surface layer of the back of the forearm, so it may contribute to the contour on the back and thumb side near the elbow.",
    sources: [src("A54", "Overview of the superficial group", LOCATION_ONLY), src("A1", "Structure: the mobile wad with ECRL and ECRB", LOCATION_ONLY)],
  }),

  fn({
    nodeId: m.extensorCarpiRadialisBrevis,
    statement: "Extensor carpi radialis brevis bends the wrist back and is described as the main wrist extensor; with ECRL it tilts the hand toward the thumb side.",
    sources: [src("A29", "Introduction; Structure and Function")],
  }),
  select({
    nodeId: m.extensorCarpiRadialisBrevis,
    n: 1,
    statement: "No ordinary exercise is known to train ECRB apart from ECRL. They share both wrist actions and lie side by side, and separating their EMG takes fine wires placed by measurement; surface electrodes record them together. The atlas does not split their work.",
    sources: [
      src("A30", "Abstract", "A methods paper with three volunteers; it shows separate recording is possible, not that exercises load the two differently."),
      src("A29", "Structure and Function: works with ECRL"),
    ],
  }),
  select({
    nodeId: m.extensorCarpiRadialisBrevis,
    n: 2,
    statement: "In a controlled study of 40 arms holding the same wrist-extension force, ECRB was more active with the palm turned down. Forearm rotation therefore belongs in how an exercise is described; the study does not show which position grows the muscle more, and it did not record ECRL.",
    sources: [src("S2", "Abstract: Results", `${ACUTE_EMG} Static holds at three quarters of the neutral-position maximum, healthy adults.`)],
  }),
  look({
    nodeId: m.extensorCarpiRadialisBrevis,
    statement: "ECRB is shorter than ECRL and partly covered by it on the back and thumb side of the forearm, so it belongs to the extensor mass there with only a partly visible outline of its own.",
    sources: [src("A29", "Introduction; Structure: partly covered by ECRL", LOCATION_ONLY)],
  }),

  fn({
    nodeId: m.extensorCarpiUlnaris,
    statement: "Extensor carpi ulnaris bends the wrist back (with ECRL and ECRB) and tilts the hand toward the pinky side (with FCU).",
    sources: [src("A31", "Introduction; Structure and Function", SEARCH_EXCERPT)],
  }),
  select({
    nodeId: m.extensorCarpiUlnaris,
    n: 1,
    statement: "In the controlled wrist-extension study, ECU activity did not change between palm up, thumb up and palm down. That is one acute finding, not evidence that forearm position never matters for ECU.",
    sources: [src("S2", "Abstract: Results", `${ACUTE_EMG} Static holds at three quarters of the neutral-position maximum, healthy adults.`)],
  }),
  look({
    nodeId: m.extensorCarpiUlnaris,
    statement: "ECU runs in the surface layer along the pinky-side edge of the back of the forearm, from the elbow to the wrist, so it may contribute to the contour there.",
    sources: [src("A31", "Structure: attachments", LOCATION_ONLY), src("A54", "Overview of the superficial group", LOCATION_ONLY)],
  }),

  fn({
    nodeId: m.extensorDigitorum,
    statement: "Extensor digitorum straightens the four fingers, mainly at the knuckles (MCP) and also at their other joints, and helps bend the wrist back.",
    sources: [src("A32", "Quick Facts: Action"), src("A33", "Function"), src("A34", "Structure and Function", SEARCH_EXCERPT)],
  }),
  look({
    nodeId: m.extensorDigitorum,
    statement: "Extensor digitorum lies in the middle of the back of the forearm in the surface layer and splits into four tendons about a third of the way down, so it may contribute to the central mass on the back of the forearm. Its tendons on the back of the hand are not muscle bulk.",
    sources: [src("A33", "Overview: belly and tendons", LOCATION_ONLY), src("A54", "Overview of the superficial group", LOCATION_ONLY)],
  }),

  fn({
    nodeId: m.extensorDigitiMinimi,
    statement: "Extensor digiti minimi straightens the little finger, mainly at the knuckle, and can do so independently of the other fingers.",
    sources: [src("A35", "Function"), src("A34", "Structure and Function", SEARCH_EXCERPT)],
  }),
  look({
    nodeId: m.extensorDigitiMinimi,
    statement: "EDM is a thin muscle on the pinky side of extensor digitorum, joined to it near the elbow and separate from about mid-forearm; some anatomists treat it as part of extensor digitorum. It is not a major independent driver of forearm width.",
    sources: [src("A35", "Overview", LOCATION_ONLY), src("A36", "Extensor digiti minimi", LOCATION_ONLY)],
  }),

  // ---------------------------------------------------------------- back, deep layer
  fn({
    nodeId: m.extensorIndicis,
    statement: "Extensor indicis straightens the index finger at its knuckle and other joints, which lets the index finger straighten on its own.",
    sources: [src("A37", "Function"), src("A36", "Extensor indicis"), src("A34", "Structure and Function", SEARCH_EXCERPT)],
  }),
  look({
    nodeId: m.extensorIndicis,
    statement: "Extensor indicis is a narrow muscle in the deep layer of the back of the forearm near the wrist, so it has little or no separately visible contour.",
    sources: [src("A37", "Overview: a deep extensor", LOCATION_ONLY), src("A36", "Extensor indicis: origin", LOCATION_ONLY)],
  }),

  fn({
    nodeId: m.abductorPollicisLongus,
    statement: "Abductor pollicis longus moves the thumb out from the hand at its base (the carpometacarpal joint) and helps straighten it there.",
    sources: [
      src("A38", "Abductor pollicis longus", "Only some rows of this reference were visible in the search results."),
      src("A39", "Function", "Also lists a wrist action that other references describe differently; not used here."),
      src("A40", "Quick Facts: Action"),
    ],
  }),
  look({
    nodeId: m.abductorPollicisLongus,
    statement: "APL is a deep muscle of the back of the forearm whose tendon, with EPB's, forms the thumb-side edge of the hollow at the base of the thumb. A visible line there is mostly tendon; the belly has little separately visible contour.",
    sources: [src("A38", "Anatomical snuffbox note", LOCATION_ONLY), src("A41", "Relations: anatomical snuffbox", LOCATION_ONLY)],
  }),

  fn({
    nodeId: m.extensorPollicisBrevis,
    statement: "Extensor pollicis brevis straightens the thumb at its knuckle (MCP) and helps straighten it at its base.",
    sources: [src("A41", "Function"), src("A42", "Quick Facts: Action")],
  }),
  varies({
    nodeId: m.extensorPollicisBrevis,
    n: 1,
    statement: "Where the EPB tendon attaches varies a good deal between people; in one cadaver study only a quarter of tendons attached in the textbook way, at the base of the thumb's first bone.",
    sources: [src("A43", "Introduction and review of insertion studies", SEARCH_EXCERPT)],
  }),
  look({
    nodeId: m.extensorPollicisBrevis,
    statement: "EPB is small and deep. Its tendon, with APL's, forms the thumb-side edge of the hollow at the base of the thumb, so a visible tendon there says little about the size of the muscle belly.",
    sources: [src("A41", "Overview and relations: anatomical snuffbox", LOCATION_ONLY)],
  }),

  fn({
    nodeId: m.extensorPollicisLongus,
    statement: "Extensor pollicis longus straightens the tip (IP joint) of the thumb and also straightens the thumb at its knuckle (MCP).",
    sources: [src("A44", "Introduction", SEARCH_EXCERPT), src("A45", "Function")],
  }),
  look({
    nodeId: m.extensorPollicisLongus,
    statement: "EPL lies in the deep layer of the back of the forearm. Its long tendon passes around a bony bump on the back of the radius (Lister's tubercle) and forms the pinky-side edge of the hollow at the base of the thumb; the belly has little or no separately visible contour.",
    sources: [src("A44", "Structure: course and the third extensor compartment", LOCATION_ONLY)],
  }),

  fn({
    nodeId: m.supinator,
    statement: "Supinator turns the forearm palm-up (supination) at the joint between the forearm bones near the elbow. With the elbow bent, the biceps is the stronger palm-up muscle; with the elbow straight, the biceps contributes little.",
    sources: [
      src("A46", "Overview and Function"),
      src("A47", "Quick Facts: Action and testing with the elbow straight"),
      src("A50", "Introduction: most powerful supinator when the elbow is flexed"),
    ],
  }),
  look({
    nodeId: m.supinator,
    statement: "Supinator lies in the deep layer just below the elbow, wrapped around the top of the radius under the surface extensors, so it is not directly visible in an ordinary surface view.",
    sources: [src("A46", "Overview and relations: deep in the forearm", LOCATION_ONLY), src("A55", "Overview of the deep group", LOCATION_ONLY)],
  }),

  // ---------------------------------------------------------------- adjacent and external
  fn({
    nodeId: adj.anconeus,
    statement: "Anconeus helps straighten the elbow and helps steady the joint; the triceps does most of the straightening.",
    sources: [src("A48", "Function"), src("A49", "Quick Facts: Action"), src("A38", "Anconeus", "Only some rows of this reference were visible in the search results.")],
  }),
  look({
    nodeId: adj.anconeus,
    statement: "Anconeus is a small triangular muscle at the back of the elbow, between the thumb-side bony knob of the upper-arm bone and the point of the elbow. It may add to the contour at the back of the elbow; it is not a forearm growth target.",
    sources: [src("A48", "Overview: location", LOCATION_ONLY), src("A49", "Quick Facts: location", LOCATION_ONLY)],
  }),

  fn({
    nodeId: ext.biceps,
    statement: "Biceps brachii bends the elbow and turns the forearm palm-up; with the elbow bent it is the forearm's most powerful palm-up muscle.",
    sources: [src("A50", "Introduction", SEARCH_EXCERPT)],
  }),
  look({
    nodeId: ext.biceps,
    statement: "Biceps shapes the front of the upper arm. It is an upper-arm muscle and does not add forearm size.",
    sources: [src("A50", "Introduction: attachments", LOCATION_ONLY)],
  }),

  fn({
    nodeId: ext.brachialis,
    statement: "Brachialis bends the elbow in every forearm position and does not turn the forearm; it is described as a pure elbow flexor.",
    sources: [src("A51", "Introduction", SEARCH_EXCERPT)],
  }),
  look({
    nodeId: ext.brachialis,
    statement: "Brachialis lies under the biceps in the lower front of the upper arm and may show at its sides. It is not a forearm muscle.",
    sources: [src("A51", "Introduction: deeper than the biceps", LOCATION_ONLY)],
  }),
];

/** Claims by id, for node actions and the page's sources disclosure. */
export const forearmClaimById: ReadonlyMap<string, Claim> = new Map(forearmClaims.map((claim) => [claim.id, claim]));
