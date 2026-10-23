import { forearmTendonSources } from "../../sources/forearmTendon";
import type { NodeId, RegionExtras, ReviewStatus, TendonArea, TendonCitation, TendonGroup, TendonMember, TendonNotPlaced } from "../../types";
import { FOREARM_REGION_ID, forearmMuscleIds as m } from "./ids";
import { SEARCH_EXCERPT as SEARCH } from "./review";

/**
 * The forearm's tendon areas (docs/specialization-atlas/11-forearm-research-and-stack.md §4.1): where
 * each muscle attaches, grouped into four areas the page counts sets by. Region data, loaded only when
 * the tendon exposure section opens, never with the page (§4.6); the forearm opts in with
 * `sections.tendonExposure` in its content, which never imports this file.
 *
 * **A muscle belongs to the area of each place it attaches**, where it starts and where it ends, so a
 * wrist curl counts at the inner elbow (where FCR and FCU start) and at the front of the wrist (where
 * they end). Areas overlap, so their counts are never added together. Each muscle keeps the research
 * package's regional group (muscles.json `regional_groups`) as `packageGroups`, for traceability only:
 * the package's eleven groups are by origin alone and are not the areas.
 *
 * **One group is placed by a route, not an attachment:** "Thumb side of the wrist" counts the APL and
 * EPB tendons where they pass the wrist together, in the first dorsal compartment (the package's
 * thumb-abductor-extensor region). APL also ends there, at the base of the thumb's metacarpal; EPB ends
 * on the thumb, so by the attachment rule it is in the "Thumb" group as well. Every other tendon that
 * only passes the wrist (the finger extensors', EPL's, the finger flexors') is counted where it
 * attaches, and the caveats say so.
 *
 * **These are region records, not claims** (§1.6): a claim's kind is function, appearance,
 * selectivity or variation, and an attachment is none of them. They live only in the app's code.
 *
 * **Review.** Each (group, muscle) pair carries its own status, so a draft pair keeps that one muscle
 * out of that one group while the group's reviewed members count. A pair is reviewed only where the
 * cited sources' excerpts say the muscle attaches there, checked through web search on 22 Oct 2026
 * (page fetches fail in this build). Its `reviewNote` names every cited source by id with what its
 * excerpt said; the full record, with every locator and what each source leaves open, is
 * regions/forearm/tendon-areas.md. Every pair here rests on at least two sources, so none is
 * single-source.
 *
 * Three pairs the design held as drafts until a second source agreed (§4.1) are reviewed, because a
 * second source agreed for each: ECU in the common extensor origin (Kenhub's ECU page agrees with
 * Radiopaedia; StatPearls, A31, agrees too but confuses the shared tendon with the ulnar head's
 * aponeurosis, and its citation says so), the supinator around the outer elbow (Kenhub, A46, and
 * Elsevier, A47), and the pronator quadratus above the wrist (Radiopaedia, A23, and Kenhub, A24). So
 * every own target muscle is placed, and `tendonNotPlaced` is empty. A pair returned to draft keeps
 * its muscle out of that group only; a muscle left with no reviewed group goes to `tendonNotPlaced`
 * with the reason.
 *
 * **Kept out, as the package's §6.1 asks:** ECRL is never in the common extensor origin (it starts on
 * the ridge above; a small part from the shared tendon is said in the caveats), and FDP and FPL are
 * never in the common flexor origin (they start on the forearm bones). The anconeus, an adjacent
 * muscle, and the upper arm's biceps and brachialis, external members, are in no group: their
 * attachments are outside the forearm's own areas. Each area's description names only its reviewed
 * members, never a class of muscles ("the wrist flexors") that would take in one it does not hold.
 *
 * Copy: inner and outer, thumb side and pinky side, front and back; never a screen direction or a
 * side of the body, and none of the words §4.4 keeps out of the section (forearmTendonAreas.test.ts).
 * Muscles are named as the forearm's claims name them: the short name (FCR, ECRB) where the page's
 * row shows one beside the name, the name (palmaris longus, the brachioradialis) where the claims do.
 */

const REVIEWED = "Checked against the cited sources' web-search excerpts on 22 Oct 2026 (page fetches fail in this build); automated review, not a clinician or anatomist.";
const SECOND_SOURCE = "Held as a draft in the design until a second source agreed.";

/** The package's `regional_groups` per muscle (muscles.json, by code), carried on every membership of that muscle. */
const packageGroupsOf: Readonly<Record<NodeId, string[]>> = {
  [m.brachioradialis]: ["br-attachments"],
  [m.flexorCarpiRadialis]: ["medial-flexor-origin"],
  [m.flexorCarpiUlnaris]: ["medial-flexor-origin"],
  [m.palmarisLongus]: ["medial-flexor-origin"],
  [m.flexorDigitorumSuperficialis]: ["medial-flexor-origin"],
  [m.flexorDigitorumProfundus]: ["deep-digital-flexors"],
  [m.flexorPollicisLongus]: ["thumb-flexor"],
  [m.pronatorTeres]: ["medial-flexor-origin"],
  [m.pronatorQuadratus]: ["distal-rotators"],
  [m.extensorCarpiRadialisLongus]: ["radial-wrist-extensors"],
  [m.extensorCarpiRadialisBrevis]: ["lateral-extensor-origin"],
  [m.extensorCarpiUlnaris]: ["lateral-extensor-origin"],
  [m.extensorDigitorum]: ["lateral-extensor-origin"],
  [m.extensorDigitiMinimi]: ["lateral-extensor-origin"],
  [m.extensorIndicis]: ["deep-digital-extensors"],
  [m.abductorPollicisLongus]: ["thumb-abductor-extensor-region"],
  [m.extensorPollicisBrevis]: ["thumb-abductor-extensor-region"],
  [m.extensorPollicisLongus]: ["thumb-long-extensor"],
  [m.supinator]: ["proximal-supinator-attachments"],
};

const cite = (sourceId: string, locator: string, qualification: string | null = null): TendonCitation => ({ sourceId, locator, qualification });

/**
 * One (group, muscle) pair. `excerpts` names each cited source by id, then what its excerpt showed
 * ("A53: …"); it follows the review sentence in `reviewNote`. A draft pair says instead why it is not
 * reviewed.
 */
function member(nodeId: NodeId, citations: TendonCitation[], excerpts: string, options: { reviewStatus?: ReviewStatus; singleSource?: boolean } = {}): TendonMember {
  const reviewStatus = options.reviewStatus ?? "reviewed";
  return {
    nodeId,
    citations,
    packageGroups: [...packageGroupsOf[nodeId]],
    reviewStatus,
    reviewNote: reviewStatus === "reviewed" ? `${REVIEWED} ${excerpts}` : excerpts,
    singleSource: options.singleSource ?? false,
  };
}

const BR_ORIGIN = "This sentence came from the same StatPearls article's point-of-care page (statpearls.com/point-of-care/18504); the Bookshelf excerpt named the ridge without its extent.";
const BR_INSERTION = "This sentence came from the same StatPearls article's point-of-care page (statpearls.com/point-of-care/18504); the Bookshelf excerpt did not include the insertion.";
const VARIABLY = "Says FCR and palmaris longus start on the medial epicondyle, over FDS, but counts them only variably as part of the shared tendon itself.";
const SNUFFBOX = "Places the tendon at the thumb-side border of the hollow at the base of the thumb (the anatomical snuffbox), which lies at the wrist; it does not name the compartment.";

// ---------------------------------------------------------------- inner elbow

const commonFlexorOrigin: TendonGroup = {
  id: "forearm.tendon.common_flexor_origin",
  label: "Common flexor origin",
  members: [
    member(m.pronatorTeres, [
      cite("A53", "Overview of the superficial group", SEARCH),
      cite("radiopaedia.common_flexor_origin", "Article text: the shared tendon and the muscles that form it", SEARCH),
      cite("A22", "Key facts: Origin", "Places the upper (humeral) head on the medial supracondylar ridge, just above the epicondyle, rather than on the shared tendon; the deeper head starts on the coronoid process of the ulna."),
    ], "A53: pronator teres, FCR, palmaris longus, FCU and FDS share the common flexor origin on the medial epicondyle. radiopaedia.common_flexor_origin: a thick tendon from the medial epicondyle, splitting into a front-upper portion formed by pronator teres and FDS and a back-lower portion formed by FDS and FCU. A22: humeral head from the medial supracondylar ridge, ulnar head from the coronoid process."),
    member(m.flexorCarpiRadialis, [
      cite("A53", "Overview of the superficial group", SEARCH),
      cite("radiopaedia.common_flexor_origin", "Article text: FCR and palmaris longus", VARIABLY),
      cite("A6", "Key facts: Origin and insertion", SEARCH),
    ], "A53: FCR is one of the five superficial muscles sharing the common flexor origin on the medial epicondyle. radiopaedia.common_flexor_origin: FCR arises from the medial epicondyle and is counted variably to the common flexor origin. A6: from the medial epicondyle to the bases of metacarpals 2 and 3."),
    member(m.palmarisLongus, [
      cite("A53", "Overview of the superficial group", SEARCH),
      cite("radiopaedia.common_flexor_origin", "Article text: FCR and palmaris longus", VARIABLY),
      cite("elsevier.palmaris_longus", "Quick Facts: Origin", SEARCH),
    ], "A53: palmaris longus is one of the five sharing the common flexor origin. radiopaedia.common_flexor_origin: it arises from the medial epicondyle and is counted variably to the common flexor origin. elsevier.palmaris_longus: origin the medial epicondyle via the common flexor tendon."),
    member(m.flexorCarpiUlnaris, [
      cite("A53", "Overview of the superficial group", SEARCH),
      cite("radiopaedia.common_flexor_origin", "Article text: the shared tendon and the muscles that form it", SEARCH),
      cite("kenhub.flexor_carpi_ulnaris", "Origin", "The larger (ulnar) head starts on the olecranon and the back of the ulna, not on the shared tendon."),
    ], "A53: FCU is one of the five sharing the common flexor origin. radiopaedia.common_flexor_origin: FCU forms the back-lower portion of the common tendon from the medial epicondyle, with FDS. kenhub.flexor_carpi_ulnaris: the smaller humeral head arises from the common flexor origin on the medial epicondyle; the larger ulnar head from the olecranon and the posterior border of the ulna."),
    member(m.flexorDigitorumSuperficialis, [
      cite("A53", "Overview of the superficial group", "Groups FDS with the four surface muscles; a teaching source it notes places FDS in a middle layer beneath them."),
      cite("radiopaedia.common_flexor_origin", "Article text: the shared tendon and the muscles that form it", SEARCH),
      cite("A12", "Structure and Function: origins", "Its second (radial) head starts on the front of the radius, not on the shared tendon."),
      cite("kenhub.flexor_digitorum_superficialis", "Origin", SEARCH),
    ], "A53: FDS is listed with the muscles sharing the common flexor origin. radiopaedia.common_flexor_origin: FDS forms part of both portions of the common tendon, deep to FCR and palmaris longus. A12: the humeroulnar head starts on the medial epicondyle and the coronoid process; the radial head on the upper half of the front of the radius. kenhub.flexor_digitorum_superficialis: the humeroulnar head from the medial epicondyle via the common flexor tendon."),
  ],
  caveat: "Not every member starts only here: pronator teres and FCU also have a head on the ulna, and FDS one on the radius, and one reference puts the upper head of pronator teres on the ridge just above the bony knob. One reference counts FCR and palmaris longus only sometimes as part of the shared tendon, though both start on the knob. The deep finger flexor (FDP) and the long thumb flexor (FPL) start on the forearm bones, so they are not counted here, even where a reference lists a possible extra origin of FPL from the knob. Palmaris longus is missing in some people.",
};

// ---------------------------------------------------------------- outer elbow

const commonExtensorOrigin: TendonGroup = {
  id: "forearm.tendon.common_extensor_origin",
  label: "Common extensor origin",
  members: [
    member(m.extensorCarpiRadialisBrevis, [
      cite("radiopaedia.common_extensor_origin", "Article text: the tendinous portions, front to back", SEARCH),
      cite("A29", "Structure and Function: origin", "Also reports a variant in which ECRB starts from the fascia of the extensor digitorum instead of the epicondyle."),
      cite("elsevier.extensor_carpi_radialis_brevis", "Quick Facts: Origin", SEARCH),
    ], "radiopaedia.common_extensor_origin: ECRB is the front-most tendinous portion of the common extensor origin on the lateral epicondyle. A29: originates from the lateral epicondyle by a common tendon. elsevier.extensor_carpi_radialis_brevis: origin the lateral epicondyle via the common extensor tendon."),
    member(m.extensorDigitorum, [
      cite("radiopaedia.common_extensor_origin", "Article text: the tendinous portions, front to back", SEARCH),
      cite("A32", "Quick Facts: Origin", SEARCH),
    ], "radiopaedia.common_extensor_origin: the extensor digitorum, with EDM, is the middle tendinous portion of the common extensor origin, its origin coalescent with ECRB's. A32: arises from the common extensor tendon, with the adjacent fascia of the forearm."),
    member(m.extensorDigitiMinimi, [
      cite("radiopaedia.common_extensor_origin", "Article text: the tendinous portions, front to back", SEARCH),
      cite("A35", "Origin", SEARCH),
    ], "radiopaedia.common_extensor_origin: EDM, with the extensor digitorum, is the middle tendinous portion of the common extensor origin. A35: arises from the lateral epicondyle through the common extensor tendon it shares with the extensor digitorum, ECRB and ECU."),
    member(m.extensorCarpiUlnaris, [
      cite("radiopaedia.common_extensor_origin", "Article text: the tendinous portions, front to back", "Says ECU's part of the shared tendon can be separated by a thick fascia, while the ECRB and extensor digitorum origins merge."),
      cite("kenhub.extensor_carpi_ulnaris", "Origin", SEARCH),
      cite("A31", "Structure and Function: origin", "Says the humeral head starts from the common extensor tendon on the lateral epicondyle, but also that this tendon is shared by FCU, FDP and the deep fascia of the forearm, which describes the ulnar head's aponeurosis instead; only the humeral-head sentence is relied on, beside Kenhub's."),
    ], "radiopaedia.common_extensor_origin: ECU is the back-most tendinous portion of the common extensor origin, separable by a thick fascia. kenhub.extensor_carpi_ulnaris: originates from the lateral epicondyle via the common extensor tendon, a common origin for ECU, the extensor digitorum, ECRB and EDM, and from the posterior border of the ulna; the clean second source beside Radiopaedia. A31: the humeral head originates from the common extensor tendon on the lateral epicondyle and the ulnar head from an aponeurosis on the back of the ulna, though it also calls the common extensor tendon shared by FCU, FDP and the deep fascia, confusing it with that aponeurosis. " + SECOND_SOURCE),
  ],
  caveat: "ECRB, ECU, the extensor digitorum and EDM start here from one shared tendon. ECU also starts from the back of the ulna, and one reference says its part of the tendon can be told apart by a thick layer of fascia, while the ECRB and extensor digitorum parts merge. ECRL is not counted here: it starts on the ridge above, though two references say a small part of it also comes from this tendon.",
};

const outerRidge: TendonGroup = {
  id: "forearm.tendon.outer_ridge",
  label: "Ridge above the outer elbow",
  members: [
    member(m.extensorCarpiRadialisLongus, [
      cite("A27", "Origin", "Also says a small part of its fibres starts from the common extensor tendon on the lateral epicondyle."),
      cite("A28", "Quick Facts: Origin", SEARCH),
      cite("imaios.extensor_carpi_radialis_longus", "Origin", "Also lists some fibres from the common extensor origin on the lateral epicondyle."),
    ], "A27: the majority of the muscle originates from the distal third of the lateral supracondylar ridge and the lateral intermuscular septum, a small portion from the common extensor tendon. A28: inferior one third of the lateral supracondylar ridge, below the origin of the brachioradialis. imaios.extensor_carpi_radialis_longus: the lower third of the lateral supracondylar ridge, just below the brachioradialis, with some fibres from the septum and the common extensor origin."),
    member(m.brachioradialis, [
      cite("A1", "Structure and Function: origin", BR_ORIGIN),
      cite("A2", "Origin", SEARCH),
      cite("A3", "Key facts: Origin", SEARCH),
    ], "A1: originates from the proximal two-thirds of the lateral supracondylar ridge. A2: from the superior two thirds of the lateral supracondylar ridge, which lies above the origin of ECRL, and the adjacent intermuscular septa. A3: origin the lateral supracondylar ridge and the lateral intermuscular septum."),
  ],
  caveat: "The brachioradialis starts on the upper two-thirds of this ridge and ECRL on its lower third, just above the bony knob. Two references say a small part of ECRL also starts from the common extensor tendon; at the outer elbow, ECRL is counted on the ridge only.",
};

const supinatorAttachments: TendonGroup = {
  id: "forearm.tendon.supinator",
  label: "Supinator",
  members: [
    member(m.supinator, [
      cite("A46", "Origin and insertion", SEARCH),
      cite("A47", "Quick Facts: Origin and Insertion; Origin", "Its Quick Facts give the lateral epicondyle and the supinator crest and fossa of the ulna; the radial collateral and annular ligaments are in its longer Origin section."),
    ], "A46: origin the lateral epicondyle, the radial collateral ligament, the annular ligament and the supinator crest of the ulna; insertion the upper third of the radius, on its front, outer and back surfaces. A47: Quick Facts origin the lateral epicondyle and the supinator crest and fossa of the ulna, with the radial collateral and annular ligaments in its Origin section; insertion the front, outer and back of the proximal third of the radius. " + SECOND_SOURCE + " Both are library records the design's search already had; it found the ligament and crest attachments only in study aids, and these excerpts give them."),
  ],
  caveat: null,
};

// ---------------------------------------------------------------- wrist and thumb

const wristFront: TendonGroup = {
  id: "forearm.tendon.wrist_front",
  label: "Front of the wrist",
  members: [
    member(m.flexorCarpiRadialis, [
      cite("A6", "Key facts: Origin and insertion", SEARCH),
      cite("A7", "Insertion", "Mainly on the base of the second metacarpal, and variably also the third."),
    ], "A6: from the medial epicondyle to the bases of metacarpals 2 and 3. A7: the tendon inserts primarily on the base of the second metacarpal and variably on the base of the third."),
    member(m.flexorCarpiUlnaris, [
      cite("A8", "Structure and Function: attachments", SEARCH),
      cite("kenhub.flexor_carpi_ulnaris", "Insertion", SEARCH),
    ], "A8: inserts on the pisiform, the hook of the hamate and the fifth metacarpal. kenhub.flexor_carpi_ulnaris: inserts on the pisiform, the hamate and the base of the fifth metacarpal."),
    member(m.palmarisLongus, [
      cite("kenhub.palmaris_longus", "Course and insertion", SEARCH),
      cite("elsevier.palmaris_longus", "Quick Facts: Insertion", SEARCH),
      cite("A9", "Structure and Function; Clinical Significance", "Commonly absent; its absence has not been shown to reduce grip strength."),
    ], "kenhub.palmaris_longus: the tendon enters the palm superficial to the flexor retinaculum, a few fibres blending with it and most inserting into the palmar aponeurosis. elsevier.palmaris_longus: insertion the palmar aponeurosis and the flexor retinaculum. A9: tensions the palmar aponeurosis; commonly absent."),
  ],
  caveat: "FCR ends mainly at the base of the index finger's hand bone and sometimes the middle finger's as well; FCU ends at the pisiform and nearby bones on the pinky side; palmaris longus ends in the sheet of tissue in the palm, not on bone, and is missing in some people.",
};

const wristBack: TendonGroup = {
  id: "forearm.tendon.wrist_back",
  label: "Back of the wrist",
  members: [
    member(m.extensorCarpiRadialisLongus, [
      cite("A27", "Key facts: Insertion", SEARCH),
      cite("A28", "Quick Facts: Insertion", SEARCH),
    ], "A27: inserts on the back of the base of the second metacarpal. A28: the dorsal base of the second metacarpal."),
    member(m.extensorCarpiRadialisBrevis, [
      cite("A29", "Structure and Function: insertion", SEARCH),
      cite("elsevier.extensor_carpi_radialis_brevis", "Quick Facts: Insertion", SEARCH),
    ], "A29: inserts at the base of the third metacarpal, on the thumb side of its back surface. elsevier.extensor_carpi_radialis_brevis: the dorsal base of the third metacarpal."),
    member(m.extensorCarpiUlnaris, [
      cite("A31", "Structure and Function: insertion", SEARCH),
      cite("kenhub.extensor_carpi_ulnaris", "Insertion", SEARCH),
    ], "A31: inserts on the dorsal base of the fifth metacarpal through the sixth extensor compartment. kenhub.extensor_carpi_ulnaris: passes over the triquetrum and inserts on the base of the fifth metacarpal."),
  ],
  caveat: "ECRL ends at the base of the index finger's hand bone, ECRB at the middle finger's and ECU at the little finger's. The finger extensors' tendons and EPL's also pass the back of the wrist; like every tendon here but the two in the thumb-side tunnel, they are counted where they attach, on the fingers and the thumb.",
};

const wristThumbSide: TendonGroup = {
  id: "forearm.tendon.wrist_thumb_side",
  label: "Thumb side of the wrist",
  members: [
    member(m.abductorPollicisLongus, [
      cite("A38", "Abductor pollicis longus; anatomical snuffbox", SNUFFBOX),
      cite("A41", "Relations: anatomical snuffbox", SNUFFBOX),
      cite("pmid.19092992", "Abstract", "A cadaver study of 32 wrists, seen as an abstract through search; APL had one to four slips."),
      cite("A40", "Quick Facts: Insertion", "May also insert on the trapezium."),
      cite("A39", "Insertion", "Its tendon splits into two slips, to the base of the first metacarpal and to the trapezium."),
    ], "A38: the APL and EPB tendons form the thumb-side border of the anatomical snuffbox. A41: EPB, with the APL tendon, forms that border. pmid.19092992: the APL and EPB tendons occupy the first dorsal compartment, beside the radial styloid. A40: insertion the lateral aspect of the base of the first metacarpal, possibly also the trapezium. A39: the tendon splits into two slips that insert on the base of the first metacarpal and the trapezium."),
    member(m.extensorPollicisBrevis, [
      cite("A38", "Abductor pollicis longus; anatomical snuffbox", SNUFFBOX),
      cite("A41", "Relations: anatomical snuffbox", SNUFFBOX),
      cite("pmid.19092992", "Abstract", "A cadaver study of 32 wrists, seen as an abstract through search; EPB had a compartment of its own in just over a third of them."),
    ], "A38: the APL and EPB tendons form the thumb-side border of the anatomical snuffbox. A41: EPB, with the APL tendon, forms that border. pmid.19092992: both tendons occupy the first dorsal compartment, beside the radial styloid. Placed here by the tendon's route past the wrist; EPB ends on the thumb, in the Thumb group."),
  ],
  caveat: "This group counts the APL and EPB tendons where they pass the wrist together, in the first of the tunnels on the back of the wrist, beside the bony tip of the radius: the one place here counted by a tendon's route rather than where it attaches. APL also ends here, at the base of the thumb's hand bone and sometimes the trapezium; EPB ends on the thumb and is counted there as well. In a cadaver study EPB had a tunnel of its own in just over a third of wrists, and APL split into one to four slips.",
};

const thumb: TendonGroup = {
  id: "forearm.tendon.thumb",
  label: "Thumb",
  members: [
    member(m.flexorPollicisLongus, [
      cite("A19", "Key facts: Origin and insertion", SEARCH),
      cite("elsevier.flexor_pollicis_longus", "Quick Facts: Insertion", SEARCH),
    ], "A19: origin the front of the radius and the interosseous membrane; insertion the palmar surface of the thumb's distal phalanx. elsevier.flexor_pollicis_longus: the palmar base of the distal phalanx of the thumb."),
    member(m.extensorPollicisLongus, [
      cite("A45", "Key facts: Insertion", SEARCH),
      cite("elsevier.extensor_pollicis_longus", "Quick Facts: Insertion", SEARCH),
      cite("A44", "Introduction; Structure: course", "Gives the tendon's route around the dorsal tubercle of the radius to the thumb; the search summary of its insertion sentence was garbled, so the end on the thumb rests on the other two."),
    ], "A45: inserts on the back of the base of the thumb's distal phalanx. elsevier.extensor_pollicis_longus: a long tendon to the dorsal base of the distal phalanx of the thumb. A44: passes over Lister's tubercle as the only occupant of the third extensor compartment."),
    member(m.extensorPollicisBrevis, [
      cite("A42", "Quick Facts: Insertion", SEARCH),
      cite("A41", "Key facts: Insertion", SEARCH),
      cite("A43", "Introduction and review of insertion studies", "Where the EPB tendon ends on the thumb varies: in one cadaver study only a quarter ended in the textbook place, the base of the first phalanx."),
    ], "A42: inserts on the dorsal base of the proximal phalanx of the thumb. A41: insertion the posterior aspect of the base of the proximal phalanx of the thumb. A43: textbook accounts of the EPB insertion disagree with cadaver studies."),
  ],
  caveat: "FPL ends on the palm side of the thumb's end bone and EPL on its back, after bending around a bony bump on the back of the radius; EPB ends on the back of the thumb's first bone, though where exactly varies between people. FPL is missing, or joined to a neighbouring flexor, in a small number of people.",
};

const radialStyloid: TendonGroup = {
  id: "forearm.tendon.radial_styloid",
  label: "Radial styloid",
  members: [
    member(m.brachioradialis, [
      cite("A1", "Structure and Function: insertion", BR_INSERTION),
      cite("A3", "Key facts: Insertion", "Gives the end as just above (proximal to) the styloid process."),
      cite("A2", "Insertion", "Gives the end on the outer side of the lower radius, just above the styloid process."),
    ], "A1: inserts on the base of the radial styloid process through a thin tendon. A3: insertion proximal to the styloid process of the radius. A2: attaches to the outer side of the distal radius, above the styloid."),
  ],
  caveat: "References differ slightly on where the brachioradialis ends: at the base of the radial styloid, the bony tip of the radius on the thumb side of the wrist, or just above it. It does not cross the wrist.",
};

const aboveWristDeep: TendonGroup = {
  id: "forearm.tendon.above_wrist_deep",
  label: "Above the wrist, deep",
  members: [
    member(m.pronatorQuadratus, [
      cite("A23", "Summary: origin and insertion", SEARCH),
      cite("A24", "Key facts: Origin and insertion", SEARCH),
    ], "A23: from the front of the distal quarter of the ulna to the front of the distal quarter of the radius. A24: origin the distal front surface of the ulna, insertion the distal front surface of the radius. " + SECOND_SOURCE + " A24 is that source."),
  ],
  caveat: "Pronator quadratus does not cross the wrist: both its ends are on the front of the two forearm bones, in their last quarter above the wrist.",
};

// ---------------------------------------------------------------- fingers

const fingerFlexors: TendonGroup = {
  id: "forearm.tendon.finger_flexors",
  label: "Finger flexors",
  members: [
    member(m.flexorDigitorumSuperficialis, [
      cite("A12", "Structure and Function: insertion", SEARCH),
      cite("kenhub.flexor_digitorum_superficialis", "Insertion", SEARCH),
    ], "A12: its tendinous slips insert on the bases of the middle phalanges of the second to fifth digits. kenhub.flexor_digitorum_superficialis: its tendons split near the wrist and attach to the middle phalanges of digits 2 to 5."),
    member(m.flexorDigitorumProfundus, [
      cite("A15", "Quick Facts: Insertion", SEARCH),
      cite("A14", "Structure and Function", "Gives the tendons' course, deep to the FDS tendons, and the end joints they bend, rather than the bone they end on."),
    ], "A15: inserts on the palmar bases of the distal phalanges of the index, middle, ring and little fingers. A14: its tendons insert deep to the FDS tendons, and it is the only muscle that bends the end (DIP) joints of the four fingers."),
  ],
  caveat: "FDS and FDP each send a tendon to each of the four fingers, FDS ending on the middle bones and FDP on the end bones; the counts do not tell one finger from another.",
};

const fingerExtensors: TendonGroup = {
  id: "forearm.tendon.finger_extensors",
  label: "Finger extensors",
  members: [
    member(m.extensorDigitorum, [
      cite("A33", "Overview: belly and tendons", SEARCH),
      cite("A32", "Quick Facts: Insertion", SEARCH),
    ], "A33: its belly ends in four tendons that pass under the extensor retinaculum to digits 2 to 5. A32: inserts on the dorsal bases of the middle and distal phalanges of the index to little fingers."),
    member(m.extensorDigitiMinimi, [
      cite("A36", "Extensor digiti minimi", "Notes that some anatomists regard it as the ulnar-most part of the extensor digitorum."),
      cite("A35", "Key facts: Insertion", SEARCH),
    ], "A36: inserts into the extensor expansion of the fifth digit. A35: inserts on the extensor expansion of digit 5."),
    member(m.extensorIndicis, [
      cite("A37", "Key facts: Insertion", SEARCH),
      cite("A36", "Extensor indicis", SEARCH),
    ], "A37: its tendon joins the extensor digitorum's index tendon and inserts in the extensor expansion on the back of the index finger's first phalanx. A36: arises from the distal back of the ulna and the interosseous membrane and joins the index tendon of the extensor digitorum."),
  ],
  caveat: "The extensor digitorum sends a tendon to each of the four fingers; EI joins its tendon to the index finger, EDM ends on the little finger's extensor expansion, and some anatomists treat EDM as part of the extensor digitorum. The counts do not tell one finger from another.",
};

/** The four areas of §4.1, in the page's order, each with its groups as tabled there (and EPB, by its end, in "Thumb"). */
export const forearmTendonAreaList: TendonArea[] = [
  {
    id: "forearm.tendon.inner_elbow",
    label: "Inner elbow",
    description: "The bony knob on the inner side of the elbow, on the pinky side with the palm facing forward, where FCR, FCU, palmaris longus, FDS and pronator teres start from a shared tendon.",
    groups: [commonFlexorOrigin],
  },
  {
    id: "forearm.tendon.outer_elbow",
    label: "Outer elbow",
    description: "The bony knob on the outer side of the elbow, on the thumb side with the palm facing forward, and the ridge above it. ECRB, ECU, the extensor digitorum and EDM start from a shared tendon on the knob; the brachioradialis and ECRL start on the ridge above it; and the supinator starts from the knob, the ligaments beside it and the top of the ulna, and wraps the top of the radius.",
    groups: [commonExtensorOrigin, outerRidge, supinatorAttachments],
  },
  {
    id: "forearm.tendon.wrist_and_thumb",
    label: "Wrist and thumb",
    description: "Where FCR and FCU end at the base of the hand on the palm side, and palmaris longus in the palm; where ECRL, ECRB and ECU end at the base of the hand on the back; where APL and EPB pass the wrist on the thumb side, and APL ends at the base of the thumb; where FPL, EPL and EPB end on the thumb; and where the brachioradialis and pronator quadratus end on the forearm bones just above the wrist.",
    groups: [wristFront, wristBack, wristThumbSide, thumb, radialStyloid, aboveWristDeep],
  },
  {
    id: "forearm.tendon.fingers",
    label: "Fingers",
    description: "The long tendons that end on the four fingers: FDS and FDP on the palm side, and the extensor digitorum, EDM and EI on the back.",
    groups: [fingerFlexors, fingerExtensors],
  },
];

/** The forearm's own target muscles in no reviewed group: none since the review of 22 Oct 2026 (see above). */
export const forearmTendonNotPlaced: TendonNotPlaced[] = [];

/**
 * What the counts cover and leave out (11 §4.4, "What the counts cover"), as `forearm_mappings_v1`
 * maps it: the brachioradialis is credited in rows and pulls, the finger flexors with grip in rows,
 * pulls and deadlifts, and the wrist extensors steady the wrist only in palms-down curls and carries
 * (`wristExtensorStabilizers`, mappings.ts). The wrist flexors' steadying is not mapped (§1.4 adopts
 * it in v2 only if a source names them), so the last sentence says so. Lane V1 rewrites this with v2.
 */
export const forearmTendonCoverage = "Rows and pulls count for the brachioradialis as an elbow flexor, at the outer elbow and at the wrist, where it attaches. Grip in rows, pulls and deadlifts counts for the finger flexors. The wrist extensors that steady the wrist while you grip are counted only in palms-down curls and carries, so the outer elbow shows less of your gripping than your grip may do. The wrist flexors' steadying is not counted yet.";

/** What a region's `tendonAreas.ts` exports, under this one name, so a region-agnostic loader finds it. */
export const tendonAreaExtras: RegionExtras = {
  regionId: FOREARM_REGION_ID,
  tendonAreas: forearmTendonAreaList,
  tendonNotPlaced: forearmTendonNotPlaced,
  referenceSources: forearmTendonSources,
  tendonCoverage: forearmTendonCoverage,
};
