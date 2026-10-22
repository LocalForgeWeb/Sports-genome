import type { Source } from "../types";

/**
 * Sources the upper arm's pulls-and-curls mappings cite that the library did not hold
 * (shared/specialization/regions/upper_arm/mappings/pullsCurls.ts; docs/specialization-atlas/
 * 10-multi-region.md §8). Found by web search on 22 Oct 2026 and read at abstract level: page
 * fetches are refused from the build environment, so each note says what the search results
 * showed and what could not be confirmed. Each is a short-term muscle-activity (EMG) study: a
 * mapping cites it only for which muscles were active in the task it measured, never for growth
 * and never as a credit weight.
 *
 * The mappings also cite sources already in the library: the forearm's A4 (Kleiber 2015), A50 and
 * A51 (StatPearls, biceps and brachialis), and the upper arm's anatomy sources
 * (sources/upper_arm.ts).
 */

const CHECKED = "2026-10-22";

export const upperArmPullsCurlsSources: Source[] = [
  {
    id: "bmc.pulldown_row_grips",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC449729/",
    title: "Lehman, Buchan, Lundy, Myers and Nalborczyk, Variations in muscle activation levels during traditional latissimus dorsi weight training exercises: an experimental study (Dynamic Medicine 3:4, 2004)",
    doi: "10.1186/1476-5918-3-4",
    evidenceType: "emg",
    retrievedOn: CHECKED,
    notes: "Checked via web-search results on 22 Oct 2026 (the abstract, and a summary of its first results table): surface EMG of the latissimus dorsi, the biceps brachii and the middle trapezius with the rhomboids, as a share of a normalizing contraction, averaged over two 10-second isometric holds within a wide-grip (palms-down) pulldown, a reverse-grip (palms-up) pulldown, and seated rows with and without the shoulder blades drawn back. No exercise type changed biceps activity; the ratio of latissimus to biceps activity was highest in the wide-grip pulldown and the seated row. The number of participants was not shown. Short-term activity in held positions, not growth. The page could not be fetched from the build environment.",
  },
  {
    id: "jelekin.pull_up_grips",
    url: "https://research.winchester.ac.uk/en/publications/electromyographic-analysis-of-muscle-activation-during-pull-up-va-3/",
    title: "Dickie, Faulkner, Barnes and Lark, Electromyographic analysis of muscle activation during pull-up variations (Journal of Electromyography and Kinesiology 32:30-36, 2017)",
    doi: null,
    evidenceType: "emg",
    retrievedOn: CHECKED,
    notes: "Checked via web-search results on 22 Oct 2026 (the abstract, through the University of Winchester's research record): 19 strength-trained men did supinated, pronated, neutral-grip and rope pull-ups; surface EMG of eight shoulder, arm and forearm muscles, normalized to maximal isometric contractions. Peak and average activation were similar whatever the hand orientation, apart from the middle trapezius (higher with the pronated grip than the neutral one); the lifting phase gave higher average activation of the brachioradialis, biceps brachii and pectoralis major than the lowering phase. Published online on 28 Nov 2016. The DOI and PubMed id were not confirmed, and the biceps values for each grip were not seen. Short-term activity, not growth.",
  },
  {
    id: "mdpi.pullover_straight_arm_pulldown",
    url: "https://doi.org/10.3390/app122111138",
    title: "Muyor, López-Miñarro and Alacid, Comparison of Electromyographic Activity during Barbell Pullover and Straight Arm Pulldown Exercises (Applied Sciences 12(21):11138, 2022)",
    doi: "10.3390/app122111138",
    evidenceType: "emg",
    retrievedOn: CHECKED,
    notes: "Checked via web-search results on 22 Oct 2026 (the abstract, through the University of Murcia's and the University of Almería's repository records): 20 healthy, physically active adults did eight repetitions of a barbell pullover and of a straight-arm pulldown at two grip widths, against a load set from body mass; surface EMG of the pectoralis major (three portions), latissimus dorsi, anterior deltoid, triceps brachii and rectus abdominis. The pullover gave higher activity in most muscles, but the latissimus dorsi and the triceps brachii were most active in the straight-arm pulldown at both widths; every muscle was more active lifting than lowering. Which triceps head was recorded was not shown in the excerpts. Short-term activity, not growth.",
  },
  {
    id: "scielo.pullover_bar_dumbbell",
    url: "https://www.scielo.br/j/rbme/a/hgLVvr5bbPXfTmnJFrjmDFy/abstract/?lang=en",
    title: "Campos and colleagues, The use of barbell or dumbbell does not affect muscle activation during pullover exercise (Revista Brasileira de Medicina do Esporte 23(5):357-360, 2017)",
    doi: null,
    evidenceType: "emg",
    retrievedOn: CHECKED,
    notes: "Checked via web-search results on 22 Oct 2026 (the abstract on SciELO, and the same record in a Brazilian university repository): eleven trained men did barbell and dumbbell pullovers at a load set from their ten-repetition maximum; surface EMG of the clavicular and sternocostal pectoralis major, the long head of the triceps, the anterior and posterior deltoid, the latissimus dorsi and the serratus anterior. No muscle's activation differed between bar and dumbbell. How active each muscle was, the long head included, was not shown in the excerpts; the full author list was not shown. Short-term activity, not growth.",
  },
];
