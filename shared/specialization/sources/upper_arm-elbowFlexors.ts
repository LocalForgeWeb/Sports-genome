import type { Source } from "../types";

/**
 * The six upper-arm sources the upper arm's biceps and brachialis rows cite (wave A integration, 23
 * Oct 2026). Each record is unchanged and stays in its list, at its place (sources/upper_arm.ts,
 * sources/upper_arm-pullsCurls.ts); it is kept here so that the forearm's page, which credits the
 * biceps and brachialis through those rows (docs/specialization-atlas/10-multi-region.md §4.2),
 * loads these records without the rest of the upper arm's sources (§6.1's download gate;
 * regions/forearm/upperArmHome.ts). client/src/lib/specialization/regionContent.test.ts fails, naming
 * the key, if a biceps or brachialis row comes to cite an upper-arm source that is not here.
 */

/** When the anatomy lane's search results were read (sources/upper_arm.ts). */
const ANATOMY_CHECKED = "2026-10-19";
/** When the pulls-and-curls lane's search results were read (sources/upper_arm-pullsCurls.ts). */
const PULLS_CHECKED = "2026-10-22";

export const kenhubBicepsBrachii: Source = { id: "kenhub.biceps_brachii", url: "https://www.kenhub.com/en/library/anatomy/biceps-brachii-muscle", title: "Kenhub: biceps brachii muscle", doi: null, evidenceType: "anatomy", retrievedOn: ANATOMY_CHECKED, notes: "Checked via web-search results on 19 Oct 2026: function line lists flexion and supination of the forearm at the elbow joint and a weak flexor of the arm at the glenohumeral joint; the scapular origin lets it act on both the shoulder and the elbow. The French and German pages returned no function text." };

export const teachMeAnatomyBrachialis: Source = { id: "teachmeanatomy.brachialis", url: "https://teachmeanatomy.info/encyclopaedia/b/brachialis", title: "TeachMeAnatomy encyclopaedia: brachialis", doi: null, evidenceType: "anatomy", retrievedOn: ANATOMY_CHECKED, notes: "Checked via web-search results on 19 Oct 2026: in the anterior compartment, deep to the biceps brachii, forming the floor of the cubital fossa; flexes the elbow; musculocutaneous nerve with a contribution from the radial nerve." };

export const mdpiBicepsCurlGrips: Source = { id: "mdpi.biceps_curl_grips", url: "https://www.mdpi.com/2075-4663/11/3/64", title: "Coratella et al., Biceps Brachii and Brachioradialis Excitation in Biceps Curl Exercise: Different Handgrips, Different Synergy (Sports 11(3):64, 2023)", doi: "10.3390/sports11030064", evidenceType: "emg", retrievedOn: ANATOMY_CHECKED, notes: "Checked via web-search results on 19 Oct 2026 (abstract): ten competitive bodybuilders did bilateral curls in six-repetition sets at an eight-repetition maximum with supinated, pronated and neutral grips; surface EMG. While lifting, the biceps and brachioradialis were more excited with the supinated grip than the other two, and the anterior deltoid less; while lowering, only the anterior deltoid differed. Full author list not shown. Second review, 19 Oct 2026: an independent search confirmed the ten competitive bodybuilders, the grips and that while lowering only the anterior deltoid differed between grips." };

export const bmcPulldownRowGrips: Source = {
    id: "bmc.pulldown_row_grips",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC449729/",
    title: "Lehman, Buchan, Lundy, Myers and Nalborczyk, Variations in muscle activation levels during traditional latissimus dorsi weight training exercises: an experimental study (Dynamic Medicine 3:4, 2004)",
    doi: "10.1186/1476-5918-3-4",
    evidenceType: "emg",
    retrievedOn: PULLS_CHECKED,
    notes: "Checked via web-search results on 22 Oct 2026 (the abstract, and a summary of its first results table): surface EMG of the latissimus dorsi, the biceps brachii and the middle trapezius with the rhomboids, as a share of a normalizing contraction, averaged over two 10-second isometric holds within a wide-grip (palms-down) pulldown, a reverse-grip (palms-up) pulldown, and seated rows with and without the shoulder blades drawn back. No exercise type changed biceps activity; the ratio of latissimus to biceps activity was highest in the wide-grip pulldown and the seated row. The number of participants was not shown. Short-term activity in held positions, not growth. The page could not be fetched from the build environment.",
  };

export const jelekinPullUpGrips: Source = {
    id: "jelekin.pull_up_grips",
    url: "https://research.winchester.ac.uk/en/publications/electromyographic-analysis-of-muscle-activation-during-pull-up-va-3/",
    title: "Dickie, Faulkner, Barnes and Lark, Electromyographic analysis of muscle activation during pull-up variations (Journal of Electromyography and Kinesiology 32:30-36, 2017)",
    doi: null,
    evidenceType: "emg",
    retrievedOn: PULLS_CHECKED,
    notes: "Checked via web-search results on 22 Oct 2026 (the abstract, through the University of Winchester's research record): 19 strength-trained men did supinated, pronated, neutral-grip and rope pull-ups; surface EMG of eight muscles of the 'shoulder-arm-forearm complex' (the abstract's words), normalized to maximal isometric contractions. The abstract's results name the brachioradialis, biceps brachii, pectoralis major and middle trapezius; an independent review of this lane reported the eight as the brachioradialis, biceps brachii, middle deltoid, upper pectoralis major, middle and lower trapezius, latissimus dorsi and infraspinatus, with no triceps, which these searches could not confirm. Peak and average activation were similar whatever the hand orientation, apart from the middle trapezius (higher with the pronated grip than the neutral one); the lifting phase gave higher average activation of the brachioradialis, biceps brachii and pectoralis major than the lowering phase. Published online on 28 Nov 2016. The DOI (10.1016/j.jelekin.2016.11.004 was suggested) and the PubMed id were not confirmed, and the biceps values for each grip were not seen. Short-term activity, not growth.",
  };

export const jscrPullUpChinUp: Source = {
    id: "jscr.pull_up_chin_up",
    url: "https://pubmed.ncbi.nlm.nih.gov/?term=Youdas+Surface+electromyographic+activation+patterns+elbow+joint+motion+pull-up+chin-up",
    title: "Youdas, Amundson, Cicero, Hahn, Harezlak and Hollman, Surface electromyographic activation patterns and elbow joint motion during a pull-up, chin-up, or perfect-pullup rotational exercise (Journal of Strength and Conditioning Research 24(12):3404-3414, 2010)",
    doi: null,
    evidenceType: "emg",
    retrievedOn: PULLS_CHECKED,
    notes: "Seen only through papers and articles that cite it, on 22 Oct 2026; the abstract, PubMed id and DOI were not found, so the link is a PubMed search for the title. Citing accounts conflict: several say the chin-up produced more biceps brachii (and pectoralis major) activity than the pull-up and the pull-up more lower trapezius; a 2017 paper says it found no significant difference in the primary movers, the biceps included, between the two. Cited only to say that the evidence on grip in pull-ups is mixed. Short-term activity, not growth.",
  };
