import type { Source } from "../types";

/**
 * Mapping sources `forearm_mappings_v2` adds (release F3, 24 Oct 2026; docs/specialization-atlas/
 * 11-forearm-research-and-stack.md §1.3-§1.5), listed in the forearm's `content.sources` so the
 * seed writes them with v2. Three come from the owner's research package (its S03, S04 and S05,
 * re-keyed: the package's keys look like ours and mean other papers) and one, Hamrick 1998, was
 * found by search for the thumb flexor's part in a gripped handle.
 *
 * Each was checked by web search on 24 Oct 2026 (lane V1; page fetches are refused from this build,
 * so every check is at abstract level or less), and each note says what the search showed and what
 * it could not confirm. None measures muscle growth: a mapping cites one only for which muscles are
 * active in a kind of task, and its limitation says how far that task is from the exercise.
 */
export const forearmResearchSources: Source[] = [
  {
    id: "pmid.9503091",
    url: "https://pubmed.ncbi.nlm.nih.gov/9503091/",
    title: "Hamrick, Churchill, Schmitt and Hylander, EMG of the human flexor pollicis longus muscle: implications for the evolution of hominid tool use (Journal of Human Evolution 34(2):123-136, 1998)",
    doi: "10.1006/jhev.1997.0177",
    evidenceType: "emg",
    retrievedOn: "2026-10-24",
    notes:
      "PubMed record 9503091 confirmed by search on 24 Oct 2026 (title, authors, journal, volume, pages, DOI); the abstract seen through the PubMed record and Duke's and Augusta University's publication listings. Electromyography of the flexor pollicis longus during tool making, tool use and handling tasks: the muscle was recruited in forceful tool use and stone-tool making whatever the grip, power or precision, with high activity in forceful chuck grips and when the thumb pad met resistance, and low activity in fine manipulation. Supports the long thumb flexor working when the hand closes forcefully on an object; stone tools, not a gym handle, and the abstract only.",
  },
  {
    id: "pmid.14656682",
    url: "https://pubmed.ncbi.nlm.nih.gov/14656682/",
    title: "Gordon, Pardo, Johnson, King and Miller, Electromyographic activity and strength during maximum isometric pronation and supination efforts in healthy adults (Journal of Orthopaedic Research 22(1):208-213, 2004)",
    doi: "10.1016/S0736-0266(03)00115-3",
    evidenceType: "emg",
    retrievedOn: "2026-10-24",
    notes:
      "The research package's S03. PubMed id 14656682 confirmed by search on 24 Oct 2026 (a PubMed citation listing); the abstract seen through the publisher's and the journal index's records. Fourteen healthy adults made maximal isometric pronation and supination efforts at five forearm positions in a device that measured torque without the grip. The pronator teres and both heads of the pronator quadratus were more active than the biceps and supinator in pronation; the deep head of the pronator quadratus was active in both pronation and supination, and the authors suggest it acts mainly as a dynamic stabilizer of the distal radioulnar joint. Maximal isometric efforts, not repetitions against a lever; abstract only.",
  },
  {
    id: "pmid.32636008",
    url: "https://pubmed.ncbi.nlm.nih.gov/32636008/",
    title: "Forman et al., Characterizing forearm muscle activity in university-aged males during dynamic radial-ulnar deviation of the wrist using a wrist robot (Journal of Biomechanics 108:109897, 2020)",
    doi: "10.1016/j.jbiomech.2020.109897",
    evidenceType: "emg",
    retrievedOn: "2026-10-24",
    notes:
      "The research package's S04. The record and abstract confirmed by search on 21 Oct 2026, and the citation again on 24 Oct. Twelve men made dynamic radial and ulnar exertions on a wrist robot at three forearm postures, with surface EMG of eight muscles: torque direction and movement phase changed nearly every muscle's activity; posture mainly changed the muscles acting on the hand; the radial wrist extensor (one recording for the longus and brevis) was the most task dependent; co-contraction was much higher in radial trials, which the authors read as the ulnar flexor and extensor steadying the wrist. A robot handle, not a dumbbell lever; men only; the abstract only.",
  },
  {
    id: "pmid.35646483",
    url: "https://pubmed.ncbi.nlm.nih.gov/35646483/",
    title: "Mannella, Forman, Mugnosso, Zenzeri and Holmes, The effects of isometric hand grip force on wrist kinematics and forearm muscle activity during radial and ulnar wrist joint perturbations (PeerJ 10:e13495, 2022)",
    doi: "10.7717/peerj.13495",
    evidenceType: "emg",
    retrievedOn: "2026-10-24",
    notes:
      "The research package's S05 (PMC9138088). Record and abstract confirmed by search on 21 Oct 2026; the eight muscles recorded confirmed by search excerpts of the full text on 24 Oct: flexor carpi radialis, flexor carpi ulnaris, flexor digitorum superficialis, extensor carpi radialis (one recording for the longus and brevis), extensor carpi ulnaris, extensor digitorum, brachioradialis and biceps. Twenty adults held a handle at four grip forces while a robot tilted the wrist toward the thumb or little-finger side: activity rose with grip force in all eight muscles, before and after the perturbation. Supports the wrist flexors and extensors working whenever the hand grips harder; a robot perturbing a held handle, not a hang, carry or gripper, and the excerpts did not give each muscle's values.",
  },
];
