import type { Source } from "../types";
import { bmcPulldownRowGrips, jelekinPullUpGrips, jscrPullUpChinUp } from "./upper_arm-elbowFlexors";

/**
 * Sources the upper arm's pulls-and-curls mappings cite that the library did not hold
 * (shared/specialization/regions/upper_arm/mappings/pullsCurls.ts; docs/specialization-atlas/
 * 10-multi-region.md §8). Found by web search on 22 Oct 2026 and read at abstract level, one of them
 * (Youdas 2010) only through papers that cite it: page fetches are refused from the build
 * environment, so each note says what the search results showed and what could not be confirmed. Each is a short-term muscle-activity (EMG) study: a
 * mapping cites it only for which muscles were active in the task it measured, never for growth
 * and never as a credit weight.
 *
 * Two of them (Signorile 2002 and Youdas 2010) are cited only for what a draft row or a sentence on
 * mixed evidence needs, and say so in their limitations.
 *
 * The mappings also cite sources already in the library: the forearm's A4 (Kleiber 2015, a paper the
 * forearm also files as M1, under the same URL: an existing duplicate the library test allows), A50 and
 * A51 (StatPearls, biceps and brachialis), and the upper arm's anatomy sources
 * (sources/upper_arm.ts).
 */

const CHECKED = "2026-10-22";

export const upperArmPullsCurlsSources: Source[] = [
  bmcPulldownRowGrips,
  jelekinPullUpGrips,
  {
    id: "mdpi.pullover_straight_arm_pulldown",
    url: "https://doi.org/10.3390/app122111138",
    title: "Muyor, López-Miñarro and Alacid, Comparison of Electromyographic Activity during Barbell Pullover and Straight Arm Pulldown Exercises (Applied Sciences 12(21):11138, 2022)",
    doi: "10.3390/app122111138",
    evidenceType: "emg",
    retrievedOn: CHECKED,
    notes: "Checked via web-search results on 22 Oct 2026 (the abstract, through the University of Murcia's and the University of Almería's repository records): 20 healthy, physically active adults did eight repetitions of each exercise against a load set from body mass: a lying barbell pullover with the hands at shoulder width only, and a straight-arm pulldown with the hands at shoulder width and at one and a half times it; surface EMG of the pectoralis major (three portions), latissimus dorsi, anterior deltoid, triceps brachii and rectus abdominis. The pullover gave higher activity in most muscles, but the latissimus dorsi and the triceps brachii were most active in the straight-arm pulldown at both of its widths; every muscle was more active lifting than lowering. Which triceps head was recorded was not shown in the excerpts. Short-term activity, not growth.",
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
  {
    id: "pmid.12423182",
    url: "https://pubmed.ncbi.nlm.nih.gov/12423182/",
    title: "Signorile, Zink and Szwed, A comparative electromyographical investigation of muscle utilization patterns using various hand positions during the lat pull-down (Journal of Strength and Conditioning Research 16(4):539-546, 2002)",
    doi: null,
    evidenceType: "emg",
    retrievedOn: CHECKED,
    notes: "Checked via web-search results on 22 Oct 2026 (the abstract, through its PubMed record): ten healthy men did three repetitions at their ten-repetition maximum in four lat-pulldown grips (close grip, palms-up grip, wide grip to the front, wide grip behind the neck); surface EMG of the posterior deltoid, latissimus dorsi, pectoralis major, teres major and long head of the triceps, normalized to maximal contractions. The wide grip to the front gave the most latissimus activity in both phases. The long head's values were not seen, only that it was recorded. Short-term activity, not growth.",
  },
  jscrPullUpChinUp,
];
