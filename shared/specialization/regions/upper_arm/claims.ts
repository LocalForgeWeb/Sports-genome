import type { Claim } from "../../types";
import { LOCATION_ONLY as FOREARM_LOCATION_ONLY, SEARCH_EXCERPT as FOREARM_SEARCH_EXCERPT, fn as forearmFn, look as forearmLook, src as forearmSrc } from "../forearm/review";
import { upperArmAdjacentIds as adj, upperArmGroupIds as grp, upperArmMuscleIds as m } from "./ids";
import { ACUTE_EMG, GARBLED_SUMMARY, IMAIOS_MIRROR, LOCATION_ONLY, MODELLED_FORCE, SEARCH_EXCERPT, draftSelect, fn, look, select, src, varies } from "./review";

/**
 * The claims on the upper arm's nodes, with their sources.
 *
 * The forearm's four claims on the biceps and brachialis come first, kept beside the nodes they are
 * about. They belong to the forearm (`ownerRegionId: "forearm"`, from its review of 16 Oct 2026) and
 * keep their keys for good: `forearm:biceps.function`, `forearm:biceps.appearance`,
 * `forearm:brachialis.function`, `forearm:brachialis.appearance` (docs/specialization-atlas/
 * 10-multi-region.md §1.3, §10). The upper-arm page shows the two function claims, which its
 * elbow-flexion and supination node actions rest on, and not the two appearance claims, which speak
 * from the forearm's page.
 *
 * The rest are the upper arm's own (review.ts), from its review of 19 Oct 2026 and the second
 * automated review that corrected it the same day (docs/specialization-atlas/regions/upper_arm/
 * anatomy-evidence.md). Ids are the full node id and the kind (`upper_arm.biceps.function`,
 * `upper_arm.triceps_long.selectivity.1`); each claim's key is `upper_arm:<id>`.
 *
 * Kinds and bases are kept apart, as the forearm's are (brief §2):
 * - `function` claims are physical actions, basis `established_anatomy`, each on three to five
 *   references.
 * - `appearance` claims are always `anatomical_inference`: where a muscle sits and how deep it
 *   lies, read as what part of the outline it MAY contribute to. Never a measured or predicted
 *   change in size.
 * - `selectivity` claims say what muscle-activity (EMG) studies do and do not show. They are
 *   short-term findings, never evidence of growth, and never a credit weight. The one claim that
 *   reports measured muscle size after training is held as a draft (`upper_arm.triceps_long.selectivity.2`).
 * - `variation` claims are differences between people (an extra head of the biceps).
 *
 * Every source was seen through web-search results only; each citation's `qualification` says
 * what the source cannot carry.
 */
export const upperArmClaims: Claim[] = [
  // ---------------------------------------------------------------- the forearm's, frozen (seed v1)
  forearmFn({
    nodeId: m.biceps,
    statement: "Biceps brachii bends the elbow and turns the forearm palm-up; with the elbow bent it is the forearm's most powerful palm-up muscle.",
    sources: [forearmSrc("A50", "Introduction", FOREARM_SEARCH_EXCERPT)],
  }),
  forearmLook({
    nodeId: m.biceps,
    statement: "Biceps shapes the front of the upper arm. It is an upper-arm muscle and does not add forearm size.",
    sources: [forearmSrc("A50", "Introduction: attachments", FOREARM_LOCATION_ONLY)],
  }),

  forearmFn({
    nodeId: m.brachialis,
    statement: "Brachialis bends the elbow in every forearm position and does not turn the forearm; it is described as a pure elbow flexor.",
    sources: [forearmSrc("A51", "Introduction", FOREARM_SEARCH_EXCERPT)],
  }),
  forearmLook({
    nodeId: m.brachialis,
    statement: "Brachialis lies under the biceps in the lower front of the upper arm and may show at its sides. It is not a forearm muscle.",
    sources: [forearmSrc("A51", "Introduction: deeper than the biceps", FOREARM_LOCATION_ONLY)],
  }),

  // ---------------------------------------------------------------- the upper arm's own (19 Oct 2026)
  fn({
    nodeId: m.biceps,
    statement: "The biceps also crosses the shoulder: both heads start on the shoulder blade, the long head just above the shoulder socket and the short head on the coracoid process. Anatomy references list it as helping raise the arm forward (shoulder flexion), and those that rate that help call it weak.",
    sources: [
      src("kenhub.biceps_brachii", "Function", SEARCH_EXCERPT),
      src("loyola.biceps_brachii", "Action", SEARCH_EXCERPT),
      src("teachmeanatomy.arm_muscles", "Biceps brachii: attachments and function", SEARCH_EXCERPT),
      src("elsevier.biceps_brachii", "Quick Facts: Origin", "Cited for the origins only. Search summaries disagreed on whether this entry lists a shoulder action, so the claim no longer says what it lists."),
      src("imaios.biceps_long_head", "Function", "Seen through a web-search summary of the imaios.cn mirror, not the page."),
    ],
  }),
  look({
    nodeId: m.biceps,
    statement: "The biceps is the most superficial muscle on the front of the upper arm and lies over the brachialis, so it may contribute most of the front contour of the upper arm above the elbow crease. Visible shape also depends on neighbouring muscles, body fat and individual anatomy.",
    sources: [
      src("teachmeanatomy.arm_muscles", "Biceps brachii: the most superficial muscle of the front compartment", LOCATION_ONLY),
      src("A51", "Introduction: deeper than the biceps", LOCATION_ONLY),
      src("teachmeanatomy.brachialis", "Brachialis: deep to the biceps", LOCATION_ONLY),
    ],
  }),
  select({
    nodeId: m.biceps,
    n: 1,
    statement: "Whether the way the palm faces changes how hard the biceps works in a curl is not settled. In a surface-EMG study of ten bodybuilders, the biceps was more active with the palm up than with the palm down or the thumb up while lifting, with no difference reported while lowering; in a surface-EMG study of 16 people making slow single elbow bends, its activity did not change between the three positions. Neither study measured growth.",
    sources: [
      src("mdpi.biceps_curl_grips", "Abstract: Results", `${ACUTE_EMG} Ten competitive bodybuilders; sets of six at an eight-repetition maximum. Abstract only.`),
      src("A4", "Abstract: Results", `${ACUTE_EMG} Surface electrodes; slow single repetitions.`),
    ],
  }),
  select({
    nodeId: m.biceps,
    n: 2,
    statement: "Studies disagree on whether the biceps' long head works in shoulder movement at all. With the elbow braced straight, a wire-electrode study of ten shoulders recorded no activity in its long head during shoulder movement; a surface-EMG study of 13 healthy people found low long-head activity that rose when the arm was raised forward or out to the side. A scoping review of the long head concluded that its part in raising the arm is minimal in healthy shoulders. None of these studies measured growth.",
    sources: [
      src("pmid.11408907", "Abstract: Results and Conclusions", `${ACUTE_EMG} Ten shoulders; elbow braced straight. Abstract only.`),
      src("pmid.26535304", "Abstract: Results", `${ACUTE_EMG} Thirteen healthy volunteers; surface electrodes. Abstract only.`),
      src("bmc.long_head_biceps_scoping_review", "Abstract: Results", "A scoping review of 214 articles; only the opening of the abstract was seen."),
    ],
  }),
  varies({
    nodeId: m.biceps,
    n: 1,
    statement: "Some people have one or more extra heads of the biceps. A review pooling 78 studies found them in a minority of arms, more often on one side only than on both and more often in men, and found that they usually cause no symptoms.",
    sources: [
      src("wiley.biceps_accessory_heads", "Abstract", "Pooled cadaver and imaging studies; rates depend on the samples and methods. Abstract only; authors not confirmed."),
    ],
  }),

  look({
    nodeId: m.brachialis,
    statement: "The brachialis lies under the biceps on the front of the lower half of the upper arm and forms part of the floor of the hollow in front of the elbow. Most of it is hidden by the biceps; its outer edge and its lower end lie close to the surface, so it may contribute to the outer side of the lower upper arm beside the biceps. Visible shape also depends on neighbouring muscles, body fat and individual anatomy.",
    sources: [
      src("A51", "Introduction: deeper than the biceps; part of the hollow in front of the elbow", LOCATION_ONLY),
      src("kenhub.brachialis_video", "Video description: mostly under the biceps, surface parts at its outer edge and lower end", "Seen as a video page preview, not the full video; location only."),
      src("teachmeanatomy.brachialis", "Brachialis: deep to the biceps, floor of the hollow in front of the elbow", LOCATION_ONLY),
    ],
  }),

  fn({
    nodeId: grp.triceps,
    statement: "The triceps straightens the elbow; that is its main action. Its three heads, long, lateral and medial, end together on the point of the elbow (the olecranon of the ulna). Only the long head starts on the shoulder blade and crosses the shoulder; the other two start on the back of the upper-arm bone.",
    sources: [
      src("statpearls.triceps", "Introduction; Structure and Function", SEARCH_EXCERPT),
      src("kenhub.triceps_brachii", "Origins, insertion and function", SEARCH_EXCERPT),
      src("loyola.triceps_brachii", "Origin and action", SEARCH_EXCERPT),
    ],
  }),
  look({
    nodeId: grp.triceps,
    statement: "The triceps lies on the back of the upper arm. Its long and lateral heads are at the surface and its medial head lies mostly under them, so together they may make up most of the back-of-arm contour. Visible shape also depends on neighbouring muscles, body fat and individual anatomy.",
    sources: [
      src("radiopaedia.triceps_brachii", "Summary and relations: medial head largely deep to the lateral head", LOCATION_ONLY),
      src("kenhub.triceps_brachii_video", "Video description: palpation of the heads", LOCATION_ONLY),
    ],
  }),

  fn({
    nodeId: m.tricepsLong,
    statement: "The long head straightens the elbow with the other two heads. It is the only head that crosses the shoulder. It starts on the shoulder blade just below the shoulder socket, and references describe a small action there: it helps move the arm down and back (shoulder extension), and some also list drawing it toward the body (adduction). It also helps hold the top of the upper-arm bone in its socket.",
    sources: [
      src("statpearls.triceps", "Structure and Function: long head", SEARCH_EXCERPT),
      src("kenhub.triceps_brachii", "Function", SEARCH_EXCERPT),
      src("imaios.triceps_long_head", "Function", IMAIOS_MIRROR),
      src("radiopaedia.triceps_brachii", "Action", SEARCH_EXCERPT),
      src("loyola.triceps_brachii", "Action: the long head steadies the shoulder joint", SEARCH_EXCERPT),
    ],
  }),
  look({
    nodeId: m.tricepsLong,
    statement: "The long head lies at the surface on the back of the upper arm, running from the shoulder blade just below the shoulder joint to the common tendon at the elbow, so it may contribute to the back-of-arm contour between them. Visible shape also depends on neighbouring muscles, body fat and individual anatomy.",
    sources: [
      src("kenhub.triceps_brachii_video", "Video description: palpation of the heads", LOCATION_ONLY),
      src("anatomyzone.triceps_lateral_head", "Overview: surface and deep heads", LOCATION_ONLY),
      src("statpearls.triceps", "Structure and Function: origin of the long head", LOCATION_ONLY),
    ],
  }),
  select({
    nodeId: m.tricepsLong,
    n: 1,
    statement: "In a study of ten adults straightening the elbow with the upper arm at five heights, from down by the side to straight overhead, surface EMG and a computer model estimated that the long head was the most active head and made the most force with the arm by the side, while the medial head made the most force with the arm at shoulder height or higher. That is short-term activity and modelled force in one small study, not growth.",
    sources: [
      src("aott.triceps_heads", "Abstract: Results", MODELLED_FORCE),
    ],
  }),
  draftSelect({
    nodeId: m.tricepsLong,
    n: 2,
    statement: "Two small training studies compared elbow extensions done with one arm overhead and the other down by the side. In 21 adults over 12 weeks, measured muscle volume rose more in the overhead arm, in the long head and also in the lateral and medial heads together; in nine novice women over six weeks, triceps thickness and strength rose in both arms, with no clear difference between them. These are group results from short studies, not a forecast for any one person, and they are not used to weight credit.",
    sources: [
      src("pmid.35819335", "Abstract: Results", "Training study of 21 adults over 12 weeks, one arm in each position; measured muscle volume, a group result, not a forecast and not a set-credit weight. Abstract only."),
      src("mdpi.triceps_fascicle_length", "Abstract: Results and Conclusions", "Training study of nine novice women over six weeks, one arm in each position; ultrasound thickness, a group result, not a forecast and not a set-credit weight. Abstract only."),
    ],
    why: "Held as a draft, not for want of support: the cited excerpts support each sentence, and a second automated review on 19 Oct 2026 found the same results independently. It reports muscle size measured after training, and the atlas's selectivity claims otherwise report only short-term muscle activity, so whether and in what words it is shown is left to the owner. Automated review, not a clinician or anatomist.",
  }),

  fn({
    nodeId: m.tricepsLateral,
    statement: "The lateral head straightens the elbow. It starts on the back and outer side of the upper-arm bone, above the groove for the radial nerve, and on the sheet of connective tissue on the outer side of the arm, and joins the common triceps tendon on the point of the elbow. It does not cross the shoulder.",
    sources: [
      src("elsevier.triceps_lateral_head", "Quick Facts: Origin, Insertion and Action", SEARCH_EXCERPT),
      src("radiopaedia.triceps_brachii", "Origin: lateral head", SEARCH_EXCERPT),
      src("anatomyzone.triceps_lateral_head", "Origin and action", SEARCH_EXCERPT),
      src("statpearls.triceps", "Structure and Function: only the long head crosses the shoulder", SEARCH_EXCERPT),
      src("imaios.triceps_long_head", "Function: the long head is the only head that crosses the shoulder", IMAIOS_MIRROR),
    ],
  }),
  look({
    nodeId: m.tricepsLateral,
    statement: "The lateral head lies at the surface on the back of the upper arm toward the outer side, from the upper half of the upper-arm bone toward the elbow, so it may contribute to the outer part of the back-of-arm contour. Visible shape also depends on neighbouring muscles, body fat and individual anatomy.",
    sources: [
      src("radiopaedia.triceps_brachii", "Origin: back and outer side of the upper-arm bone", LOCATION_ONLY),
      src("loyola.triceps_brachii", "Origin: lateral head on the upper half of the back of the humerus", LOCATION_ONLY),
      src("kenhub.triceps_brachii_video", "Video description: palpation of the heads", LOCATION_ONLY),
    ],
  }),
  select({
    nodeId: m.tricepsLateral,
    n: 1,
    statement: "Both the lateral and the medial head start on the back of the upper-arm bone, end on the point of the elbow and cross only the elbow, so they share every action; this review found no study showing an ordinary exercise that works one of them without the other. In one study of ten adults, a computer model driven by surface EMG estimated more force from the medial head than from the lateral head with the arm at shoulder height or higher; that is short-term modelled force in one small study, not growth.",
    sources: [
      src("aott.triceps_heads", "Abstract: Results", MODELLED_FORCE),
      src("elsevier.triceps_lateral_head", "Quick Facts: Origin and Insertion", SEARCH_EXCERPT),
      src("elsevier.triceps_medial_head", "Quick Facts: Origin and Insertion", GARBLED_SUMMARY),
    ],
  }),

  select({
    nodeId: m.tricepsMedial,
    n: 1,
    statement: "Both the medial and the lateral head start on the back of the upper-arm bone, end on the point of the elbow and cross only the elbow, so they share every action; this review found no study showing an ordinary exercise that works one of them without the other. In one study of ten adults, a computer model driven by surface EMG estimated more force from the medial head than from the lateral head with the arm at shoulder height or higher; that is short-term modelled force in one small study, not growth.",
    sources: [
      src("aott.triceps_heads", "Abstract: Results", MODELLED_FORCE),
      src("elsevier.triceps_lateral_head", "Quick Facts: Origin and Insertion", SEARCH_EXCERPT),
      src("elsevier.triceps_medial_head", "Quick Facts: Origin and Insertion", GARBLED_SUMMARY),
    ],
  }),
  fn({
    nodeId: m.tricepsMedial,
    statement: "The medial head straightens the elbow. It starts on the back of the upper-arm bone below the groove for the radial nerve, ends on the point of the elbow with the other two heads and does not cross the shoulder. Some of its deepest fibres attach to the capsule at the back of the elbow joint; an anatomy teaching reference says they draw the capsule back as the elbow straightens, but a dissection study of 18 elbows found that pulling on them pressed the capsule rather than drawing it back.",
    sources: [
      src("elsevier.triceps_medial_head", "Quick Facts: Origin, Insertion and Action; fibres to the elbow joint capsule", GARBLED_SUMMARY),
      src("loyola.triceps_brachii", "Action: the medial head draws back the elbow joint capsule", SEARCH_EXCERPT),
      src("statpearls.triceps", "Structure and Function: the medial head has no shoulder action", SEARCH_EXCERPT),
      src("viamedica.subanconeus", "Abstract: Results and Conclusions", "Dissection of 18 cadaver elbows. Abstract only, seen through web-search summaries."),
    ],
  }),
  look({
    nodeId: m.tricepsMedial,
    statement: "The medial head lies mostly under the long and lateral heads on the lower half of the back of the upper-arm bone; one dissection study found that its muscle reaches closer to the elbow than theirs. It has little or no contour of its own, and one anatomy reference says it cannot be felt through the skin.",
    sources: [
      src("radiopaedia.triceps_brachii", "Relations: medial head largely deep to the lateral head", LOCATION_ONLY),
      src("kenhub.triceps_brachii_video", "Video description: the medial head cannot be felt", LOCATION_ONLY),
      src("pmid.16735585", "Abstract: Results", "Dissection of eight cadaver elbows; location only. Abstract only."),
      src("loyola.triceps_brachii", "Origin: medial head deep on the lower half of the back of the humerus", LOCATION_ONLY),
      src("kenhub.triceps_brachii", "Medial head: overlapped by the long and lateral heads", LOCATION_ONLY),
    ],
  }),

  fn({
    nodeId: adj.coracobrachialis,
    statement: "Coracobrachialis raises the arm forward at the shoulder (flexion) and helps draw it toward the body (adduction). It runs from the coracoid process of the shoulder blade to the inner side of the upper-arm bone about halfway down, so it does not cross the elbow.",
    sources: [
      src("kenhub.coracobrachialis", "Overview; Function", SEARCH_EXCERPT),
      src("elsevier.coracobrachialis", "Quick Facts: Origin, Insertion and Action", SEARCH_EXCERPT),
      src("loyola.coracobrachialis", "Action", SEARCH_EXCERPT),
      src("teachmeanatomy.arm_muscles", "Coracobrachialis: function", SEARCH_EXCERPT),
    ],
  }),
  look({
    nodeId: adj.coracobrachialis,
    statement: "Coracobrachialis is a slender muscle on the inner side of the upper arm near the armpit, behind the pectoralis major and on the inner side of the biceps and brachialis, so it has little or no contour of its own. It can be felt in the armpit, where with the upper-arm bone it forms the outer edge.",
    sources: [
      src("kenhub.coracobrachialis", "Overview and palpation: border of the armpit", LOCATION_ONLY),
      src("elsevier.coracobrachialis", "Relations", LOCATION_ONLY),
    ],
  }),
];
