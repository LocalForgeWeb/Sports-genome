import type { Source } from "../../types";

/**
 * Sources added while reviewing exercise mappings (kept apart from the anatomy sources, S1-S8 and A<n>).
 * Each was found by web search on 16 Oct 2026 and read at abstract level (this build cannot
 * open the full texts); the notes say what the source measured and what it cannot show, because
 * a mapping may cite it only for that. A title in sentence form is a description where the exact
 * published title could not be confirmed. None of them measures muscle growth: they support
 * which muscles act in a task, not how much each grows.
 */
export const forearmMappingSources: Source[] = [
  {
    id: "M1",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4526813/",
    title: "Kleiber, Kunz and Disselhorst-Klug, Muscular coordination of biceps brachii and brachioradialis in elbow flexion with respect to hand position (Frontiers in Physiology, 2015)",
    doi: "10.3389/fphys.2015.00215",
    evidenceType: "emg",
    retrievedOn: "2026-10-16",
    notes: "16 healthy adults, slow single elbow flexions (20 degrees per second) with the hand pronated, neutral and supinated; surface EMG. The brachioradialis's contribution differed in pronation from supination and neutral, while biceps activity did not change with hand position; the authors relate this to the biceps's mechanical disadvantage in pronation. Acute, light task; other EMG studies disagree on the size of the position effect.",
  },
  {
    id: "M2",
    url: "https://experts.mcmaster.ca/scholarly-works/1313379",
    title: "Mogk and Keir, The effects of posture on forearm muscle loading during gripping (Ergonomics 46(9):956-975, 2003)",
    doi: null,
    evidenceType: "emg",
    retrievedOn: "2026-10-16",
    notes: "10 adults gripping a dynamometer at several efforts in three wrist and three forearm postures. Wrist-extensor activity accompanied gripping, was generally larger than flexor activity at low to moderate grip forces, and was always greater with the forearm pronated. Supports the wrist extensors steadying the wrist whenever the hand grips; a dynamometer is not a barbell, and EMG is not a growth measure.",
  },
  {
    id: "M3",
    url: "https://doi.org/10.1016/j.physbeh.2020.113283",
    title: "Jukic et al. (2021), lifting straps in the deadlift: movement velocity, grip strength and perceived grip security (Physiology & Behavior 229:113283)",
    doi: "10.1016/j.physbeh.2020.113283",
    evidenceType: "biomechanics",
    retrievedOn: "2026-10-16",
    notes: "16 men deadlifting 4 sets of 4 with and without straps. With straps, grip strength fell less across the session and recovered faster, and grip felt more secure. Supports treating a strapped set's grip demand as different from an unstrapped one; it does not measure forearm muscle activity.",
  },
  {
    id: "M4",
    url: "https://pubmed.ncbi.nlm.nih.gov/23101527/",
    title: "Goetz et al., contribution of the flexor pollicis longus to pinch strength, measured before and after an EMG-guided lidocaine block (2012; PubMed 23101527)",
    doi: null,
    evidenceType: "biomechanics",
    retrievedOn: "2026-10-16",
    notes: "11 healthy volunteers; key, three-point and tip pinch strength fell after the flexor pollicis longus was temporarily blocked. Supports the long thumb flexor working in pinches; pinch-meter tasks, not plate pinches, and only the abstract was read.",
  },
  {
    id: "M5",
    url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12885837/",
    title: "Kondi et al., An electromyographic study comparing muscle function during supination and pronation of the forearm (Cureus, 2026)",
    doi: null,
    evidenceType: "emg",
    retrievedOn: "2026-10-16",
    notes: "Pilot study, 4 adults, forearm held in neutral against a 1 kg load at increasing distances from the rotation axis (a lever). In supination the supinator was more active than the biceps at low torque and the biceps rose more steeply as torque increased; in pronation the pronator quadratus was more active at low torque and the pronator teres rose more steeply. Surface EMG for the pronators, fine wire for the supinator; isometric; very small sample.",
  },
  {
    id: "M6",
    url: "https://pubmed.ncbi.nlm.nih.gov/12121684/",
    title: "O'Sullivan and Gallwey, Upper-limb surface electro-myography at maximum supination and pronation torques: the effect of elbow and forearm angle (Journal of Electromyography and Kinesiology 12(4):275-285, 2002)",
    doi: null,
    evidenceType: "emg",
    retrievedOn: "2026-10-16",
    notes: "24 men, maximal pronation and supination efforts at four elbow angles and three forearm angles, surface EMG of six muscles including pronator teres, biceps and brachioradialis. Torque in both directions changed with elbow and forearm angle. Supports recording the elbow angle on the lever rows; maximal isometric efforts, not repetitions.",
  },
  {
    id: "M7",
    url: "https://doi.org/10.1016/j.jelekin.2020.102428",
    title: "Pratt, Hoffman, Grainger and Ditroilo, Forearm electromyographic activity during the deadlift exercise is affected by grip type and sex (Journal of Electromyography and Kinesiology, 2020)",
    doi: "10.1016/j.jelekin.2020.102428",
    evidenceType: "emg",
    retrievedOn: "2026-10-16",
    notes: "Trained lifters deadlifting at 50, 70 and 90 per cent of their maximum with hook, mixed and double-overhand grips; forearm EMG changed with grip type and load. Cited only for that: secondary summaries disagree on which grip ranked highest, and the full text was not read.",
  },
  {
    id: "M8",
    url: "https://anatomy.ttuhscep.edu/musculoskeletal_system/axilla_tables.html",
    title: "Texas Tech University Health Sciences Center El Paso: axilla, posterior shoulder and arm muscle tables",
    doi: null,
    evidenceType: "anatomy",
    retrievedOn: "2026-10-16",
    notes: "The arm companion to S4, for the two upper-arm muscles the forearm atlas credits as external contributors: biceps brachii (elbow flexion, supination) and brachialis (elbow flexion only). Actions, not exercise loading.",
  },
];
