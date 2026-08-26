/**
 * Generated from the verified 100-study Sportsgenome evidence bundle.
 * Do not weaken review-status safeguards when extending this library.
 */

export type EvidenceReviewStatus =
  | "FULL_TEXT_VERIFIED"
  | "ABSTRACT_VERIFIED"
  | "RECORD_ONLY";

export interface EvidenceSeedRecord {
  study: {
    pmid: string;
    title: string;
    authors: readonly string[];
    journal: string;
    year: string;
    volume: string;
    issue: string;
    pagesOrElocation: string;
    doi: string;
    pmcid: string;
    pubmedUrl: string;
    pmcFullTextUrl: string;
    abstract: string;
    publicationTypes: readonly string[];
    meshTerms: readonly string[];
    keywords: readonly string[];
    sourceMetadataStatus: string;
    reviewStatus: EvidenceReviewStatus;
    evidenceTier: string;
    confidence: string;
  };
  note: {
    entryNumber: number;
    topic: string;
    suppliedUse: string;
    studyDesignAndPopulation: string;
    interventionAndComparator: string;
    primaryOutcomes: string;
    directResults: string;
    implementationImplication: string;
    limitations: string;
    evidenceTier: string;
    reviewStatus: EvidenceReviewStatus;
    confidence: string;
    noteSource: string;
  };
}

export interface EvidenceModelRule {
  ruleKey: string;
  ruleText: string;
}

export const evidenceSeedRecords: readonly EvidenceSeedRecord[] = [
  {
    study: {
      pmid: "33009197",
      title:
        "Greater Hamstrings Muscle Hypertrophy but Similar Damage Protection after Training at Long versus Short Muscle Lengths.",
      authors: [
        "Sumiaki Maeo",
        "Meng Huang",
        "Yuhang Wu",
        "Hikaru Sakurai",
        "Yuki Kusagawa",
        "Takashi Sugiyama",
        "Hiroaki Kanehisa",
        "Tadao Isaka",
      ],
      journal: "Medicine and science in sports and exercise",
      year: "2021",
      volume: "53",
      issue: "4",
      pagesOrElocation: "825-837",
      doi: "10.1249/MSS.0000000000002523",
      pmcid: "PMC7969179",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/33009197/",
      pmcFullTextUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7969179/",
      abstract:
        "We investigated the effects of seated versus prone leg curl training on hamstrings muscle hypertrophy and susceptibility to eccentric exercise-induced muscle damage.\n\nPart 1: Twenty healthy adults conducted seated leg curl training with one leg (Seated-Leg) and prone with the other (Prone-Leg), at 70% one-repetition maximum (1RM), 10 repetitions per set, 5 sets per session, 2 sessions per week for 12 wk. Magnetic resonance imaging (MRI)-measured muscle volume of the individual and whole hamstrings was assessed pre- and posttraining. Part 2: Nineteen participants from part 1 and another 12 untrained controls (Control-Leg) performed eccentric phase-only leg curl exercise at 90% 1RM, 10 repetitions per set, 3 sets for each of the seated/prone conditions with each leg. MRI-measured transverse relaxation time (T2) and 1RM of seated/prone leg curl were assessed before, 24, 48, and 72 h after exercise.\n\nPart 1: Training-induced increases in muscle volume were greater in Seated-Leg versus Prone-Leg for the whole hamstrings (+14% vs +9%) and each biarticular (+8%-24% vs +4%-19%), but not monoarticular (+10% vs +9%), hamstring muscle. Part 2: After eccentric exercise, Control-Leg had greater increases in T2 in each hamstring muscle (e.g., semitendinosus at 72 h: +52%) than Seated-Leg (+4%) and Prone-Leg (+6%). Decreases in 1RM were also greater in Control-Leg (e.g., seated/prone 1RM at 24 h: -12%/-24%) than Seated-Leg (0%/-3%) and Prone-Leg (+2%/-5%). None of the changes significantly differed between Seated-Leg and Prone-Leg at any time points.\n\nHamstrings muscle size can be more effectively increased by seated than prone leg curl training, suggesting that training at long muscle lengths promotes muscle hypertrophy, but both are similarly effective in reducing susceptibility to muscle damage.",
      publicationTypes: [
        "Comparative Study",
        "Journal Article",
        "Research Support, Non-U.S. Gov't",
      ],
      meshTerms: [
        "Adult",
        "Hamstring Muscles",
        "Humans",
        "Magnetic Resonance Imaging",
        "Organ Size",
        "Prone Position",
        "Random Allocation",
        "Resistance Training",
        "Sitting Position",
        "Time Factors",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "FULL_TEXT_VERIFIED",
      evidenceTier: "very_high",
      confidence: "high",
    },
    note: {
      entryNumber: 1,
      topic: "exercise_selection_hypertrophy_rom_muscle_length",
      suppliedUse:
        "seated vs prone leg curl, individual hamstring hypertrophy, long-muscle-length loading.",
      studyDesignAndPopulation:
        "This within-participant study randomized 20 healthy, untrained young adults to perform 12 weeks of unilateral leg curl training in seated and prone positions.",
      interventionAndComparator:
        "One leg performed seated leg curls (hip at ~90°, long muscle length) while the contralateral leg performed prone leg curls (hip at ~30°, short muscle length) at 70% 1RM for 5 sets of 10 repetitions, twice weekly.",
      primaryOutcomes:
        "The primary measures were MRI-assessed muscle volume changes of the whole and individual hamstrings and post-exercise muscle damage markers including T2 relaxation time and 1RM recovery.",
      directResults:
        "Seated leg curl training resulted in significantly greater volume increases for the whole hamstrings (+14.1% vs. +9.3%) and each biarticular muscle (BFL: +14.4% vs. +6.5%; ST: +23.6% vs. +19.3%; SM: +8.2% vs. +4.1%) compared to prone training, whereas the monoarticular biceps femoris short head showed similar gains (+10.2% vs. +9.1%). Both training conditions provided significant and comparable protection against muscle damage, with no significant differences between seated and prone legs in T2 relaxation time or 1RM recovery following eccentric exercise.",
      implementationImplication:
        "Seated leg curls should be prioritized over prone leg curls to maximize hamstring hypertrophy, especially for the biceps femoris long head, as training at longer muscle lengths yields superior volume gains without compromising damage protection.",
      limitations:
        "The results are derived from a 12-week intervention in previously untrained healthy young adults and may not generalize to other muscle groups or more extreme muscle damage protocols.",
      evidenceTier: "very_high",
      reviewStatus: "FULL_TEXT_VERIFIED",
      confidence: "high",
      noteSource: "PMC full-text sections retrieved through NCBI EFetch",
    },
  },
  {
    study: {
      pmid: "35819335",
      title:
        "Triceps brachii hypertrophy is substantially greater after elbow extension training performed in the overhead versus neutral arm position.",
      authors: [
        "Sumiaki Maeo",
        "Yuhang Wu",
        "Meng Huang",
        "Hikaru Sakurai",
        "Yuki Kusagawa",
        "Takashi Sugiyama",
        "Hiroaki Kanehisa",
        "Tadao Isaka",
      ],
      journal: "European journal of sport science",
      year: "2023",
      volume: "23",
      issue: "7",
      pagesOrElocation: "1240-1250",
      doi: "10.1080/17461391.2022.2100279",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/35819335/",
      pmcFullTextUrl: "",
      abstract:
        "The biarticular triceps brachii long head (TBLong) is lengthened more in the overhead than neutral arm position. We compared triceps brachii hypertrophy after elbow extension training performed in the overhead vs. neutral arm position. Using a cable machine, 21 adults conducted elbow extensions (90-0°) with one arm in the overhead (Overhead-Arm) and the other arm in the neutral (Neutral-Arm) position at 70% one-repetition maximum (1RM), 10 reps/set, 5 sets/session, 2 sessions/week for 12 weeks. Training load was gradually increased (+5% 1RM/session) when the preceding session was completed without repetition failure. 1RM of the assigned condition and MRI-measured muscle volume of the TBLong, monoarticular lateral and medial heads (TBLat+Med), and whole triceps brachii (Whole-TB) were assessed pre- and post-training. Training load and 1RM increased in both arms similarly (+62-71% at post, P = 0.285), while their absolute values/weights were always lower in Overhead-Arm (-34-39%, P < 0.001). Changes in muscle volume in Overhead-Arm compared to Neutral-Arm were 1.5-fold greater for the TBLong (+28.5% vs. +19.6%, Cohen's d = 0.61, P < 0.001), 1.4-fold greater for the TBLat+Med (+14.6% vs. +10.5%, d = 0.39, P = 0.002), and 1.4-fold greater for the Whole-TB (+19.9% vs. +13.9%, d = 0.54, P < 0.001). In conclusion, triceps brachii hypertrophy was substantially greater after elbow extension training performed in the overhead versus neutral arm position, even with lower absolute loads used during the training.HighlightsGrowing evidence suggests that resistance training at long muscle lengths promotes muscle hypertrophy, but its practical applications are yet to be explored.Triceps brachii muscle hypertrophy was substantially greater after cable elbow extension training performed in the overhead than neutral arm position, particularly in the biarticular triceps brachii long head, even with lower absolute loads lifted (i.e. lower mechanical stress to muscles/joints).Cable elbow extension training should be performed in the overhead rather than neutral arm position if one aims to maximise muscle hypertrophy of the triceps brachii or to prevent atrophy of this muscle.",
      publicationTypes: ["Journal Article"],
      meshTerms: [
        "Adult",
        "Humans",
        "Elbow",
        "Elbow Joint",
        "Muscle, Skeletal",
        "Resistance Training",
        "Hypertrophy",
      ],
      keywords: [
        "Bi- and monoarticular muscles",
        "muscle length",
        "muscle volume",
        "training load",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "very_high",
      confidence: "high",
    },
    note: {
      entryNumber: 2,
      topic: "exercise_selection_hypertrophy_rom_muscle_length",
      suppliedUse: "triceps long head, shoulder position, muscle length.",
      studyDesignAndPopulation:
        "12-week within-subject resistance-training intervention in 21 healthy adults.",
      interventionAndComparator:
        "Cable elbow extensions (90-0° ROM) in the overhead arm position versus the neutral arm position.",
      primaryOutcomes: "",
      directResults:
        "MRI-measured muscle volume increased significantly more in the overhead arm for the long head (+28.5% vs. +19.6%), lateral/medial heads (+14.6% vs. +10.5%), and whole triceps (+19.9% vs. +13.9%); hypertrophic advantages occurred despite 34-39% lower absolute training loads in the overhead position.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Short-term (12-week) intervention in young healthy adults using cable machines; not direct sport-transfer evidence.",
      evidenceTier: "very_high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "38156065",
      title:
        "Triceps surae muscle hypertrophy is greater after standing versus seated calf-raise training.",
      authors: [
        "Momoka Kinoshita",
        "Sumiaki Maeo",
        "Yuuto Kobayashi",
        "Yuuri Eihara",
        "Munetaka Ono",
        "Mauto Sato",
        "Takashi Sugiyama",
        "Hiroaki Kanehisa",
        "Tadao Isaka",
      ],
      journal: "Frontiers in physiology",
      year: "2023",
      volume: "14",
      issue: "",
      pagesOrElocation: "1272106",
      doi: "10.3389/fphys.2023.1272106",
      pmcid: "PMC10753835",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/38156065/",
      pmcFullTextUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10753835/",
      abstract:
        "Background: The triceps surae muscle plays important roles in fundamental human movements. However, this muscle is relatively unresponsive to resistance training (difficult to hypertrophy) but prone to atrophy with inactivity compared with other muscles. Thus, identifying an effective training modality for the triceps surae is warranted. This study compared triceps surae muscle hypertrophy after standing/knee-extended versus seated/knee-flexed plantarflexion (calf-raise) training, where the gastrocnemius is lengthened and shortened, respectively. Methods: Fourteen untrained adults conducted calf-raise training with one leg in a standing/knee-extended position and the other leg in a seated/knee 90°-flexed position at 70% of one-repetition maximum. Each leg performed 10 repetitions/set, 5 sets/session, 2 sessions/week for 12 weeks. Before and after the intervention, magnetic resonance imaging scans were obtained to assess muscle volume of each and the whole triceps surae. Results: Muscle volume significantly increased in all three muscles and the whole triceps surae for both legs (p ≤ 0.031), except for the gastrocnemius muscles of the seated condition leg (p = 0.147-0.508). The changes in muscle volume were significantly greater for the standing than seated condition leg in the lateral gastrocnemius (12.4% vs. 1.7%), medial gastrocnemius (9.2% vs. 0.6%), and whole triceps surae (5.6% vs. 2.1%) (p ≤ 0.011), but similar between legs in the soleus (2.1% vs. 2.9%, p = 0.410). Conclusion: Standing calf-raise was by far more effective, therefore recommended, than seated calf-raise for inducing muscle hypertrophy of the gastrocnemius and consequently the whole triceps surae. This result and similar between-condition hypertrophy in the soleus collectively suggest that training at long muscle lengths promotes muscle hypertrophy.",
      publicationTypes: ["Journal Article"],
      meshTerms: [],
      keywords: [
        "bi- and monoarticular muscles",
        "muscle length",
        "muscle volume",
        "resistance training",
        "selective hypertrophy",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "FULL_TEXT_VERIFIED",
      evidenceTier: "very_high",
      confidence: "high",
    },
    note: {
      entryNumber: 3,
      topic: "exercise_selection_hypertrophy_rom_muscle_length",
      suppliedUse: "gastrocnemius vs soleus, biarticular muscle length.",
      studyDesignAndPopulation:
        "This within-person comparison study involved fourteen untrained healthy adults (7 males, 7 females; age: 23.3 ± 2.4 years) who performed 12 weeks of unilateral resistance training.",
      interventionAndComparator:
        "The study compared 12 weeks of unilateral standing calf-raise training (knee-extended) against seated calf-raise training (knee 90°-flexed) performed at 70% 1RM for 5 sets of 10 repetitions twice weekly.",
      primaryOutcomes:
        "The primary outcome was the change in muscle volume of the lateral gastrocnemius, medial gastrocnemius, and soleus measured via magnetic resonance imaging.",
      directResults:
        "Standing calf-raise training produced significantly greater muscle volume increases than seated training in the lateral gastrocnemius (12.4% vs. 1.7%, p=0.001), medial gastrocnemius (9.2% vs. 0.6%, p=0.002), and whole triceps surae (5.6% vs. 2.1%, p=0.011), while soleus hypertrophy was similar between conditions (2.1% vs. 2.9%, p=0.410). Notably, seated training failed to induce significant hypertrophy in either gastrocnemius head (p=0.147–0.508), indicating that training at short muscle lengths minimizes the hypertrophic response in these biarticular muscles.",
      implementationImplication:
        "Standing calf-raises should be prioritized over seated calf-raises for gastrocnemius hypertrophy, as seated training at short muscle lengths provides negligible hypertrophic stimulus for the medial and lateral heads.",
      limitations:
        "The study is limited by its use of untrained participants, a small sample size, the absence of a non-training control group, and the lack of functional performance data.",
      evidenceTier: "very_high",
      reviewStatus: "FULL_TEXT_VERIFIED",
      confidence: "high",
      noteSource: "PMC full-text sections retrieved through NCBI EFetch",
    },
  },
  {
    study: {
      pmid: "37877099",
      title:
        "Hip thrust and back squat training elicit similar gluteus muscle hypertrophy and transfer similarly to the deadlift.",
      authors: [
        "Daniel L Plotkin",
        "Merlina A Rodas",
        "Andrew D Vigotsky",
        "Mason C McIntosh",
        "Emma Breeze",
        "Rachel Ubrik",
        "Cole Robitzsch",
        "Anthony Agyin-Birikorang",
        "Madison L Mattingly",
        "J Max Michel",
        "Nicholas J Kontos",
        "Sarah Lennon",
        "Andrew D Frugé",
        "Christopher M Wilburn",
        "Wendi H Weimar",
        "Adil Bashir",
        "Ronald J Beyers",
        "Menno Henselmans",
        "Bret M Contreras",
        "Michael D Roberts",
      ],
      journal: "Frontiers in physiology",
      year: "2023",
      volume: "14",
      issue: "",
      pagesOrElocation: "1279170",
      doi: "10.3389/fphys.2023.1279170",
      pmcid: "PMC10593473",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/37877099/",
      pmcFullTextUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10593473/",
      abstract:
        "We examined how set-volume equated resistance training using either the back squat (SQ) or hip thrust (HT) affected hypertrophy and various strength outcomes. Untrained college-aged participants were randomized into HT (n = 18) or SQ (n = 16) groups. Surface electromyograms (sEMG) from the right gluteus maximus and medius muscles were obtained during the first training session. Participants completed 9 weeks of supervised training (15-17 sessions), before and after which gluteus and leg muscle cross-sectional area (mCSA) was assessed via magnetic resonance imaging. Strength was also assessed prior to and after the training intervention via three-repetition maximum (3RM) testing and an isometric wall push test. Gluteus mCSA increases were similar across both groups. Specifically, estimates [(-) favors HT (+) favors SQ] modestly favored the HT versus SQ for lower [effect ±SE, -1.6 ± 2.1 cm2; CI95% (-6.1, 2.0)], mid [-0.5 ± 1.7 cm2; CI95% (-4.0, 2.6)], and upper [-0.5 ± 2.6 cm2; CI95% (-5.8, 4.1)] gluteal mCSAs but with appreciable variance. Gluteus medius + minimus [-1.8 ± 1.5 cm2; CI95% (-4.6, 1.4)] and hamstrings [0.1 ± 0.6 cm2; CI95% (-0.9, 1.4)] mCSA demonstrated little to no growth with small differences between groups. mCSA changes were greater in SQ for the quadriceps [3.6 ± 1.5 cm2; CI95% (0.7, 6.4)] and adductors [2.5 ± 0.7 cm2; CI95% (1.2, 3.9)]. Squat 3RM increases favored SQ [14 ± 2 kg; CI95% (9, 18),] and hip thrust 3RM favored HT [-26 ± 5 kg; CI95% (-34, -16)]. 3RM deadlift [0 ± 2 kg; CI95% (-4, 3)] and wall push strength [-7 ± 12N; CI95% (-32, 17)] similarly improved. All measured gluteal sites showed greater mean sEMG amplitudes during the first bout hip thrust versus squat set, but this did not consistently predict gluteal hypertrophy outcomes. Squat and hip thrust training elicited similar gluteal hypertrophy, greater thigh hypertrophy in SQ, strength increases that favored exercise allocation, and similar deadlift and wall push strength increases.",
      publicationTypes: ["Journal Article"],
      meshTerms: [],
      keywords: [
        "back squat",
        "gluteus maximus",
        "hip thrust",
        "hypertrophy",
        "strength",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "FULL_TEXT_VERIFIED",
      evidenceTier: "very_high",
      confidence: "high",
    },
    note: {
      entryNumber: 4,
      topic: "exercise_selection_hypertrophy_rom_muscle_length",
      suppliedUse:
        "glute hypertrophy, quadriceps/adductor hypertrophy, EMG versus actual growth, exercise-specific strength.",
      studyDesignAndPopulation:
        "Randomized, set-equated 9-week longitudinal intervention involving 34 untrained young men and women (18-30 years).",
      interventionAndComparator:
        "Barbell hip thrust training compared to barbell back squat training, both performed twice weekly for 9 weeks.",
      primaryOutcomes:
        "Gluteus maximus muscle cross-sectional area (mCSA) via MRI and dynamic strength (3RM) for squat, hip thrust, and deadlift.",
      directResults:
        "Gluteus maximus hypertrophy was similar between groups across upper, middle, and lower regions, while the squat group achieved significantly greater adductor and quadriceps hypertrophy. Specific strength gains favored the trained exercise (HT group: +63% HT 3RM; SQ group: +44% SQ 3RM), but transfer to the deadlift (+15-16%) and wall push (+7.6-10%) was equivalent between groups. Acute sEMG amplitudes were higher for hip thrusts but failed to predict longitudinal hypertrophic adaptations.",
      implementationImplication:
        "Hip thrusts and back squats can be used interchangeably for gluteal hypertrophy in novices, but squats should be prioritized if simultaneous quadriceps and adductor development is desired.",
      limitations:
        "The study was conducted on untrained young adults over 9 weeks, which may limit generalizability to trained populations or longer-term outcomes.",
      evidenceTier: "very_high",
      reviewStatus: "FULL_TEXT_VERIFIED",
      confidence: "high",
      noteSource: "PMC full-text sections retrieved through NCBI EFetch",
    },
  },
  {
    study: {
      pmid: "41379528",
      title:
        "Comparison of Muscle Hypertrophy and Strength Adaptations Induced by Back Squat and Leg Extension Resistance Exercises.",
      authors: [
        "Witalo Kassiano",
        "Bruna Costa",
        "Gabriel Kunevaliki",
        "Felipe Lisboa",
        "Aline Prado",
        "Luis Alves",
        "Ian Tricoli",
        "Natã Stavinski",
        "Jarlisson Francsuel",
        "Edilson S Cyrino",
      ],
      journal: "Journal of strength and conditioning research",
      year: "2026",
      volume: "40",
      issue: "4",
      pagesOrElocation: "367-376",
      doi: "10.1519/JSC.0000000000005338",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/41379528/",
      pmcFullTextUrl: "",
      abstract:
        "Kassiano, W, Costa, B, Kunevaliki, G, Lisboa, F, Prado, A, Alves, L, Tricoli, I, Stavinski, N, Francssuel, J, and Cyrino, ES. Comparison of muscle hypertrophy and strength adaptations induced by back squat and leg extension resistance exercises. J Strength Cond Res 40(4): 367-376, 2026-Exercise selection affects muscular adaptations (e.g., strength gains and muscle hypertrophy). The purpose of this study was to compare changes in strength and muscle size between the back squat and leg extension resistance exercises. Sixty-three untrained young women were randomly allocated to perform the Smith machine back squat (SQ, n = 30) or leg extension (LE, n = 33) exercises. Subjects performed 3 sets of 8-12 repetitions maximum (RM) per session, 2 d·wk -1 , for 8 weeks. Muscle thickness of the rectus femoris (RF) and vastus lateralis (VL) was measured at the proximal, middle, and distal sites. Strength was assessed through 3 repetitions maximum (3RM) tests in the back squat (3RM-SQ) and leg extension (3RM-LE) exercises. The LE experienced greater increases in the 3 RF sites (proximal: +11.4% vs. +2.0%; middle: +12.3% vs. +5.7%; distal: 17.5% vs. +7.9%; all p < 0.001). Conversely, the SQ showed greater increases in VL at the distal site (+18.2% vs. +11.2%; p < 0.001). Smith machine back squat induced greater increases in 3RM-SQ (+46.7 vs. 21.3%; p < 0.001), but no between-group difference was observed in 3RM-LE increases (SQ = +19.8% vs. LE = +23.4%; p = 0.824). Based on our results, the leg extension induce greater rectus femoris hypertrophy, while the back squat promotes greater vastus lateralis hypertrophy, particularly at the distal site. The back squat training seems to be more effective for increasing squat strength, but both exercises are likely similarly effective for increasing leg extension strength.",
      publicationTypes: [
        "Journal Article",
        "Randomized Controlled Trial",
        "Comparative Study",
      ],
      meshTerms: [
        "Humans",
        "Resistance Training",
        "Female",
        "Muscle Strength",
        "Young Adult",
        "Adaptation, Physiological",
        "Leg",
        "Quadriceps Muscle",
        "Adult",
        "Hypertrophy",
        "Muscle, Skeletal",
      ],
      keywords: [
        "exercise selection",
        "muscle thickness",
        "quadriceps",
        "resistance training",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "very_high",
      confidence: "high",
    },
    note: {
      entryNumber: 5,
      topic: "exercise_selection_hypertrophy_rom_muscle_length",
      suppliedUse: "rectus femoris vs vastus lateralis regional growth.",
      studyDesignAndPopulation:
        "8-week randomized controlled trial in 63 untrained young women.",
      interventionAndComparator:
        "Smith machine back squat versus leg extension.",
      primaryOutcomes: "",
      directResults:
        "Leg extension induced significantly greater rectus femoris hypertrophy at proximal (+11.4% vs +2.0%), middle (+12.3% vs +5.7%), and distal (+17.5% vs +7.9%) sites; back squat promoted greater distal vastus lateralis hypertrophy (+18.2% vs +11.2%) and squat strength (+46.7% vs +21.3%).",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "8-week intervention in untrained women; use of Smith machine may limit transfer to free-weight squat performance.",
      evidenceTier: "very_high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "34743671",
      title:
        "The role of exercise selection in regional Muscle Hypertrophy: A randomized controlled trial.",
      authors: [
        "Aitor Zabaleta-Korta",
        "Eneko Fernández-Peña",
        "Jon Torres-Unda",
        "Arkaitz Garbisu-Hualde",
        "Jordan Santos-Concejero",
      ],
      journal: "Journal of sports sciences",
      year: "2021",
      volume: "39",
      issue: "20",
      pagesOrElocation: "2298-2304",
      doi: "10.1080/02640414.2021.1929736",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/34743671/",
      pmcFullTextUrl: "",
      abstract:
        "There is emerging evidence suggesting that muscle growth is not homogeneous through the muscle. The aim of the present study was to analyse the role of exercise selection in regional hypertrophy. Two randomly allocated groups with equal training volume and intensity performed squats in the smith machine (SMTH group) or the leg extension exercise (LEG group). Growth in proximal, central and distal regions of the rectus femoris (RF) and vastus lateralis (VL) muscles, jump height and body composition were analysed. Results show that the three regions of RF grew significantly in the participants of the LEG group (p < 0.05), while only the central region of VL grew significantly in the SMTH group (p < 0.05). In summary, this study confirms that exercise selection plays a role in regional hypertrophy. Whilst there may be still other factors that determine how muscles grow, it seems that the chosen exercises may be responsible of the differences observed in this study.",
      publicationTypes: ["Journal Article", "Randomized Controlled Trial"],
      meshTerms: [
        "Adaptation, Physiological",
        "Adult",
        "Anthropometry",
        "Exercise",
        "Hip",
        "Humans",
        "Leg",
        "Male",
        "Muscle, Skeletal",
        "Resistance Training",
        "Skeletal Muscle Enlargement",
        "Young Adult",
      ],
      keywords: [
        "Inhomogeneous",
        "growth",
        "leg extension",
        "quadriceps femoris",
        "squat",
        "strength",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "very_high",
      confidence: "high",
    },
    note: {
      entryNumber: 6,
      topic: "exercise_selection_hypertrophy_rom_muscle_length",
      suppliedUse: "squat vs leg extension, regional quadriceps hypertrophy.",
      studyDesignAndPopulation:
        "5-week randomized controlled trial in 27 resistance-trained men.",
      interventionAndComparator: "Leg extension versus Smith machine squat.",
      primaryOutcomes: "",
      directResults:
        "Leg extension elicited significant hypertrophy in all rectus femoris regions (proximal +9.0%, central +8.8%, distal +19.7%; p < 0.05); Smith machine squats produced significant growth only in the central vastus lateralis (+6.0%, p < 0.05); jump height increased only in the squat group (p = 0.01).",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Short-term 5-week intervention in trained men; relatively small sample size; findings limited to male participants.",
      evidenceTier: "very_high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "23604798",
      title:
        "Effect of range of motion in heavy load squatting on muscle and tendon adaptations.",
      authors: [
        "K Bloomquist",
        "H Langberg",
        "S Karlsen",
        "S Madsgaard",
        "M Boesen",
        "T Raastad",
      ],
      journal: "European journal of applied physiology",
      year: "2013",
      volume: "113",
      issue: "8",
      pagesOrElocation: "2133-42",
      doi: "10.1007/s00421-013-2642-7",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/23604798/",
      pmcFullTextUrl: "",
      abstract:
        "Manipulating joint range of motion during squat training may have differential effects on adaptations to strength training with implications for sports and rehabilitation. Consequently, the purpose of this study was to compare the effects of squat training with a short vs. a long range of motion. Male students (n = 17) were randomly assigned to 12 weeks of progressive squat training (repetition matched, repetition maximum sets) performed as either a) deep squat (0-120° of knee flexion); n = 8 (DS) or (b) shallow squat (0-60 of knee flexion); n = 9 (SS). Strength (1 RM and isometric strength), jump performance, muscle architecture and cross-sectional area (CSA) of the thigh muscles, as well as CSA and collagen synthesis in the patellar tendon, were assessed before and after the intervention. The DS group increased 1 RM in both the SS and DS with ~20 ± 3 %, while the SS group achieved a 36 ± 4 % increase in the SS, and 9 ± 2 % in the DS (P < 0.05). However, the main finding was that DS training resulted in superior increases in front thigh muscle CSA (4-7 %) compared to SS training, whereas no differences were observed in patellar tendon CSA. In parallel with the larger increase in front thigh muscle CSA, a superior increase in isometric knee extension strength at 75° (6 ± 2 %) and 105° (8 ± 1 %) knee flexion, and squat-jump performance (15 ± 3 %) were observed in the DS group compared to the SS group. Training deep squats elicited favourable adaptations on knee extensor muscle size and function compared to training shallow squats.",
      publicationTypes: ["Journal Article", "Randomized Controlled Trial"],
      meshTerms: [
        "Adaptation, Physiological",
        "Humans",
        "Leg",
        "Male",
        "Muscle, Skeletal",
        "Range of Motion, Articular",
        "Resistance Training",
        "Tendons",
        "Young Adult",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "very_high",
      confidence: "high",
    },
    note: {
      entryNumber: 7,
      topic: "exercise_selection_hypertrophy_rom_muscle_length",
      suppliedUse:
        "deep vs shallow squatting, quadriceps hypertrophy, tendon adaptation and strength.",
      studyDesignAndPopulation:
        "12-week randomized controlled trial in 17 untrained male students.",
      interventionAndComparator:
        "Deep squat (0-120° knee flexion) versus shallow squat (0-60° knee flexion).",
      primaryOutcomes: "",
      directResults:
        "Deep squats increased 1RM in both deep and shallow ranges by ~20%, whereas shallow squats increased shallow 1RM by 36% but deep 1RM by only 9%; deep squats yielded superior increases in front thigh muscle CSA (4-7%) and squat-jump performance (15%).",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Small sample size in untrained students; 12-week duration may be insufficient to detect significant tendon structural changes.",
      evidenceTier: "very_high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "31230110",
      title:
        "Effects of squat training with different depths on lower limb muscle volumes.",
      authors: ["Keitaro Kubo", "Toshihiro Ikebukuro", "Hideaki Yata"],
      journal: "European journal of applied physiology",
      year: "2019",
      volume: "119",
      issue: "9",
      pagesOrElocation: "1933-1942",
      doi: "10.1007/s00421-019-04181-y",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/31230110/",
      pmcFullTextUrl: "",
      abstract:
        "The purpose of this study was to compare the effects of squat training with different depths on lower limb muscle volumes.\n\nSeventeen males were randomly assigned to a full squat training group (FST, n = 8) or half squat training group (HST, n = 9). They completed 10 weeks (2 days per week) of squat training. The muscle volumes (by magnetic resonance imaging) of the knee extensor, hamstring, adductor, and gluteus maximus muscles and the one repetition maximum (1RM) of full and half squats were measured before and after training.\n\nThe relative increase in 1RM of full squat was significantly greater in FST (31.8 ± 14.9%) than in HST (11.3 ± 8.6%) (p = 0.003), whereas there was no difference in the relative increase in 1RM of half squat between FST (24.2 ± 7.1%) and HST (32.0 ± 12.1%) (p = 0.132). The volumes of knee extensor muscles significantly increased by 4.9 ± 2.6% in FST (p < 0.001) and 4.6 ± 3.1% in HST (p = 0.003), whereas that of rectus femoris and hamstring muscles did not change in either group. The volumes of adductor and gluteus maximus muscles significantly increased in FST (6.2 ± 2.6% and 6.7 ± 3.5%) and HST (2.7 ± 3.1% and 2.2 ± 2.6%). In addition, relative increases in adductor (p = 0.026) and gluteus maximus (p = 0.008) muscle volumes were significantly greater in FST than in HST.\n\nThe results suggest that full squat training is more effective for developing the lower limb muscles excluding the rectus femoris and hamstring muscles.",
      publicationTypes: ["Journal Article"],
      meshTerms: [
        "Adult",
        "Electromyography",
        "Exercise",
        "Hamstring Muscles",
        "Humans",
        "Knee",
        "Male",
        "Muscle Strength",
        "Posture",
        "Quadriceps Muscle",
        "Resistance Training",
        "Thigh",
        "Young Adult",
      ],
      keywords: [
        "Adductor",
        "Gluteus maximus",
        "Hamstring",
        "Knee extensor",
        "Magnetic resonance imaging",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "very_high",
      confidence: "high",
    },
    note: {
      entryNumber: 8,
      topic: "exercise_selection_hypertrophy_rom_muscle_length",
      suppliedUse:
        "quadriceps, gluteus maximus, adductors and hamstrings across squat depths.",
      studyDesignAndPopulation:
        "10-week randomized resistance-training intervention in 17 males.",
      interventionAndComparator:
        "Full squat training versus half squat training.",
      primaryOutcomes: "",
      directResults:
        "1RM full squat increased significantly more in FST (31.8%) than HST (11.3%); adductor and gluteus maximus volumes increased significantly more in FST (6.2% and 6.7%) than HST (2.7% and 2.2%); knee extensor volumes increased similarly in both groups (~4.9% vs 4.6%); rectus femoris and hamstring volumes did not change.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Small sample size (n=17); short-term 10-week intervention in males; no direct sport-transfer evidence.",
      evidenceTier: "very_high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "22027847",
      title: "Effect of range of motion on muscle strength and thickness.",
      authors: [
        "Ronei S Pinto",
        "Naiara Gomes",
        "Régis Radaelli",
        "Cíntia E Botton",
        "Lee E Brown",
        "Martim Bottaro",
      ],
      journal: "Journal of strength and conditioning research",
      year: "2012",
      volume: "26",
      issue: "8",
      pagesOrElocation: "2140-5",
      doi: "10.1519/JSC.0b013e31823a3b15",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/22027847/",
      pmcFullTextUrl: "",
      abstract:
        "The purpose of this investigation was to compare partial range-of-motion vs. full range-of-motion upper-body resistance training on strength and muscle thickness (MT) in young men. Volunteers were randomly assigned to 3 groups: (a) full range of motion (FULL; n = 15), (b) partial range of motion (PART; n = 15), or (c) control (CON; n = 10). The subjects trained 2 d · wk(-1) for 10 weeks in a periodized program. Primary outcome measures included elbow flexion maximal strength measured by 1 repetition maximum (1RM) and elbow flexors MT measured by ultrasound. The results indicated that elbow flexion 1RM significantly increased (p < 0.05) for the FULL (25.7 ± 9.6%) and PART groups (16.0 ± 6.7%) but not for the CON group (1.7 ± 5.5%). Also, FULL 1RM strength was significantly greater than the PART 1RM after the training period. Average elbow flexor MT significantly increased for both training groups (9.65 ± 4.4% for FULL and 7.83 ± 4.9 for PART). These data suggest that muscle strength and MT can be improved with both FULL and PART resistance training, but FULL may lead to greater strength gains.",
      publicationTypes: ["Journal Article", "Randomized Controlled Trial"],
      meshTerms: [
        "Adolescent",
        "Adult",
        "Elbow",
        "Humans",
        "Male",
        "Muscle Strength",
        "Muscle, Skeletal",
        "Organ Size",
        "Range of Motion, Articular",
        "Resistance Training",
        "Ultrasonography",
        "Young Adult",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "very_high",
      confidence: "high",
    },
    note: {
      entryNumber: 9,
      topic: "exercise_selection_hypertrophy_rom_muscle_length",
      suppliedUse: "full vs partial ROM elbow-flexion training.",
      studyDesignAndPopulation:
        "10-week randomized controlled trial in 40 young men assigned to full ROM, partial ROM, or control groups.",
      interventionAndComparator:
        "Full range-of-motion (FULL) elbow flexion training versus partial range-of-motion (PART) elbow flexion training.",
      primaryOutcomes: "",
      directResults:
        "Elbow flexion 1RM increased significantly in FULL (25.7 ± 9.6%) and PART (16.0 ± 6.7%), with FULL achieving significantly greater strength gains than PART; elbow flexor muscle thickness increased in both groups (9.65 ± 4.4% for FULL and 7.83 ± 4.9% for PART).",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Short-term intervention in young men; limited to elbow flexors; no direct sport-transfer evidence.",
      evidenceTier: "very_high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "23629583",
      title:
        "Impact of range of motion during ecologically valid resistance training protocols on muscle size, subcutaneous fat, and strength.",
      authors: [
        "Gerard E McMahon",
        "Christopher I Morse",
        "Adrian Burden",
        "Keith Winwood",
        "Gladys L Onambélé",
      ],
      journal: "Journal of strength and conditioning research",
      year: "2014",
      volume: "28",
      issue: "1",
      pagesOrElocation: "245-55",
      doi: "10.1519/JSC.0b013e318297143a",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/23629583/",
      pmcFullTextUrl: "",
      abstract:
        "The impact of using different resistance training (RT) kinematics, which therefore alters RT mechanics, and their subsequent effect on adaptations remain largely unreported. The aim of this study was to identify the differences to training at a longer (LR) compared with a shorter (SR) range of motion (ROM) and the time course of any changes during detraining. Recreationally active participants in LR (aged 19 ± 2.6 years; n = 8) and SR (aged 19 ± 3.4 years; n = 8) groups undertook 8 weeks of RT and 4 weeks of detraining. Muscle size, architecture, subcutaneous fat, and strength were measured at weeks 0, 8, 10, and 12 (repeated measures). A control group (aged 23 ± 2.4 years; n = 10) was also monitored during this period. Significant (p > 0.05) posttraining differences existed in strength (on average 4 ± 2 vs. 18 ± 2%), distal anatomical cross-sectional area (59 ± 15 vs. 16 ± 10%), fascicle length (23 ± 5 vs. 10 ± 2%), and subcutaneous fat (22 ± 8 vs. 5 ± 2%), with LR exhibiting greater adaptations than SR. Detraining resulted in significant (p > 0.05) deteriorations in all muscle parameters measured in both groups, with the SR group experiencing a more rapid relative loss of postexercise increases in strength than that experienced by the LR group (p > 0.05). Greater morphological and architectural RT adaptations in the LR (owing to higher mechanical stress) result in a more significant increase in strength compared with that of the SR. The practical implications for this body of work follow that LR should be observed in RT where increased muscle strength and size are the objective, because we demonstrate here that ROM should not be compromised for greater external loading.",
      publicationTypes: [
        "Journal Article",
        "Randomized Controlled Trial",
        "Research Support, Non-U.S. Gov't",
      ],
      meshTerms: [
        "Adiposity",
        "Adolescent",
        "Adult",
        "Biomechanical Phenomena",
        "Female",
        "Humans",
        "Male",
        "Muscle Strength",
        "Organ Size",
        "Quadriceps Muscle",
        "Range of Motion, Articular",
        "Resistance Training",
        "Stress, Physiological",
        "Subcutaneous Fat",
        "Ultrasonography",
        "Young Adult",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "very_high",
      confidence: "high",
    },
    note: {
      entryNumber: 10,
      topic: "exercise_selection_hypertrophy_rom_muscle_length",
      suppliedUse: "ROM, fascicle adaptation, hypertrophy and strength.",
      studyDesignAndPopulation:
        "8-week randomized controlled trial with 4-week detraining in 26 recreationally active young adults (LR: n=8, SR: n=8, Control: n=10).",
      interventionAndComparator:
        "Long range of motion (0-90° knee flexion) versus short range of motion (0-50° knee flexion) resistance training.",
      primaryOutcomes: "",
      directResults:
        "Long range of motion (LR) training produced significantly greater increases in strength (18-30% vs. 4-6% in SR), distal anatomical cross-sectional area (59±15% vs. 16±10%), and fascicle length (23±5% vs. 10±2%) compared to short range of motion (SR); LR also resulted in greater subcutaneous fat loss (22±8% vs. 5±2%).",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Small sample size (n=8 per group) in recreationally active young adults; findings are specific to the vastus lateralis muscle.",
      evidenceTier: "very_high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "33977835",
      title:
        "Partial range of motion training elicits favorable improvements in muscular adaptations when carried out at long muscle lengths.",
      authors: [
        "Gustavo F Pedrosa",
        "Fernando V Lima",
        "Brad J Schoenfeld",
        "Lucas T Lacerda",
        "Marina G Simões",
        "Mariano R Pereira",
        "Rodrigo C R Diniz",
        "Mauro H Chagas",
      ],
      journal: "European journal of sport science",
      year: "2022",
      volume: "22",
      issue: "8",
      pagesOrElocation: "1250-1260",
      doi: "10.1080/17461391.2021.1927199",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/33977835/",
      pmcFullTextUrl: "",
      abstract:
        "The study compared changes in strength and regional muscle hypertrophy between different ranges of motion (ROM) in the knee extension exercise. Forty-five untrained women were randomized to either a control group or to perform the exercise in one of the following 4 groups (0°=extended knee): Full ROM (FULLROM: 100°-30° of knee flexion); Initial Partial ROM (INITIALROM: 100°-65°); Final Partial ROM (FINALROM: 65°-30°); Varied ROM (VARROM: daily alternation between the ROM of INITIALROM and FINALROM). Pre- and post-training assessments included one repetition maximum (1RM) testing in the ROM corresponding to the initial, final and full ROM, and measurement of cross-sectional areas of the rectus femoris and vastus lateralis muscles at 40%, 50%, 60% and 70% of femur length in regard to regional muscle hypertrophy. Results showed that the INITIALROM group presented a greater relative increase than all groups at 70%, and at 50% and 60% the increases were greater than FINALROM, FULLROM, and non-training control (CON) groups. Moreover, FINALROM group presented similar changes compared to the CON group at 60% and 70%. In regard to 1RM, FINALROM and INITIALROM groups presented greater relative increases at the ROM trained, and no group showed greater increases than VARROM or INITIALROM, regardless the ROM tested. In conclusion, partial ROM training in the initial phase of the knee extension exercise promoted greater relative hypertrophy in certain muscle regions than training in other ROM configurations, and no group promoted a greater 1RM increase than VARROM group, which showed similar 1RM increases in the different ROMs tested.",
      publicationTypes: ["Journal Article", "Randomized Controlled Trial"],
      meshTerms: [
        "Female",
        "Humans",
        "Hypertrophy",
        "Muscle Strength",
        "Muscle, Skeletal",
        "Range of Motion, Articular",
        "Resistance Training",
      ],
      keywords: [
        "Muscle hypertrophy",
        "excursion",
        "partial range of motion",
        "resistance exercise",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "very_high",
      confidence: "high",
    },
    note: {
      entryNumber: 11,
      topic: "exercise_selection_hypertrophy_rom_muscle_length",
      suppliedUse:
        "knee extension, regional hypertrophy and lengthened partials.",
      studyDesignAndPopulation:
        "12-week randomized controlled trial in 45 untrained women.",
      interventionAndComparator:
        "Knee extension exercise in four groups: Initial Partial ROM (100°-65° flexion), Final Partial ROM (65°-30°), Full ROM (100°-30°), and Varied ROM (alternating partials).",
      primaryOutcomes: "",
      directResults:
        "Initial Partial ROM (long muscle length) elicited greater relative hypertrophy at 70% femur length than all groups; at 50% and 60% femur length, Initial Partial ROM increases were greater than Final Partial, Full ROM, and Control; strength gains were ROM-specific for partial groups.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "12-week intervention in untrained women; regional hypertrophy results are specific to the knee extension exercise and may not generalize to trained populations.",
      evidenceTier: "very_high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "40113586",
      title:
        "Knee flexion range of motion does not influence muscle hypertrophy of the quadriceps femoris during leg press training in resistance-trained individuals.",
      authors: [
        "Stian Larsen",
        "Milo Wolf",
        "Brad J Schoenfeld",
        "Nordis Ø Sandberg",
        "Andrea B Fredriksen",
        "Benjamin S Kristiansen",
        "Roland van den Tillaar",
        "Paul A Swinton",
        "Hallvard N Falch",
      ],
      journal: "Journal of sports sciences",
      year: "2025",
      volume: "43",
      issue: "10",
      pagesOrElocation: "986-994",
      doi: "10.1080/02640414.2025.2481534",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/40113586/",
      pmcFullTextUrl: "",
      abstract:
        "This study investigated the effect of knee flexion range of motion (ROM) during the leg press exercise on quadriceps femoris muscle hypertrophy in resistance-trained individuals. Twenty-three participants (training age: 7.2 ± 3.5 years) completed a within-participant design, performing four sets of unilateral leg presses to momentary failure twice weekly for 8 weeks. In one leg, the knee flexion range of motion (ROM) was fixed at approximately 5-100°, while for the other leg, participants used their maximum individualized ROM (5-154 ± 7.8°). Quadriceps muscle thickness was assessed via B-mode ultrasonography in the proximal, central, and distal regions of the mid- and lateral thighs. Bayesian analyses were conducted to quantify treatment effects and provide inferential estimates using credible intervals and Bayes Factors (BF). Univariate and multivariate analyses indicated 'moderate' (BF = 0.14 to 0.22) and 'extreme' (BF < 0.01) evidence in support of the null hypothesis, respectively. Within-condition analyses revealed small-to-medium hypertrophic adaptation in both conditions, with absolute increases ranging from 1.08 mm to 1.91 mm. These findings suggest that both knee flexion ROMs are similarly effective for promoting quadriceps femoris muscle hypertrophy over a relatively short training-period in resistance-trained individuals.",
      publicationTypes: ["Journal Article"],
      meshTerms: [
        "Humans",
        "Quadriceps Muscle",
        "Resistance Training",
        "Range of Motion, Articular",
        "Male",
        "Female",
        "Ultrasonography",
        "Bayes Theorem",
        "Knee",
        "Young Adult",
        "Knee Joint",
        "Adaptation, Physiological",
        "Hypertrophy",
      ],
      keywords: [
        "Muscle length",
        "knee extensors",
        "regional hypertrophy",
        "resistance training",
        "ultrasonography",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "very_high",
      confidence: "high",
    },
    note: {
      entryNumber: 12,
      topic: "exercise_selection_hypertrophy_rom_muscle_length",
      suppliedUse: "trained lifters, leg-press ROM, important counterevidence.",
      studyDesignAndPopulation:
        "8-week within-participant randomized resistance-training intervention in 23 resistance-trained adults (mean training age 7.2 ± 3.5 years).",
      interventionAndComparator:
        "Unilateral leg press with maximum individualized knee flexion range of motion (5–154 ± 7.8°) versus fixed knee flexion range of motion (5–100°).",
      primaryOutcomes: "",
      directResults:
        "Both conditions produced similar small-to-medium hypertrophic adaptations in the quadriceps (absolute increases 1.08–1.91 mm); Bayesian analysis provided extreme evidence (BF < 0.01) in support of the null hypothesis that maximum range of motion provides no additional benefit over 100° for quadriceps hypertrophy.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Short-term 8-week intervention in resistance-trained adults; results are specific to the leg press exercise and do not assess long-term adaptations or sport-specific transfer.",
      evidenceTier: "very_high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "40911904",
      title:
        "The effects of long muscle length isometric versus full range of motion isotonic training on regional quadriceps femoris hypertrophy in resistance-trained individuals.",
      authors: [
        "Dorian Varovic",
        "Kristian Zganjer",
        "Milo Wolf",
        "Patroklos Androulakis-Korakakis",
        "Brad J Schoenfeld",
        "Pavle Mikulic",
      ],
      journal:
        "Applied physiology, nutrition, and metabolism = Physiologie appliquee, nutrition et metabolisme",
      year: "2025",
      volume: "50",
      issue: "",
      pagesOrElocation: "1-14",
      doi: "10.1139/apnm-2025-0238",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/40911904/",
      pmcFullTextUrl: "",
      abstract:
        "This study explored the effects of isometric training at long muscle lengths (ISOM) versus full range of motion isotonic training (ISOT) on quadriceps femoris regional hypertrophy. Twenty-three healthy, resistance-trained men and women completed a 6-week, twice-per-week intervention. A within-subject study design was employed with limbs randomized to unilateral ISOM or ISOT knee extension. Muscle thickness was assessed pre- and post-intervention at proximal, middle, and distal sites of the anterior thigh and lateral thigh. Data was analyzed using Bayesian linear mixed-effects models. The between-condition estimate for summed anterior thigh muscle thickness was -0.20 cm (high-density credible intervals (HDI): -0.54, 0.16), with 87% probability of direction (pd), and 75% of the posterior distribution exceeding the region of practical equivalence (ROPE). At the proximal site of the anterior thigh, between-condition estimates showed the greatest directional shift in favor of ISOM (contrast estimate: -0.11 cm (95% HDI: -0.24, 0.02)), with 82% of the posterior distribution exceeding the ROPE. Minimal to negligible changes in summed and regional lateral thigh muscle thickness were found for both conditions. Overall, ISOM and ISOT elicited similar quadriceps hypertrophy in resistance-trained individuals. Isometric training at long muscle lengths may elicit a superior hypertrophic effect in the proximal anterior thigh; however, uncertainty in the effect estimates precludes definitive conclusion in this regard and further investigation is warranted.",
      publicationTypes: [
        "Comparative Study",
        "Journal Article",
        "Randomized Controlled Trial",
      ],
      meshTerms: [
        "Adult",
        "Female",
        "Humans",
        "Male",
        "Young Adult",
        "Hypertrophy",
        "Isometric Contraction",
        "Isotonic Contraction",
        "Muscle Strength",
        "Quadriceps Muscle",
        "Range of Motion, Articular",
        "Resistance Training",
      ],
      keywords: [
        "joint angle",
        "length–tension relationship",
        "muscle action",
        "nonuniform hypertrophy",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "very_high",
      confidence: "high",
    },
    note: {
      entryNumber: 13,
      topic: "exercise_selection_hypertrophy_rom_muscle_length",
      suppliedUse:
        "isometric long-length training vs full-ROM isotonic training.",
      studyDesignAndPopulation:
        "6-week within-subject randomized controlled trial in 23 resistance-trained men and women.",
      interventionAndComparator:
        "Unilateral isometric training at long muscle lengths (~125° knee flexion) versus full range of motion isotonic training (~125° to 10° knee flexion).",
      primaryOutcomes: "",
      directResults:
        "Both conditions increased anterior thigh muscle thickness, with isometric training showing a greater directional increase (0.33 cm, 99% pd) compared to isotonic training (0.13 cm, 82% pd); the greatest regional benefit for isometric training occurred at the proximal anterior thigh site (contrast: -0.11 cm).",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Short-term 6-week intervention in a relatively small sample; ultrasound muscle thickness serves as a proxy for hypertrophy and uncertainty in regional estimates precludes definitive conclusions.",
      evidenceTier: "very_high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "41247250",
      title:
        "Partial Range, Full Gains? The Effect of 8 Weeks of Partial Range of Motion Training at Long Muscle Lengths on Elbow Flexor Hypertrophy and Strength in Trained Individuals.",
      authors: [
        "Tim Havers",
        "Niklas Wagner",
        "Steffen Held",
        "Stephan Geisler",
        "Thimo Wiewelhove",
      ],
      journal: "European journal of sport science",
      year: "2025",
      volume: "25",
      issue: "12",
      pagesOrElocation: "e70087",
      doi: "10.1002/ejsc.70087",
      pmcid: "PMC12621570",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/41247250/",
      pmcFullTextUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12621570/",
      abstract:
        "We investigated the effects of initial partial range of motion (pROMinitial; 0°-70°) and full range of motion (fROM; 0°-140°) training on elbow flexor hypertrophy and strength in resistance-trained individuals. Thirteen individuals (males: n = 11, 26.6 ± 4.0 years, 89.2 ± 16.7 kg, and 183.3 ± 10.0 cm; females: n = 2, 24.0 ± 1.4 years, 75.5 ± 12.3 kg, and 168.0 ± 4.2 cm) completed a randomized within-subject study, performing unilateral preacher curls with each arm assigned to one condition over 8 weeks. Muscle thickness at 50% and 70% of the distance between the acromion and cubital fossa, maximal voluntary contraction (MVC) at elbow angles of 40° and 100°, and one-repetition maximum (1RM) were measured pre- and postintervention. Bayesian analyses were employed to infer effects from posterior distributions. Results showed similar improvements in muscle thickness at 50% humeral length between conditions, whereas pROMinitial exhibited trivial to small superiority at 70% elbow flexor length (standardized mean difference [SMD] = 0.10 and Bayes factor = 4.87). Additionally, MVC at 100° (SMD = 0.24 and Bayes factor = 3.02) and 1RM (SMD = 0.17 and Bayes factor = 1.95) demonstrated greater but negligible improvements with fROM, with weak to moderate evidence supporting the hypothesis of differential effectiveness across interventions. These findings suggest that pROMinitial may offer modest benefits for regional hypertrophy, particularly at longer muscle lengths. The results indicate that both training modalities can induce beneficial adaptations, with pROMinitial offering slight advantages in specific contexts. CLINICAL TRIAL REGISTRATION: This study was registered at German Clinical Trials Register with the registration number DRKS00035811.",
      publicationTypes: ["Journal Article", "Randomized Controlled Trial"],
      meshTerms: [
        "Humans",
        "Female",
        "Adult",
        "Muscle Strength",
        "Resistance Training",
        "Range of Motion, Articular",
        "Young Adult",
        "Muscle, Skeletal",
        "Male",
        "Hypertrophy",
        "Elbow",
        "Elbow Joint",
        "Bayes Theorem",
      ],
      keywords: [
        "cross‐sectional area",
        "muscle strength",
        "partials",
        "resistance exercise",
        "training intervention",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "FULL_TEXT_VERIFIED",
      evidenceTier: "very_high",
      confidence: "high",
    },
    note: {
      entryNumber: 14,
      topic: "exercise_selection_hypertrophy_rom_muscle_length",
      suppliedUse: "lengthened partials, elbow flexors.",
      studyDesignAndPopulation:
        "Randomized within-subject design involving 13 resistance-trained participants (11 males, 2 females; 6.0 ± 4.0 years training experience) performing 8 weeks of unilateral training.",
      interventionAndComparator:
        "Unilateral preacher curls performed with one arm using partial range of motion at long muscle lengths (pROMinitial, 0°–70°) compared to the contralateral arm using full range of motion (fROM, 0°–140°).",
      primaryOutcomes:
        "Elbow flexor muscle thickness at 50% and 70% humeral length, isometric strength (MVC at 40° and 100°), and dynamic strength (1RM).",
      directResults:
        "Over an 8-week period, both training conditions significantly increased training volume load (p < 0.05). Partial range of motion at long muscle lengths (pROMinitial, 0°–70°) induced greater distal hypertrophy at 70% humeral length compared to full range of motion (fROM, 0°–140°) (7.60% vs. 4.38%; SMD = 0.10). In contrast, no meaningful difference was observed in proximal hypertrophy at 50% humeral length (SMD = 0.04). Regarding strength, fROM resulted in slightly greater 1RM gains (SMD = 0.17), whereas pROMinitial showed a trend favoring isometric strength at 100° (MVC100°: 6.46% vs. 3.81%; SMD = 0.24). Absolute differences in strength outcomes remained small, ranging from 0.14 to 0.24 kg.",
      implementationImplication:
        "Utilize partial range of motion repetitions at long muscle lengths (0°–70° flexion) to specifically target distal elbow flexor hypertrophy while retaining full range of motion for maximal dynamic strength development.",
      limitations:
        "Small sample size (n=13), 8-week duration potentially insufficient for well-trained individuals, and inability to distinguish between specific elbow flexor muscles (biceps brachii, brachialis, brachioradialis) via ultrasound.",
      evidenceTier: "very_high",
      reviewStatus: "FULL_TEXT_VERIFIED",
      confidence: "high",
      noteSource: "PMC full-text sections retrieved through NCBI EFetch",
    },
  },
  {
    study: {
      pmid: "37559762",
      title:
        "Regional Hypertrophy: The Effect of Exercises at Long and Short Muscle Lengths in Recreationally Trained Women.",
      authors: [
        "Aitor Zabaleta-Korta",
        "Eneko Fernández-Peña",
        "Jon Torres-Unda",
        "Maider Francés",
        "Asier Zubillaga",
        "Jordan Santos-Concejero",
      ],
      journal: "Journal of human kinetics",
      year: "2023",
      volume: "87",
      issue: "",
      pagesOrElocation: "259-270",
      doi: "10.5114/jhk/163561",
      pmcid: "PMC10407320",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/37559762/",
      pmcFullTextUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10407320/",
      abstract:
        "The aim of the present study was to analyse the role of exercises' resistance profile in regional hypertrophy. Thirty-eight healthy women completed a 9-week resistance training program consisting of either 4 sets of 12 repetitions to volitional failure of inclined bicep curls (INC group) or preacher curls (PREA group), three times per week. Pre- and post-intervention muscle thickness was measured using B-mode ultrasound imaging with a linear-array transducer. Scan acquisition sites were determined by measuring 50%, 60% and 70% of the distance between the posterior crest of the acromion and the olecranon. Statistical significance was set at p < 0.05. No region of the INC group grew when comparing pre- to post-intervention. The 70% region of the PREA group grew significantly (muscle thickness increased from 2.7 ± 0.43 cm to 2.94 ± 0.44 cm). We found no growth differences between regions when analysing per group (p = 0.274), region (p = 0.571) or group*region (p = 0.367). Our results show that the distal region of the arm grows in response to the preacher curl that places the highest amount of strain in the range of motion in which the arm muscles are more elongated.",
      publicationTypes: ["Journal Article"],
      meshTerms: [],
      keywords: [
        "muscle architecture",
        "muscle growth",
        "selective hypertrophy",
        "strength",
        "variable resistance",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "FULL_TEXT_VERIFIED",
      evidenceTier: "very_high",
      confidence: "high",
    },
    note: {
      entryNumber: 15,
      topic: "exercise_selection_hypertrophy_rom_muscle_length",
      suppliedUse: "regional hypertrophy and muscle length.",
      studyDesignAndPopulation:
        "Randomized controlled trial of 31 healthy, recreationally trained women (minimum 6 months experience) completing a 9-week resistance training intervention.",
      interventionAndComparator:
        "Nine-week resistance training program (4 sets of 12 repetitions to failure, 3x/week) comparing preacher curls (peak strain at long muscle lengths) to incline biceps curls (peak strain at short muscle lengths).",
      primaryOutcomes:
        "Muscle thickness of the elbow flexors measured via B-mode ultrasound at 50%, 60%, and 70% of the distance between the acromion and olecranon.",
      directResults:
        "Within-region analysis demonstrated significant hypertrophy only in the distal (70%) region of the preacher curl group (p = 0.017, ES = 0.623, ~10% increase from 2.68 ± 0.43 cm to 2.94 ± 0.44 cm), with no significant growth in the 50% or 60% regions or any region of the incline curl group (p > 0.05). Although the two-way ANOVA showed no significant group-by-region interaction (p = 0.544), preacher curls resulted in localized distal adaptation whereas incline curls did not elicit significant thickness changes at any measured site.",
      implementationImplication:
        "Prioritize elbow flexor exercises with descending resistance profiles that maximize strain at long muscle lengths, such as preacher curls, to specifically target distal muscle hypertrophy.",
      limitations:
        "The study was statistically underpowered (n=31 vs. target 49) with high dropout in the incline group, utilized one-dimensional muscle thickness rather than three-dimensional imaging, and could not differentiate between biceps brachii and brachialis growth.",
      evidenceTier: "very_high",
      reviewStatus: "FULL_TEXT_VERIFIED",
      confidence: "high",
      noteSource: "PMC full-text sections retrieved through NCBI EFetch",
    },
  },
  {
    study: {
      pmid: "39809454",
      title:
        "Distinct muscle growth and strength adaptations after preacher and incline biceps curls.",
      authors: [
        "Witalo Kassiano",
        "Bruna Costa",
        "Gabriel Kunevaliki",
        "Felipe Lisboa",
        "Natã Stavinski",
        "Aline Prado",
        "Ian Tricoli",
        "Jarlisson Francsuel",
        "Luis Lima",
        "JoãoPedro Nunes",
        "Alex Silva Ribeiro",
        "Edilson S Cyrino",
      ],
      journal: "International journal of sports medicine",
      year: "2025",
      volume: "46",
      issue: "5",
      pagesOrElocation: "334-343",
      doi: "10.1055/a-2517-0509",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/39809454/",
      pmcFullTextUrl: "",
      abstract:
        "We compared performing preacher and incline biceps curls on changes in elbow flexor muscle size and strength. This was a between-group repeated measure randomized trial. Sixty-three young women performed the preacher biceps curl (n=30) or the incline biceps curl (n=33) for 8 weeks, twice a week. We measured the muscle thickness of elbow flexors at the proximal, middle, and distal sites. We assessed the muscle strength using three repetition maximum tests in the preacher curl and the incline curl. We observed a greater increase in the proximal elbow flexor thickness in the incline biceps curl compared to the preacher biceps curl (mean difference=0.08 cm [95% confidence interval: 0.02, 0.13 cm]). We observed a greater increase in the distal elbow flexor thickness in the preacher biceps curl compared to the incline biceps curl (mean difference=0.10 cm [95%CI: 0.04, 0.15 cm]). The preacher biceps curl showed a greater increase in three repetition maximum tests in the preacher curl (mean difference=1.88 kg [95%CI: 1.14, 2.62 kg]). The incline biceps curl showed a greater increase in three repetition maximum tests in the incline biceps curl (mean difference=0.86 kg [95%CI: 0.10, 1.62 kg]). Our findings suggest regional differences in muscle growth induced by the preacher and incline biceps curls. Strength gains appear to follow the principle of specificity.",
      publicationTypes: ["Journal Article", "Randomized Controlled Trial"],
      meshTerms: [
        "Adult",
        "Female",
        "Humans",
        "Young Adult",
        "Adaptation, Physiological",
        "Elbow",
        "Muscle Development",
        "Muscle Strength",
        "Muscle, Skeletal",
        "Resistance Training",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "very_high",
      confidence: "high",
    },
    note: {
      entryNumber: 16,
      topic: "exercise_selection_hypertrophy_rom_muscle_length",
      suppliedUse: "proximal vs distal elbow-flexor hypertrophy.",
      studyDesignAndPopulation:
        "8-week between-group repeated measures randomized clinical trial in 63 untrained young women.",
      interventionAndComparator:
        "Preacher biceps curl versus incline biceps curl.",
      primaryOutcomes: "",
      directResults:
        "Incline curls induced greater proximal muscle thickness increases (MD=0.08 cm); preacher curls induced greater distal muscle thickness increases (MD=0.10 cm); strength gains followed the principle of specificity with greater increases in the trained exercise.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Short-term 8-week intervention in untrained young women; not direct sport-transfer evidence.",
      evidenceTier: "very_high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "40082069",
      title:
        "Comparison Between Shoulder Flexed and Extended Positions in Elbow Flexion Resistance Training on Regional Hypertrophy and Maximum Strength: Preacher versus Bayesian Cable Curls.",
      authors: [
        "Parsa Attarieh",
        "João Pedro Nunes",
        "Saeed Khani",
        "Saman Negahdar",
        "Amirali Goli",
        "Hamed Nazarirad",
        "Shahriar Nazarirad",
        "Shima Mojtahedi",
        "Kazunori Nosaka",
        "Rahman Soori",
      ],
      journal: "European journal of sport science",
      year: "2025",
      volume: "25",
      issue: "4",
      pagesOrElocation: "e12279",
      doi: "10.1002/ejsc.12279",
      pmcid: "PMC11906226",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/40082069/",
      pmcFullTextUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11906226/",
      abstract:
        "In the present study, the effects of resistance training on regional hypertrophy and maximum strength of the elbow flexor muscles were compared between elbow flexion exercises performed with different shoulder joint angles (∼50° of flexion vs. extension) while matched for resistance profiles. In a within-subject design, 15 young men (25.6 ± 2.1 y; 77.3 ± 6.8 kg; 175.1 ± 5.7 cm) underwent a resistance training program twice a week for 10 weeks (3-5 sets, 8-12RM), and their arms were dominant-side balanced, randomly assigned to one of the two conditions according to elbow flexion exercises: unilateral cable curl with shoulder flexed (Preacher curl; PREA) or unilateral cable curl with shoulder extended (Bayesian curl; BAYE). B-mode ultrasound imaging was used to measure changes in muscle thickness of the biceps brachii and brachialis at proximal, mid, and distal arm regions, and one-repetition maximum tests were completed in each respective trained exercise before and after training. Both conditions showed significant increases in muscle thickness (p < 0.05) with no significant differences between them (p > 0.05) across the biceps brachii proximal, mid, and distal regions (relative change [Hedges' g effect size]; PREA: 6%[0.51], 7%[0.49], 7%[0.53]; BAYE: 9%[0.73], 9%[0.62], 9%[0.62]) and brachialis (PREA: 10%[0.72]; BAYE: 8%[0.65]). Similarly, significant improvements in maximum strength were observed (p < 0.05), with equivalent results between conditions (PREA: 28%[0.85], BAYE: 37%[1.22]; equivalence testing, p-values = 0.061, 0.637). In conclusion, the shoulder joint angle does not seem to affect muscle hypertrophy and maximum strength gains after different elbow flexion exercises matched for resistance profiles.",
      publicationTypes: [
        "Journal Article",
        "Comparative Study",
        "Randomized Controlled Trial",
      ],
      meshTerms: [
        "Humans",
        "Resistance Training",
        "Male",
        "Muscle Strength",
        "Adult",
        "Muscle, Skeletal",
        "Young Adult",
        "Ultrasonography",
        "Elbow",
        "Elbow Joint",
        "Shoulder Joint",
        "Shoulder",
        "Range of Motion, Articular",
      ],
      keywords: [
        "exercise selection",
        "inhomogeneous hypertrophy",
        "muscle architecture",
        "strength training",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "FULL_TEXT_VERIFIED",
      evidenceTier: "very_high",
      confidence: "high",
    },
    note: {
      entryNumber: 17,
      topic: "exercise_selection_hypertrophy_rom_muscle_length",
      suppliedUse: "biceps training at differing shoulder positions.",
      studyDesignAndPopulation:
        "Within-subject design in 15 untrained young men (25.6 ± 2.1 years) where dominant and non-dominant arms were randomly assigned to different conditions.",
      interventionAndComparator:
        "A 10-week progressive resistance training program (2 sessions/week, 3-5 sets, 8-12 RM) comparing Preacher curls (shoulder flexed ~50°) versus Bayesian cable curls (shoulder extended ~50°) with matched torque-angle profiles.",
      primaryOutcomes:
        "Regional muscle thickness of the biceps brachii and brachialis via ultrasonography and 1RM strength in the respective exercises.",
      directResults:
        "Both Preacher (PREA) and Bayesian (BAYE) cable curls elicited significant large increases in 1RM strength (PREA: 28%, ES 0.85; BAYE: 37%, ES 1.22) and moderate-to-large increases in regional muscle thickness (Biceps: PREA 7%, ES 0.53; BAYE 9%, ES 0.68; Brachialis: PREA 10%, ES 0.72; BAYE 8%, ES 0.65). No significant differences were detected between the two shoulder positions for any regional hypertrophy measure (p = 0.205–0.946) or strength gains, indicating that altering shoulder position did not differentially influence adaptations when torque profiles were matched.",
      implementationImplication:
        "Selection between Preacher and Bayesian curls can be based on preference or equipment availability as both elicit similar regional hypertrophy and strength adaptations when resistance profiles are matched.",
      limitations:
        "Small sample of untrained young men, 10-week duration, exercise-specific strength testing, and lack of separate analysis for individual biceps heads.",
      evidenceTier: "very_high",
      reviewStatus: "FULL_TEXT_VERIFIED",
      confidence: "high",
      noteSource: "PMC full-text sections retrieved through NCBI EFetch",
    },
  },
  {
    study: {
      pmid: "32823490",
      title:
        "Placing Greater Torque at Shorter or Longer Muscle Lengths? Effects of Cable vs. Barbell Preacher Curl Training on Muscular Strength and Hypertrophy in Young Adults.",
      authors: [
        "João Pedro Nunes",
        "Jeferson L Jacinto",
        "Alex S Ribeiro",
        "Jerry L Mayhew",
        "Masatoshi Nakamura",
        "Danila M G Capel",
        "Leidiane R Santos",
        "Leandro Santos",
        "Edilson S Cyrino",
        "Andreo F Aguiar",
      ],
      journal:
        "International journal of environmental research and public health",
      year: "2020",
      volume: "17",
      issue: "16",
      pagesOrElocation: "",
      doi: "10.3390/ijerph17165859",
      pmcid: "PMC7460162",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/32823490/",
      pmcFullTextUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7460162/",
      abstract:
        "Muscular strength and hypertrophy following resistance training may be obtained in different degrees depending on the approach performed. This study was designed to compare the responses of the biceps brachii to two preacher curl exercises, one performed on a cable-pulley system (CAB; in which a greater torque was applied during the exercise when elbows were flexed and biceps shortened) and one performed with a barbell (BAR; in which greater torque was applied when the elbows were extended and biceps stretched). Thirty-five young adults (CAB: 13 men, 5 women; BAR: 12 men, 5 women; age = 24 ± 5 years) performed a resistance training program three times per week for 10 weeks, with preacher curl exercises performed in three sets of 8-12 repetitions. Outcomes measured included elbow flexion peak isokinetic torque at angles of 20°, 60°, and 100° (considering 0° as elbow extended), and biceps brachii thickness (B-mode ultrasound). Following the training period, there were significant increases for both groups in elbow flexion peak torque at the 20° (CAB: 30%; BAR = 39%; p = 0.046), 60° (CAB: 27%; BAR = 32%; p = 0.874), and 100° (CAB: 17%; BAR = 19%; p = 0.728), and biceps brachii thickness (CAB: 7%; BAR = 8%; p = 0.346). In conclusion, gains in muscular strength were greater for BAR only at longer muscle length, whereas hypertrophy was similar regardless of whether torque emphasis was carried out in the final (CAB) or initial (BAR) degrees of the range of motion of the preacher curl in young adults.",
      publicationTypes: ["Journal Article", "Research Support, Non-U.S. Gov't"],
      meshTerms: [
        "Adult",
        "Female",
        "Humans",
        "Hypertrophy",
        "Male",
        "Muscle Strength",
        "Muscle, Skeletal",
        "Range of Motion, Articular",
        "Resistance Training",
        "Torque",
        "Young Adult",
      ],
      keywords: [
        "Scott curl",
        "exercise selection",
        "muscle architecture",
        "strength training",
        "variable resistance",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "FULL_TEXT_VERIFIED",
      evidenceTier: "very_high",
      confidence: "high",
    },
    note: {
      entryNumber: 18,
      topic: "exercise_selection_hypertrophy_rom_muscle_length",
      suppliedUse: "resistance curves, elbow flexor length.",
      studyDesignAndPopulation:
        "This 14-week study (10-week training) randomized 35 untrained young adults (25 men, 10 women; mean age 23.7 years) into two training groups.",
      interventionAndComparator:
        "Participants performed supervised preacher curl training (3 sets of 8–12 RM, 3x/week) using either a cable-pulley device or a barbell.",
      primaryOutcomes:
        "The main outcomes were biceps brachii muscle thickness measured by ultrasound and isokinetic elbow flexion peak torque at 20°, 60°, and 100°.",
      directResults:
        "Both groups significantly increased biceps thickness (CAB: +7%, BAR: +8%; p=0.346) and peak torque at all angles (17-39%). The BAR group achieved significantly greater strength gains at 20° (extended position) compared to CAB (BAR: +39% vs CAB: +30%; p=0.046), while no differences were observed at 60° (p=0.874) or 100° (p=0.728).",
      implementationImplication:
        "Cable and barbell preacher curls can be used interchangeably for biceps hypertrophy, although barbell training may provide a specific strength advantage at long muscle lengths (20° flexion).",
      limitations:
        "The findings are limited to untrained individuals over a 10-week period and may be influenced by the inclusion of other elbow flexor exercises in the program.",
      evidenceTier: "very_high",
      reviewStatus: "FULL_TEXT_VERIFIED",
      confidence: "high",
      noteSource: "PMC full-text sections retrieved through NCBI EFetch",
    },
  },
  {
    study: {
      pmid: "39593465",
      title:
        "Muscle hypertrophy response across four muscles involved in the bench press exercise: Randomized 10 weeks training intervention.",
      authors: [
        "Marcel B Lanza",
        "Gustavo C Prado",
        "Lucas T Lacerda",
        "Ricardo Reis Dinardi",
        "Lúcio Honório Carvalho Junior",
        "Rodrigo C Diniz",
        "Fernando V Lima",
        "Mauro H Chagas",
        "Hugo C Martins-Costa",
      ],
      journal: "Journal of bodywork and movement therapies",
      year: "2024",
      volume: "40",
      issue: "",
      pagesOrElocation: "1417-1422",
      doi: "10.1016/j.jbmt.2024.07.054",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/39593465/",
      pmcFullTextUrl: "",
      abstract:
        "Resistance training exercise provides increases in muscle size and is used by coaches and health care professional as a tool to improve functional performance. The aim of the present study was to investigate the effect of 10 weeks of resistance training program performed on the bench press (BP) exercise on the hypertrophic responses of four different muscles (pectoralis major, anterior and medial deltoid, brachii, and pectoralis minor) involved in the task compared to controls.\n\nTwenty-four healthy males were recruited, and thirteen performed a resistance training intervention while eleven were control. RT group trained for 10 weeks and the protocol consisted of a time under tension for each set of 36s (3-4 sets) with 12 repetitions with an intensity of 50-55% of the 1RM, a training frequency of 3 times a week, with a 3 min rest between sets. Muscle cross-sectional area (CSA) was measure by magnetic resonance imaging.\n\nIndividuals in the RT group demonstrated higher changes in CSA of the pectoralis major, pectoralis minor, anterior deltoid, and triceps brachii (P ≤ 0.019) than in the Control group. It was identified in the RT group higher increases in CSA of all muscles compared to medial deltoid (P ≤ 0.016), while pectoralis major demonstrated larger increases in CSA than pectoralis minor and triceps brachii (P ≤ 0.030).\n\nWe demonstrated that 10 weeks of resistance training performed on the BP exercise led to increases in muscle size of the muscles involved in the task, but not in the same magnitude.",
      publicationTypes: ["Journal Article", "Randomized Controlled Trial"],
      meshTerms: [
        "Humans",
        "Male",
        "Resistance Training",
        "Muscle, Skeletal",
        "Adult",
        "Young Adult",
        "Hypertrophy",
        "Magnetic Resonance Imaging",
        "Weight Lifting",
        "Muscle Strength",
        "Pectoralis Muscles",
      ],
      keywords: [
        "Agonist muscles",
        "Bench press exercise",
        "Magnetic resonance imaging",
        "Muscle cross-sectional area",
        "Resistance training",
        "Synergist muscles",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "very_high",
      confidence: "high",
    },
    note: {
      entryNumber: 19,
      topic: "exercise_selection_hypertrophy_rom_muscle_length",
      suppliedUse:
        "MRI-based pectoralis, triceps and anterior-deltoid adaptation.",
      studyDesignAndPopulation:
        "10-week randomized controlled trial in 24 healthy males (13 intervention, 11 control).",
      interventionAndComparator:
        "10 weeks of bench press training (3-4 sets, 12 reps, 50-55% 1RM, 3x/week) versus a non-training control group.",
      primaryOutcomes: "",
      directResults:
        "RT group demonstrated significantly higher increases in CSA of the pectoralis major, pectoralis minor, anterior deltoid, and triceps brachii (P ≤ 0.019) compared to control; pectoralis major demonstrated larger increases in CSA than pectoralis minor and triceps brachii (P ≤ 0.030).",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Short-term intervention in healthy males; results specific to low-to-moderate intensity (50-55% 1RM) bench press.",
      evidenceTier: "very_high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "32922646",
      title:
        "Effects of Horizontal and Incline Bench Press on Neuromuscular Adaptations in Untrained Young Men.",
      authors: [
        "Suene F N Chaves",
        "Valdinar A Rocha-JÚnior",
        "Irismar G A EncarnaÇÃo",
        "Hugo C Martins-Costa",
        "Eduardo D S Freitas",
        "Daniel B Coelho",
        "Frederico S C Franco",
        "Jeremy P Loenneke",
        "Martim Bottaro",
        "JoÃo B Ferreira-JÚnior",
      ],
      journal: "International journal of exercise science",
      year: "2020",
      volume: "13",
      issue: "6",
      pagesOrElocation: "859-872",
      doi: "10.70252/FDNB1158",
      pmcid: "PMC7449336",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/32922646/",
      pmcFullTextUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7449336/",
      abstract:
        "The aim of the current study was to investigate the effects of horizontal and incline bench press as well as the combination of both exercises on neuromuscular adaptation in untrained young men. Forty-seven untrained men were randomly assigned to one of the three groups: 1) a horizontal bench press group (n= 15), 2) an incline bench press group (n= 15), and 3) a combination (horizontal + incline) group (n= 17). Training was conducted once a week for eight weeks, with equalized number of sets among groups. Muscle thickness, isometric strength and electromyography (EMG) amplitude of the pectoralis major were measured one week before and after the training period. There was no difference between groups for the change in horizontal bench press isometric strength (~ 10 kg increase, p=0.776) or incline bench press isometric strength (~ 11 kg increase, p=0.333). Changes in muscle thickness differed only in one of the three sites. The changes in the second intercostal space of the pectoralis major was greatest in the incline pressure group compared with the horizontal [mean difference (95% CI) of 0.62 (0.23, 1.0) cm, p=0.003] and combination groups [mean difference (95% CI) of 0.50 (0.14, 0.86) cm, p=0.008]. The change in EMG amplitude following training differed between groups in only one out of the four sites. The present results indicate that strength and conditioning professionals might consider that horizontal and incline bench press exercises, or a combination of both exercises can render similar change in general strength.",
      publicationTypes: ["Journal Article"],
      meshTerms: [],
      keywords: [
        "Exercise choice",
        "exercise variation",
        "hypertrophy",
        "strength",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "very_high",
      confidence: "high",
    },
    note: {
      entryNumber: 20,
      topic: "exercise_selection_hypertrophy_rom_muscle_length",
      suppliedUse: "incline vs horizontal pressing.",
      studyDesignAndPopulation:
        "8-week randomized resistance-training intervention in 47 untrained young men.",
      interventionAndComparator:
        "Horizontal bench press versus incline bench press versus combined horizontal and incline bench press.",
      primaryOutcomes: "",
      directResults:
        "No significant differences between groups for isometric horizontal (~10 kg) or incline (~11 kg) bench strength; incline-only training produced significantly greater muscle thickness increases at the 2nd intercostal space compared to horizontal-only (0.62 cm difference) and combination groups (0.50 cm difference); changes in muscle thickness at 3rd and 5th intercostal spaces and surface EMG amplitude were largely similar between groups.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Short-term intervention in untrained men using non-specific isometric strength testing and low-frequency training.",
      evidenceTier: "very_high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "34564324",
      title:
        "Drop-Set Training Elicits Differential Increases in Non-Uniform Hypertrophy of the Quadriceps in Leg Extension Exercise.",
      authors: [
        "Dorian Varović",
        "Kristian Žganjer",
        "Saša Vuk",
        "Brad J Schoenfeld",
      ],
      journal: "Sports (Basel, Switzerland)",
      year: "2021",
      volume: "9",
      issue: "9",
      pagesOrElocation: "",
      doi: "10.3390/sports9090119",
      pmcid: "PMC8473065",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/34564324/",
      pmcFullTextUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8473065/",
      abstract:
        "The study aimed to compare the effects of drop set resistance training (RT) versus traditional RT on markers of maximal muscle strength and regional hypertrophy of the quadriceps femoris. Sixteen recreationally active young men had one leg randomly assigned to the drop-set method (DS) and the other to training in a traditional manner (TRAD). Participants performed unilateral seated leg extensions using a periodized approach for eight weeks. Rectus femoris (RF) and vastus lateralis (VL) muscle thickness (MT), estimated one repetition maximum (RM) in the unilateral knee extension, and peak and average isokinetic knee extension torque at 60°/s angular velocity were measured pre- and post-study. Both conditions increased muscle thickness of the RF and VL from pre- to post-intervention. DS showed statistically greater increases in the RF at 30% and 50% of muscle length, whereas no MT differences were detected at 70% muscle length nor at any aspect of the VL. Both DS and TRAD increased estimated one RM from pre- to post-study (+34.6% versus +32.0%, respectively) with no between-condition differences noted. Both conditions showed similar increases in peak torque (DS: +21.7%; TRAD: +22.5%) and average torque (DS: +23.6%; TRAD: +22.5%) from pre- to post-study. Our findings indicate a potential benefit of the drop-set method for inducing non-uniform hypertrophic gains in the RF muscle pursuant to leg extension training. The strategy did not promote an advantage in improving hypertrophy of the VL, nor in strength-related measures, compared to traditional training.",
      publicationTypes: ["Journal Article"],
      meshTerms: [],
      keywords: [
        "muscle adaptation",
        "muscle growth",
        "resistance training",
        "training methods",
        "training volume",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "FULL_TEXT_VERIFIED",
      evidenceTier: "very_high",
      confidence: "high",
    },
    note: {
      entryNumber: 21,
      topic: "exercise_selection_hypertrophy_rom_muscle_length",
      suppliedUse: "regional hypertrophy and set configuration.",
      studyDesignAndPopulation:
        "Within-subject randomized trial in 16 recreationally trained young men (initial n=24) comparing unilateral leg extension training protocols.",
      interventionAndComparator:
        "Eight weeks of unilateral leg extension training comparing a drop-set protocol (initial load ~5RM) against a traditional training protocol (~15RM).",
      primaryOutcomes:
        "Muscle thickness of the rectus femoris and vastus lateralis at 30%, 50%, and 70% muscle length, and maximal dynamic and isokinetic strength.",
      directResults:
        "Drop-set training elicited significantly greater rectus femoris hypertrophy at the 30% (17.7% vs. 3.7%) and 50% (8.3% vs. 3.6%) muscle length sites compared to traditional training, while vastus lateralis hypertrophy was similar between conditions across all measured sites. Both protocols achieved significant and comparable increases in estimated 1RM strength (34.6% vs. 32.0%) and isokinetic peak torque (21.7% vs. 22.5%). While total training volume (sets x reps) was similar between groups, the drop-set condition resulted in a significantly higher volume load.",
      implementationImplication:
        "Incorporate drop-sets into leg extension programming to enhance regional hypertrophy of the rectus femoris in recreationally trained individuals.",
      limitations:
        "The study is limited to single-joint leg extensions in recreationally trained young men over a short 8-week duration and may be influenced by cross-education effects.",
      evidenceTier: "very_high",
      reviewStatus: "FULL_TEXT_VERIFIED",
      confidence: "high",
      noteSource: "PMC full-text sections retrieved through NCBI EFetch",
    },
  },
  {
    study: {
      pmid: "41055237",
      title:
        "The effects of lengthened-partial range of motion resistance training of the limbs on arm and thigh muscle area: A multi-site randomised trial.",
      authors: [
        "David Gschneidner",
        "Luke Carlson",
        "James Steele",
        "James P Fisher",
      ],
      journal: "Journal of sports sciences",
      year: "2025",
      volume: "43",
      issue: "23",
      pagesOrElocation: "2963-2976",
      doi: "10.1080/02640414.2025.2567805",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/41055237/",
      pmcFullTextUrl: "",
      abstract:
        "This project represents a highly powered pre-registered comparison of full ROM (fROM) and 'lengthened partial' ROM (lpROM) resistance training [RT]. A randomized controlled cluster trial across 15 sites was employed. The outcomes were muscle cross sectional area (CSA) of the upper arm and thigh, and strength for chest press, leg press, and pulldown. Pre-testing preceded randomization to either the lpROM (n = 163) or fROM (n = 134) RT condition. Post-testing was completed following a 12-week intervention. Our primary estimand of interest was the condition by time interaction. The estimate for this effect for arm estimated muscle CSA was -0.032 and for thigh estimated muscle CSA was 0. The p-values for equivalence were p = 0.071 for the arm muscle, and p = 0.019 for the thigh muscle. Inference criteria with alpha were set at 0.01 and adjusted to 0.005 for multiple outcomes, as such, we were unable to reject the null hypothesis that the condition:time interaction effect was outside of the SESOI [-0.1, 0.1]. Exploratory analysis suggests that both the main effects of time, and any interaction effects for condition by time, are likely small. These findings support previous evidence comparing fROM and lpROM specifically and suggest that between condition effects are small and practically equivalent.",
      publicationTypes: [
        "Journal Article",
        "Randomized Controlled Trial",
        "Multicenter Study",
      ],
      meshTerms: [
        "Humans",
        "Resistance Training",
        "Thigh",
        "Muscle, Skeletal",
        "Arm",
        "Muscle Strength",
        "Male",
        "Young Adult",
        "Adult",
        "Range of Motion, Articular",
        "Female",
      ],
      keywords: ["Range of motion", "hypertrophy", "strength"],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "very_high",
      confidence: "high",
    },
    note: {
      entryNumber: 22,
      topic: "exercise_selection_hypertrophy_rom_muscle_length",
      suppliedUse: "large-scale lengthened partial ROM evidence.",
      studyDesignAndPopulation:
        "12-week randomized controlled cluster trial in 297 trained adults across 15 sites.",
      interventionAndComparator:
        "Lengthened-partial range of motion (lpROM) versus full range of motion (fROM) resistance training.",
      primaryOutcomes: "",
      directResults:
        "Condition by time interaction for arm estimated muscle CSA was -0.032 and for thigh was 0; p-values for equivalence were 0.071 (arm) and 0.019 (thigh); results suggest practically equivalent outcomes for hypertrophy and strength between fROM and lpROM.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Equivalence was not statistically confirmed for arm muscle CSA at the adjusted alpha level; reliance on anthropometric estimates (circumference and skinfolds) rather than direct imaging.",
      evidenceTier: "very_high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "40366729",
      title:
        "From full to partials: Investigating the impact of range of motion training on maximum isometric action, and muscle hypertrophy in young women.",
      authors: [
        "Gustavo Ferreira Pedrosa",
        "Marina Gurgel Simões",
        "Mariano Rezende Pereira",
        "Brad Schoenfeld",
        "Marcel Bahia Lanza",
        "Fernando Vitor Lima",
        "Arthur Brum Gonçalvez Bischoff",
        "Mauro Heleno Chagas",
        "Rodrigo César Ribeiro Diniz",
      ],
      journal: "Journal of sports sciences",
      year: "2025",
      volume: "43",
      issue: "15",
      pagesOrElocation: "1440-1451",
      doi: "10.1080/02640414.2025.2502895",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/40366729/",
      pmcFullTextUrl: "",
      abstract:
        "We compared maximum voluntary isometric action (MVIA), electromyographic (EMG) amplitude, and hypertrophy of rectus femoris (RF) and vastus lateralis (VL) between groups training in different ranges of motion (ROM). Fifty untrained women were randomised into control group (CON) or to perform knee extension exercise in one of the following groups (0°=extended knee): Full ROM (FULLROM:100°-30°), Initial ROM (INITIALROM:100°-65°), Final ROM (FINALROM:65°-30°), and Varied ROM (VARROM: alternating between INITIALROM and FINALROM). Pre- and post-training assessments included MVIA at 30º, 65º and 100º of knee flexion, during which EMG amplitude of RF and VL was recorded. Summed changes in cross-sectional area, assessed via ultrasound, were measured at four locations along muscles. Results showed greater improvements in INITIALROM and VARROM for MVIA at 100º (20.63%-25.5%) and FINALROM and VARROM for MVIA at 30º (17.28%-17.97%) compared to other groups (-2.92%-9.83% and 0.84%-3.31%, respectively). EMG response was larger in INITIALROM than FINALROM and CON at 100º (15.84% vs -6.61%-1.16%). FINALROM had a higher EMG response than INITIALROM at 30º (4.52% vs -14.95%). For hypertrophy, INITIALROM, FULLROM, and VARROM showed greatest increases (13.20%-17%). Greater MVIA gains aligned with trained ROM, leading to better VARROM results. INITIALROM, FULLROM, and VARROM were more effective than FINALROM in hypertrophy.",
      publicationTypes: ["Journal Article", "Randomized Controlled Trial"],
      meshTerms: [
        "Humans",
        "Female",
        "Electromyography",
        "Range of Motion, Articular",
        "Young Adult",
        "Isometric Contraction",
        "Quadriceps Muscle",
        "Hypertrophy",
        "Adult",
        "Physical Conditioning, Human",
        "Ultrasonography",
        "Knee Joint",
        "Knee",
      ],
      keywords: [
        "Muscle length",
        "ROM",
        "full ROM",
        "muscle strength",
        "partial ROM",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "very_high",
      confidence: "high",
    },
    note: {
      entryNumber: 23,
      topic: "exercise_selection_hypertrophy_rom_muscle_length",
      suppliedUse: "ROM and hypertrophy.",
      studyDesignAndPopulation:
        "Randomized controlled trial in 50 untrained young women.",
      interventionAndComparator:
        "Knee extension exercise performed in four range-of-motion (ROM) groups—Full (100°-30°), Initial (100°-65°), Final (65°-30°), and Varied (alternating Initial and Final)—compared to a control group.",
      primaryOutcomes: "",
      directResults:
        "INITIAL ROM and VAR ROM improved MVIA at 100° by 20.63%–25.5%, while FINAL ROM and VAR ROM improved MVIA at 30° by 17.28%–17.97%; hypertrophy of the rectus femoris and vastus lateralis was significantly greater in INITIAL ROM, FULL ROM, and VAR ROM (13.20%–17.00%) compared to FINAL ROM.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Short-term intervention in untrained young women; outcomes limited to rectus femoris and vastus lateralis hypertrophy and isometric strength.",
      evidenceTier: "very_high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "42392615",
      title:
        "Moderate Intensity Resistance Training With Partial Range-of-Motion at Long Muscle Lengths Elicits Similar Hypertrophy and Architectural Adaptations as High Intensity Resistance Training Using Full Range-of-Motion.",
      authors: [
        "Gerard McMahon",
        "Christopher Morse",
        "Adrian Burden",
        "Keith Winwood",
        "Gladys Onambele-Pearson",
      ],
      journal: "Journal of strength and conditioning research",
      year: "2026",
      volume: "",
      issue: "",
      pagesOrElocation: "",
      doi: "10.1519/JSC.0000000000005561",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/42392615/",
      pmcFullTextUrl: "",
      abstract:
        "McMahon, G, Morse, C, Burden, A, Winwood, K, and Onambele-Pearson, G. Moderate intensity resistance training with partial range-of-motion at long muscle lengths elicits similar hypertrophy and architectural adaptations as high intensity resistance training using full range-of-motion. J Strength Cond Res XX(X): 000-000, 2026-Resistance training (RT) elicits varying magnitudes of active and passive forces in muscle. Evidence is lacking comparing chronic RT outcomes including muscle thickness (MTH) and muscle architecture (fascicle length [Lf], pennation angle [pen]) performing training at shorter, longer, and full ranges-of-motion (ROM). A total of 45 subjects were randomly assigned to 1 of 4 groups-shortened partial ROM (SP, 0-50° knee flexion, 80% 1 repetition maximum [1RM]), lengthened partial ROM (LP, 40-90° knee flexion, 55% 1RM), full ROM (FROM, 0-90° knee flexion, 80% 1RM), or control (CON)-completing 8 weeks of knee extensor exercise. Vastus Lateralis MTH, PEN, and Lf were measured at 25, 50, and 75% femur length pre-post training and analyzed as delta (Δ) change (%); statistical significance was set at p < 0.05. ΔMTH was greater in LP and FROM (p < 0.05) vs. SP at 75%. ΔMTH LP was greater than SP at 25% (p < 0.05) and ΔMTH FROM was greater than SP at 50% (p < 0.05) with no differences between LP and FROM at any location. ΔLf was greater in LP vs. FROM (p < 0.05) at 25 and 75%, and LP vs. SP (p < 0.05) at all sites. ΔLf was greater in FROM vs. SP (p < 0.05) at 50 and 75%. Absolute and normalized baseline Lf was inversely correlated with ΔLf in all groups (p < 0.001). This study provides novel evidence that moderate-intensity RT with partial ROM at long muscle lengths elicits similar hypertrophic and superior Lf adaptations as high-intensity full ROM training. These findings challenge traditional RT prescription, offering new insights for optimizing muscle size and architecture in athletic populations.",
      publicationTypes: ["Journal Article"],
      meshTerms: [],
      keywords: ["fascicle", "joint-angle", "mechanics", "sarcomeregenesis"],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "very_high",
      confidence: "high",
    },
    note: {
      entryNumber: 24,
      topic: "exercise_selection_hypertrophy_rom_muscle_length",
      suppliedUse: "load × ROM × muscle length interaction.",
      studyDesignAndPopulation:
        "8-week randomized controlled resistance-training intervention in 45 subjects.",
      interventionAndComparator:
        "Lengthened partial ROM (40-90° knee flexion, 55% 1RM) versus shortened partial ROM (0-50° knee flexion, 80% 1RM) and full ROM (0-90° knee flexion, 80% 1RM).",
      primaryOutcomes: "",
      directResults:
        "Lengthened partial ROM (LP) and full ROM (FROM) elicited similar muscle thickness increases, both exceeding shortened partial ROM (SP) at multiple sites; LP produced significantly greater fascicle length increases compared to FROM at 25% and 75% femur length and compared to SP at all measured sites.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Training status of the 45 subjects not specified in abstract; results limited to 8-week intervention on vastus lateralis architecture and thickness.",
      evidenceTier: "very_high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "39995432",
      title:
        "Resistance training beyond momentary failure: the effects of past-failure partials on muscle hypertrophy in the gastrocnemius.",
      authors: [
        "Stian Larsen",
        "Paul Alan Swinton",
        "Nordis Østerås Sandberg",
        "Benjamin Sandvik Kristiansen",
        "Andrea Bao Fredriksen",
        "Hallvard Nygaard Falch",
        "Roland van den Tillaar",
        "Milo Wolf",
      ],
      journal: "Frontiers in psychology",
      year: "2025",
      volume: "16",
      issue: "",
      pagesOrElocation: "1494323",
      doi: "10.3389/fpsyg.2025.1494323",
      pmcid: "PMC11847862",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/39995432/",
      pmcFullTextUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11847862/",
      abstract:
        "Muscle hypertrophy is often a desired goal of resistance training, and strategies that extend training beyond momentary failure may enhance muscular adaptations. Thus, the objective of this study was to assess whether performing additional past-failure partial repetitions beyond momentary failure increased muscle hypertrophy. A total of 23 untrained men completed a 10-week within-participant intervention study. This study comprised two weekly resistance training sessions of four sets of standing Smith machine calf raises. One limb was randomly allocated to the control condition performing sets to momentary failure (PLANTARMF), and the other limb was allocated to the test intervention that included additional past-failure partial repetitions in the lengthened position (DORSIvf). Muscle thickness of the medial gastrocnemius muscle was measured both pre- and post-intervention via ultrasound. Data were analysed within a Bayesian framework using a mixed-effect model with random effects to account for the within-participant design. The average treatment effect (ATE) was measured to assess any difference in condition and inferences made based on the ATE posterior distribution and associated Bayes Factor (BF). The main findings were that the PLANTARMF and DORSIVF legs increased medial gastrocnemius hypertrophy by 6.7 and +9.6%, respectively. The results identified an ATE favouring the inclusion of additional partial repetitions (0.62 [95%CrI: 0.21-1.0 mm; p(>0) = 0.998]) with 'strong' evidence (BF = 13.3) supporting a priori hypothesis. Therefore, when the goal is to train for maximum gastrocnemius hypertrophy over a relatively short time period, we suggest performing sets beyond momentary failure as a likely superior option.",
      publicationTypes: ["Journal Article"],
      meshTerms: [],
      keywords: [
        "calf raises",
        "medial gastrocnemius",
        "muscle thickness",
        "proximity-to-failure",
        "ultrasound",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "FULL_TEXT_VERIFIED",
      evidenceTier: "very_high",
      confidence: "high",
    },
    note: {
      entryNumber: 25,
      topic: "exercise_selection_hypertrophy_rom_muscle_length",
      suppliedUse: "lengthened partials after failure.",
      studyDesignAndPopulation:
        "Within-participant repeated-measures design involving 23 healthy, untrained adult men (ages 18–50).",
      interventionAndComparator:
        "Unilateral standing Smith machine calf raises performed to volitional failure in peak dorsiflexion (DORSIVF: past-failure partials) compared to momentary failure in peak plantarflexion (PLANTARMF).",
      primaryOutcomes:
        "Medial gastrocnemius muscle thickness measured via b-mode ultrasonography.",
      directResults:
        "DORSIVF (past-failure partials) resulted in significantly greater medial gastrocnemius hypertrophy compared to PLANTARMF (momentary failure) over 10 weeks (9.6% vs. 6.7% increase; ATE: 0.62 mm [95%CrI: 0.21–1.0 mm]; BF = 13.3). The DORSIVF condition allowed for an 87.2% higher volume load by continuing sets with partial repetitions in the lengthened position after full range-of-motion failure was reached. Approximately 52.2% of participants preferred the DORSIVF protocol despite increased discomfort, given the observed relative growth benefit of 43.3% over the standard protocol.",
      implementationImplication:
        "To maximize gastrocnemius hypertrophy, trainees should continue sets with partial repetitions in the stretched (dorsiflexed) position after reaching full range-of-motion failure.",
      limitations:
        "Study population was limited to untrained men, lacked a non-training control group, and results may be specific to the gastrocnemius length-tension relationship.",
      evidenceTier: "very_high",
      reviewStatus: "FULL_TEXT_VERIFIED",
      confidence: "high",
      noteSource: "PMC full-text sections retrieved through NCBI EFetch",
    },
  },
  {
    study: {
      pmid: "33780488",
      title:
        "A comprehensive biomechanical analysis of the barbell hip thrust.",
      authors: [
        "Adam Brazil",
        "Laurie Needham",
        "Jac L Palmer",
        "Ian N Bezodis",
      ],
      journal: "PloS one",
      year: "2021",
      volume: "16",
      issue: "3",
      pagesOrElocation: "e0249307",
      doi: "10.1371/journal.pone.0249307",
      pmcid: "PMC8006986",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/33780488/",
      pmcFullTextUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8006986/",
      abstract:
        "Barbell hip thrust exercises have risen in popularity within the biomechanics and strength and conditioning literature over recent years, as a method of developing the hip extensor musculature. Biomechanical analysis of the hip thrust beyond electromyography is yet to be conducted. The aim of this study was therefore to perform the first comprehensive biomechanical analysis the barbell hip thrust. Nineteen resistance trained males performed three repetitions of the barbell hip thrust at 70% one-repetition maximum. Kinematic (250 Hz) and kinetic (1000 Hz) data were used to calculate angle, angular velocity, moment and power data at the ankle, knee, hip and pelvic-trunk joint during the lifting phase. Results highlighted that the hip thrust elicits significantly (p < 0.05) greater bilateral extensor demand at the hip joint in comparison with the knee and pelvic-trunk joints, whilst ankle joint kinetics were found to be negligible. Against contemporary belief, hip extensor moments were not found to be consistent throughout the repetition and instead diminished throughout the lifting phase. The current study provides unique insight to joint kinematics and kinetics of the barbell hip thrust, based on a novel approach, that offers a robust evidence base for practitioners to guide exercise selection.",
      publicationTypes: ["Journal Article"],
      meshTerms: [
        "Humans",
        "Male",
        "Biomechanical Phenomena",
        "Hip Joint",
        "Adult",
        "Young Adult",
        "Resistance Training",
        "Knee Joint",
        "Ankle Joint",
        "Muscle, Skeletal",
        "Hip",
        "Electromyography",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "FULL_TEXT_VERIFIED",
      evidenceTier: "high",
      confidence: "high",
    },
    note: {
      entryNumber: 26,
      topic: "lower_body_biomechanics",
      suppliedUse: "hip-thrust kinetics and mechanics.",
      studyDesignAndPopulation:
        "Biomechanical analysis of 19 resistance-trained males (22.4 ± 3.1 years, 1RM 189 ± 42 kg) performing the barbell hip thrust.",
      interventionAndComparator:
        "Participants performed three repetitions of the barbell hip thrust at 70% of 1RM using habitual technique while monitored by motion capture and force plates.",
      primaryOutcomes:
        "The study measured external resultant forces at the feet and thorax, along with joint-level kinematics and kinetics at the ankle, knee, hip, and pelvic-trunk.",
      directResults:
        "Peak resultant forces were significantly greater at the feet (2.16 ± 0.52 BW) than at the thorax (1.69 ± 0.42 BW). The bilateral hip joint sustained the highest extensor demand, with a peak moment of 6.97 ± 1.13 N m/kg and total work of 6.47 ± 1.76 J/kg, significantly exceeding the knee (2.65 ± 0.71 N m/kg; 0.85 ± 0.36 J/kg) and pelvic-trunk (4.39 ± 1.53 N m/kg; 0.74 ± 0.59 J/kg) joints. Hip extensor torque was not constant, peaking early in the lift (14.3 ± 3.1% of duration) at 83 ± 16° flexion and declining by approximately two-thirds as the hip reached full extension. The pelvic-trunk joint primarily functioned to resist flexion through a small range of motion (12 ± 21°), while ankle joint kinetics were negligible.",
      implementationImplication:
        "Incorporate the barbell hip thrust to prioritize hip extensor loading, noting that peak torque occurs in the flexed position and diminishes as the hip approaches full extension.",
      limitations:
        "Findings are restricted to resistance-trained males at 70% 1RM and do not account for muscle-specific contributions via EMG or direct comparison to other movements.",
      evidenceTier: "high",
      reviewStatus: "FULL_TEXT_VERIFIED",
      confidence: "high",
      noteSource: "PMC full-text sections retrieved through NCBI EFetch",
    },
  },
  {
    study: {
      pmid: "22797000",
      title:
        "Effect of squat depth and barbell load on relative muscular effort in squatting.",
      authors: [
        "Megan A Bryanton",
        "Michael D Kennedy",
        "Jason P Carey",
        "Loren Z F Chiu",
      ],
      journal: "Journal of strength and conditioning research",
      year: "2012",
      volume: "26",
      issue: "10",
      pagesOrElocation: "2820-8",
      doi: "10.1519/JSC.0b013e31826791a7",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/22797000/",
      pmcFullTextUrl: "",
      abstract:
        "Resistance training is used to develop muscular strength and hypertrophy. Large muscle forces, in relation to the muscle's maximum force-generating ability, are required to elicit these adaptations. Previous biomechanical analyses of multi-joint resistance exercises provide estimates of muscle force but not relative muscular effort (RME). The purpose of this investigation was to determine the RME during the squat exercise. Specifically, the effects of barbell load and squat depth on hip extensor, knee extensor, and ankle plantar flexor RME were examined. Ten strength-trained women performed squats (50-90% 1 repetition maximum) in a motion analysis laboratory to determine hip extensor, knee extensor, and ankle plantar flexor net joint moment (NJM). Maximum isometric strength in relation to joint angle for these muscle groups was also determined. Relative muscular effect was determined as the ratio of NJM to maximum voluntary torque matched for joint angle. Barbell load and squat depth had significant interaction effects on hip extensor, knee extensor, and ankle plantar flexor RME (p < 0.05). Knee extensor RME increased with greater squat depth but not barbell load, whereas the opposite was found for the ankle plantar flexors. Both greater squat depth and barbell load increased hip extensor RME. These data suggest that training for the knee extensors can be performed with low relative intensities but require a deep squat depth. Heavier barbell loads are required to train the hip extensors and ankle plantar flexors. In designing resistance training programs with multi-joint exercises, how external factors influence RME of different muscle groups should be considered to meet training objectives.",
      publicationTypes: ["Journal Article", "Research Support, Non-U.S. Gov't"],
      meshTerms: [
        "Adult",
        "Ankle",
        "Female",
        "Hip",
        "Humans",
        "Isometric Contraction",
        "Knee",
        "Muscle Strength",
        "Muscle, Skeletal",
        "Posture",
        "Weight Lifting",
        "Young Adult",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "high",
      confidence: "high",
    },
    note: {
      entryNumber: 27,
      topic: "lower_body_biomechanics",
      suppliedUse: "squat depth × external load × muscular effort.",
      studyDesignAndPopulation:
        "Biomechanical motion-analysis study in 10 strength-trained women.",
      interventionAndComparator:
        "Back squats performed at varying depths and barbell loads (50%, 60%, 70%, 80%, and 90% of 1-repetition maximum).",
      primaryOutcomes: "",
      directResults:
        "Knee extensor relative muscular effort (RME) increased significantly with squat depth but remained near-maximal regardless of barbell load; hip extensor RME increased with both greater squat depth and heavier barbell load; ankle plantar flexor RME increased with barbell load but not depth.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Small sample size of trained women only; RME is an estimate derived from net joint moments and isometric strength curves rather than direct intramuscular force measurement.",
      evidenceTier: "high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "25895990",
      title:
        "Quadriceps effort during squat exercise depends on hip extensor muscle strategy.",
      authors: [
        "Megan A Bryanton",
        "Jason P Carey",
        "Michael D Kennedy",
        "Loren Z F Chiu",
      ],
      journal: "Sports biomechanics",
      year: "2015",
      volume: "14",
      issue: "1",
      pagesOrElocation: "122-38",
      doi: "10.1080/14763141.2015.1024716",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/25895990/",
      pmcFullTextUrl: "",
      abstract:
        "Hip extensor strategy, specifically relative contribution of gluteus maximus versus hamstrings, will influence quadriceps effort required during squat exercise, as hamstrings and quadriceps co-contract at the knee. This research examined the effects of hip extensor strategy on quadriceps relative muscular effort (RME) during barbell squat. Inverse dynamics-based torque-driven musculoskeletal models were developed to account for hamstrings co-contraction. Net joint moments were calculated using 3D motion analysis and force platform data. Hamstrings co-contraction was modelled under two assumptions: (1) equivalent gluteus maximus and hamstrings activation (Model 1) and (2) preferential gluteus maximus activation (Model 2). Quadriceps RME, the ratio of quadriceps moment to maximum knee extensor strength, was determined using inverse dynamics only, Model 1 and Model 2. Quadriceps RME was greater in both Models 1 and 2 than inverse dynamics only at barbell loads of 50-90% one repetition maximum. The highest quadriceps RMEs were 120 ± 36% and 87 ± 28% in Models 1 and 2, respectively, which suggests that barbell squats are only feasible using the Model 2 strategy prioritising gluteus maximus versus hamstrings activation. These results indicate that developing strength in both gluteus maximus and quadriceps is essential for lifting heavy loads in squat exercise.",
      publicationTypes: ["Journal Article", "Research Support, Non-U.S. Gov't"],
      meshTerms: [
        "Adult",
        "Biomechanical Phenomena",
        "Exercise",
        "Female",
        "Hip Joint",
        "Humans",
        "Muscle Contraction",
        "Muscle, Skeletal",
        "Quadriceps Muscle",
        "Weight Lifting",
        "Young Adult",
      ],
      keywords: [
        "Knee",
        "co-contraction",
        "gluteus maximus",
        "hamstrings",
        "musculoskeletal modelling",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "moderate_high",
      confidence: "high",
    },
    note: {
      entryNumber: 28,
      topic: "lower_body_biomechanics",
      suppliedUse: "load sharing between knee and hip extensors.",
      studyDesignAndPopulation:
        "Musculoskeletal modeling study involving 10 trained women with at least one year of back squat experience.",
      interventionAndComparator:
        "Barbell back squats at 50-90% 1RM comparing three methods of estimating quadriceps relative muscular effort: net joint moment only, equal hamstrings/gluteus activation (Model 1), and preferential gluteus activation (Model 2).",
      primaryOutcomes: "",
      directResults:
        "Accounting for hamstrings co-contraction significantly increased estimated quadriceps relative muscular effort (RME) compared to net joint moment alone; Model 1 and Model 2 yielded peak RMEs of 120 ± 36% and 87 ± 28% respectively, suggesting heavy squats are only feasible when prioritizing gluteus maximus activation to minimize antagonistic hamstrings moments.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Biomechanical modeling study using assumed activation strategies rather than direct force measurements; small sample size limited to trained females.",
      evidenceTier: "moderate_high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "32569122",
      title:
        "Muscle Forces During the Squat, Split Squat, and Step-Up Across a Range of External Loads in College-Aged Men.",
      authors: ["Kristof Kipp", "Hoon Kim", "William I Wolf"],
      journal: "Journal of strength and conditioning research",
      year: "2022",
      volume: "36",
      issue: "2",
      pagesOrElocation: "314-323",
      doi: "10.1519/JSC.0000000000003688",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/32569122/",
      pmcFullTextUrl: "",
      abstract:
        "Kipp, K, Kim, H, and Wolf, WI. Muscle forces during the squat, split squat, and step-up across a range of external loads in college-aged men. J Strength Cond Res 36(2): 314-323, 2022-Knowledge about the load-dependent demand placed on muscles during resistance training exercises is important for injury prevention and sports performance training programs. The purpose of this study was to investigate the effect of external load on lower extremity muscle forces during 3 common resistance training exercises. Nine healthy subjects performed 4 sets of the squat (SQ), split squat (SS), and step-up (SU) exercises each with 0, 25, 50, and 75% of body mass as additional load. Motion capture and force plate data were used to estimate individual muscle forces of 11 lower extremity muscles through static optimization. The results suggest load-dependent increases in muscle forces for the m. gluteus maximus, m. gluteus medius, vastus lateralis, m. vastus medius, m. vastus intermedius, m. semitendinosus, m. semimembranosus, m. biceps femoris long head, m. soleus, m. gastrocnemius lateralis, and m. gastrocnemius medialis during the execution of all 3 exercises. In addition, load-dependent increases in m. gluteus maximus, vastus lateralis, m. vastus medius, m. vastus intermedius, and m. biceps femoris long head forces were often more pronounced during the SS and SU than the SQ across the range of loads used in this study. These results suggest that the mechanical demands imposed by resistance training exercises scale with external load and that the extent of that scaling depends on the specific exercise.",
      publicationTypes: ["Journal Article"],
      meshTerms: [
        "Buttocks",
        "Electromyography",
        "Hamstring Muscles",
        "Humans",
        "Muscle, Skeletal",
        "Quadriceps Muscle",
        "Resistance Training",
        "Young Adult",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "moderate_high",
      confidence: "high",
    },
    note: {
      entryNumber: 29,
      topic: "lower_body_biomechanics",
      suppliedUse: "exercise-specific modeled muscle forces.",
      studyDesignAndPopulation:
        "Within-subject repeated measures biomechanical study in 9 healthy college-aged men.",
      interventionAndComparator:
        "Squat, split squat, and step-up performed with 0%, 25%, 50%, and 75% body mass additional load.",
      primaryOutcomes: "",
      directResults:
        "Muscle forces for 11 lower-extremity muscles increased with load across all exercises; split squat and step-up elicited significantly greater load-dependent force increases in the gluteus maximus, vasti, and biceps femoris long head compared to the bilateral squat.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Small sample size in college-aged men and reliance on static optimization modeling rather than direct force measurement.",
      evidenceTier: "moderate_high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "34633906",
      title:
        "Musculoskeletal modelling based estimates of load dependent relative muscular effort during resistance training exercises.",
      authors: ["William I Wolf", "Hoon Kim", "Kristof Kipp"],
      journal: "Sports biomechanics",
      year: "2024",
      volume: "23",
      issue: "10",
      pagesOrElocation: "1772-1782",
      doi: "10.1080/14763141.2021.1983636",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/34633906/",
      pmcFullTextUrl: "",
      abstract:
        "The purpose of this study was to investigate the relative muscular effort (RME) of the hip and knee extensor and ankle plantarflexor muscle groups during the back squat (BS) and split squat (SS) exercises across four external load conditions. Motion capture and force plate data were collected as participants performed the BS and SS at 0%, 25%, 50%, and 75% of their body-mass. These data were used to calculate net joint moments (NJM) at the hip, knee, and ankle of the front leg during the SS and the matched leg during the BS. A musculoskeletal model, which accounted for force-length-velocity properties of 52 muscles, was used to estimate the maximal possible NJM (NJMmax) of the hip and knee extensor and ankle plantarflexor muscle groups. RME was calculated as the ratio between NJM and NJMmax, and compared across exercises and loads. The results indicated that while hip extensor RME increased across all loads, the increases in hip extensor RME were disproportionately greater during the SS at loads of 50% and 75%. Knee extensor RME increased linearly across loads and did not differ between exercises. These results provide coaches and athletes with detailed information about how to optimise resistance training specificity.",
      publicationTypes: ["Journal Article"],
      meshTerms: [
        "Humans",
        "Resistance Training",
        "Muscle, Skeletal",
        "Biomechanical Phenomena",
        "Young Adult",
        "Male",
        "Hip",
        "Knee",
        "Ankle",
        "Time and Motion Studies",
        "Models, Biological",
        "Adult",
        "Female",
      ],
      keywords: ["Biomechanics", "capacity", "squat", "strength"],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "moderate_high",
      confidence: "high",
    },
    note: {
      entryNumber: 30,
      topic: "lower_body_biomechanics",
      suppliedUse: "musculoskeletal modeling of exercise loading.",
      studyDesignAndPopulation:
        "Cross-sectional biomechanical study using motion capture and musculoskeletal modeling in human participants.",
      interventionAndComparator:
        "Back squat versus split squat at loads of 0%, 25%, 50%, and 75% of body-mass.",
      primaryOutcomes: "",
      directResults:
        "Hip extensor relative muscular effort (RME) increased across all loads with disproportionately greater increases in the split squat at 50% and 75% body-mass; knee extensor RME increased linearly with load and showed no significant difference between exercises.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Use of modeling to estimate effort rather than direct measurement; abstract does not specify participant training status or sample size; short-term biomechanical comparison not longitudinal.",
      evidenceTier: "moderate_high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "30335723",
      title: "Hip and Knee Kinetics During a Back Squat and Deadlift.",
      authors: [
        "Kevin H Choe",
        "Jared W Coburn",
        "Pablo B Costa",
        "Derek N Pamukoff",
      ],
      journal: "Journal of strength and conditioning research",
      year: "2021",
      volume: "35",
      issue: "5",
      pagesOrElocation: "1364-1371",
      doi: "10.1519/JSC.0000000000002908",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/30335723/",
      pmcFullTextUrl: "",
      abstract:
        "Choe, KH, Coburn, JW, Costa, PB, and Pamukoff, DN. Hip and knee kinetics during a back-squat and deadlift. J Strength Cond Res 35(5): 1364-1371, 2021-The back-squat and deadlift are performed to improve hip and knee extensor function. The purpose of this study was to compare lower extremity joint kinetics (peak net joint moments [NJMs] and positive joint work [PJW]) between the back-squat and deadlift. Twenty-eight resistance-trained subjects (17 men: 23.7 ± 4.3 years, 1.76 ± 0.09 m, 78.11 ± 10.91 kg; 11 women: 23.0 ± 1.9 years, 1.66 ± 0.06 m, 65.36 ± 7.84 kg) were recruited. One repetition maximum (1RM) testing and biomechanical analyses occurred on separate days. Three-dimensional biomechanics of the back-squat and deadlift were recorded at 70 and 85% 1RM for each exercise. The deadlift demonstrated larger hip extensor NJM than the back-squat {3.59 (95% confidence interval [CI]: 3.30-3.88) vs. 2.98 (95% CI: 2.72-3.23) Nm·kg-1, d = 0.81, p < 0.001}. However, the back-squat had a larger knee extensor NJM compared with the deadlift (2.14 [95% CI: 1.88-2.40] vs. 1.18 [95% CI: 0.99-1.37] Nm·kg-1, d = 1.44 p < 0.001). More knee PJW was performed during the back-squat compared with the deadlift (1.85 [95% CI: 1.60-2.09] vs. 0.46 [95% CI: 0.35-0.58] J·kg-1, d = 2.10, p < 0.001). However, there was more hip PJW during the deadlift compared with the back-squat (3.22 [95% CI: 2.97-3.47] vs. 2.37 [95% CI: 2.21-2.54] J·kg-1, d = 1.30, p < 0.001). Larger hip extensor NJM and PJW during the deadlift suggest that individuals targeting their hip extensors may yield greater benefit from the deadlift compared with the back-squat. However, larger knee extensor NJM and PJW during the back-squat suggest that individuals targeting their knee extensor muscles may benefit from incorporating the back-squat compared with the deadlift.",
      publicationTypes: ["Journal Article"],
      meshTerms: [
        "Biomechanical Phenomena",
        "Female",
        "Humans",
        "Kinetics",
        "Knee",
        "Knee Joint",
        "Male",
        "Posture",
        "Weight Lifting",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "high",
      confidence: "high",
    },
    note: {
      entryNumber: 31,
      topic: "lower_body_biomechanics",
      suppliedUse: "hip vs knee demands of squat and deadlift.",
      studyDesignAndPopulation:
        "Biomechanical analysis (3D kinetics) of 28 resistance-trained subjects (17 men, 11 women).",
      interventionAndComparator:
        "Back squat versus deadlift performed at 70% and 85% 1RM.",
      primaryOutcomes: "",
      directResults:
        "Deadlift showed significantly greater hip extensor net joint moments (3.59 vs 2.98 Nm/kg) and positive joint work (3.22 vs 2.37 J/kg) than back squat; back squat showed significantly greater knee extensor net joint moments (2.14 vs 1.18 Nm/kg) and positive joint work (1.85 vs 0.46 J/kg) than deadlift.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Acute biomechanical analysis in resistance-trained adults; not a longitudinal study of hypertrophy or sport-transfer performance.",
      evidenceTier: "high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "36542838",
      title:
        "Greater Hip Moments in Rear-Foot-Elevated Split Squats Than in Conventional Back Squats With the Same Relative Intensity of Loads.",
      authors: ["Hiroshi Arakawa", "Miyuki Mori", "Michiya Tanimoto"],
      journal: "Journal of strength and conditioning research",
      year: "2023",
      volume: "37",
      issue: "5",
      pagesOrElocation: "1009-1016",
      doi: "10.1519/JSC.0000000000004351",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/36542838/",
      pmcFullTextUrl: "",
      abstract:
        "Arakawa, H, Mori, M, and Tanimoto, M. Greater hip moments in rear-foot-elevated split squats than in conventional back squats with the same relative intensity of loads. J Strength Cond Res 37(5): 1009-1016, 2023-Rear-foot-elevated split squat (RFESS) is often performed as an alternative to conventional double-leg back squat (DLBS). This study aimed to compare 3-dimensional joint kinetics of DLBS and RFESS using the same relative intensity of loads. Eight male college rugby players performed 3 repetitions of DLBS and RFESS at 10-repetition-maximum (RM) loading. Before testing, both exercises were incorporated into the subjects' training program with a progressive increase in loads for 4 months. A 3-dimensional optical motion capture system and force platform were used for data collection. The 3-dimensional moments at the knee and hip joints in each of the 3 axes were calculated based on the inverse dynamic procedure. p values < 0.05 were considered statistically significant. The hip extension moment was 44% greater in the RFESS than in the DLBS at the bottom position ( p < 0.01) and 47% greater for the peak value ( p < 0.01) on harmonic averages. The hip abduction and external rotation moments at the bottom position were also greater in the RFESS than in the DLBS. The findings suggest that the magnitude of hip extension moment per leg in DLBS tends to be restricted to less than that expected from the given strength level. In conclusion, the mechanical contribution of hip extensors per leg can be greater in RFESS than in DLBS when using respective 10RM loads, even if the absolute load is smaller and the trunk is more upright in RFESS.",
      publicationTypes: ["Journal Article"],
      meshTerms: [
        "Humans",
        "Male",
        "Posture",
        "Lower Extremity",
        "Knee",
        "Knee Joint",
        "Leg",
        "Biomechanical Phenomena",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "high",
      confidence: "high",
    },
    note: {
      entryNumber: 32,
      topic: "lower_body_biomechanics",
      suppliedUse: "RFESS/Bulgarian split squat mechanics.",
      studyDesignAndPopulation:
        "Within-subject biomechanical comparison in 8 male college rugby players with 4 months of pre-testing training.",
      interventionAndComparator:
        "Rear-foot-elevated split squat versus conventional double-leg back squat at 10-repetition-maximum loads.",
      primaryOutcomes: "",
      directResults:
        "Hip extension moment was 44% greater at the bottom position and 47% greater at peak in the rear-foot-elevated split squat compared to the double-leg back squat; hip abduction and external rotation moments were also significantly higher in the split squat.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Small sample of trained male athletes; biomechanical kinetic data only without longitudinal hypertrophy or sport-transfer outcomes.",
      evidenceTier: "high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "37556813",
      title:
        "Individual Muscle Contributions to the Acceleration of the Center of Mass During the Barbell Back Squat in Trained Female Subjects.",
      authors: ["William W Goodman", "Eric Helms", "David F Graham"],
      journal: "Journal of strength and conditioning research",
      year: "2023",
      volume: "37",
      issue: "10",
      pagesOrElocation: "1947-1954",
      doi: "10.1519/JSC.0000000000004506",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/37556813/",
      pmcFullTextUrl: "",
      abstract:
        "Goodman, WW, Helms, E, and Graham, DF. Individual muscle contributions to the acceleration of the center of mass during the barbell back squat in trained female subjects. J Strength Cond Res 37(10): 1947-1954, 2023-The squat is used to enhance performance and rehabilitate the lower body. However, muscle forces and how muscles accelerate the center of mass (CoM) are not well understood. The purpose was to determine how lower extremity muscles contribute to the vertical acceleration of the CoM when squatting to parallel using 85% one-repetition maximum. Thirteen female subjects performed squats in a randomized fashion. Musculoskeletal modeling was used to obtain muscle forces and muscle-induced accelerations. The vasti, soleus, and gluteus maximus generated the largest upward accelerations of the CoM, whereas the muscles that produced the largest downward acceleration about the CoM were the hamstrings, iliopsoas, adductors, and tibialis anterior. Our findings indicate that a muscle's function is task and posture specific. That is, muscle function depends on both joint position and how an individual is interacting with the environment.",
      publicationTypes: ["Journal Article"],
      meshTerms: [
        "Humans",
        "Female",
        "Muscle, Skeletal",
        "Posture",
        "Hip",
        "Acceleration",
        "Buttocks",
        "Biomechanical Phenomena",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "moderate_high",
      confidence: "high",
    },
    note: {
      entryNumber: 33,
      topic: "lower_body_biomechanics",
      suppliedUse: "muscle contribution to squat propulsion.",
      studyDesignAndPopulation:
        "Cross-sectional biomechanical study using musculoskeletal modeling in 13 trained female subjects performing squats to parallel.",
      interventionAndComparator:
        "Barbell back squat to parallel at 85% one-repetition maximum (1RM).",
      primaryOutcomes: "",
      directResults:
        "The vasti, soleus, and gluteus maximus generated the largest upward accelerations of the center of mass (CoM); the hamstrings, iliopsoas, adductors, and tibialis anterior produced the largest downward acceleration about the CoM; muscle function was found to be task and posture specific.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Musculoskeletal modeling estimates rather than direct measurement; findings are task and posture specific; results in trained females may not generalize to other populations or squat variations.",
      evidenceTier: "moderate_high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "38416444",
      title:
        '"Knees Out" or "Knees In"? Volitional Lateral vs. Medial Hip Rotation During Barbell Squats.',
      authors: ["Loren Z F Chiu"],
      journal: "Journal of strength and conditioning research",
      year: "2024",
      volume: "38",
      issue: "3",
      pagesOrElocation: "435-443",
      doi: "10.1519/JSC.0000000000004655",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/38416444/",
      pmcFullTextUrl: "",
      abstract:
        'Chiu, LZF. "Knees out" or "Knees in"? Volitional lateral versus medial hip rotation during barbell squats. J Strength Cond Res 38(3): 435-443, 2024-Medial or lateral hip rotation may be present during barbell squats, which could affect the hip frontal and transverse plane moments. Male (n = 14) and female (n = 18) subjects performed squats using their normal technique and with volitional medial and lateral hip rotation. Hip net joint moments (NJM) were calculated from 3-dimensional motion capture and force platform measurements. Statistical significance was set for omnibus tests (α = 0.05) and Bonferroni\'s corrected for pairwise comparisons (αt-test = 0.0056). Normal squats required hip extensor, adductor, and lateral rotator NJM. Lateral rotation squats had smaller hip extensor (p = 0.002) and lateral rotator (p < 0.001) NJM and larger hip adductor (p < 0.001) NJM than normal squats. Medial rotation squats had smaller hip extensor (p = 0.002) and adductor (p < 0.001) NJM and larger hip lateral rotator (p < 0.001) NJM than normal squats. These differences exceeded the minimum effects worth detecting. As gluteus maximus exerts hip extensor and lateral rotator moments, and the adductor magnus exerts hip extensor and adductor moments, these muscles combined would be required to meet these hip demands, supporting previous research that has established these muscles as the primary contributors to the hip extensor NJM. Lateral rotation squats reduce hip lateral rotator and increase hip adductor NJM, which may be hypothesized as preferentially loading adductor magnus. Medial rotation squats increase hip lateral rotator and decrease hip adductor NJM; therefore, this variant may shift loading to the gluteus maximus.',
      publicationTypes: ["Journal Article"],
      meshTerms: [
        "Humans",
        "Female",
        "Male",
        "Hip Joint",
        "Posture",
        "Rotation",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "high",
      confidence: "high",
    },
    note: {
      entryNumber: 34,
      topic: "lower_body_biomechanics",
      suppliedUse: "adductor, hip-rotator and squat mechanics.",
      studyDesignAndPopulation:
        "Cross-sectional biomechanical study in 32 healthy adults (14 males, 18 females).",
      interventionAndComparator:
        "Normal barbell squats versus squats with volitional medial and lateral hip rotation.",
      primaryOutcomes: "",
      directResults:
        "Lateral rotation squats reduced hip extensor (p=0.002) and lateral rotator (p<0.001) net joint moments (NJM) while increasing adductor NJM (p<0.001); medial rotation squats reduced hip extensor (p=0.002) and adductor (p<0.001) NJM while increasing lateral rotator NJM (p<0.001).",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Acute biomechanical study in a single session; does not provide direct evidence for muscle hypertrophy or long-term sport transfer.",
      evidenceTier: "high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "40705768",
      title:
        "Biomechanical analysis of hip, knee, and ankle joint contact forces during squats in elite powerlifters.",
      authors: [
        "Alexander Pürzel",
        "Paul Kaufmann",
        "Willi Koller",
        "Elias Kaj Wallnöfer",
        "Arnold Baca",
        "Hans Kainz",
      ],
      journal: "PloS one",
      year: "2025",
      volume: "20",
      issue: "7",
      pagesOrElocation: "e0327973",
      doi: "10.1371/journal.pone.0327973",
      pmcid: "PMC12289039",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/40705768/",
      pmcFullTextUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12289039/",
      abstract:
        "The squat is one of three lifts within the sport of powerlifting. This study examined how increasing intensity in the squat affects joint contact forces in elite powerlifters. Twenty-nine Austrian top-ranked powerlifters (16 male, 13 female) performed squats at 70% to 90% of their one-repetition maximum (1-RM). 3D motion capture and force plate data were used to estimate joint contact forces using musculoskeletal modelling. In contrast to the hip and ankle joints, which exhibited peak resultant joint contact forces in the deepest squat positions, the tibiofemoral and patellofemoral joints maintained consistently high loads over a broad portion of the squat cycle. During large parts of the concentric phase, the resultant joint contact forces did not significantly differ between intensity conditions, with the exception of the hip joint contact force. At 90% 1-RM, average peak joint contact forces reached 15.5 ± 3.0 times body weight (BW), 23.2 ± 3.9 BW, 26.7 ± 4.3 BW, and 11.5 ± 2.2 BW for the hip, tibiofemoral, patellofemoral, and ankle joint, respectively. The high and sustained joint contact forces observed in our study emphasise the need for load management strategies to optimise performance and reduce injury risk. These insights offer a valuable foundation for tailoring strength training programs and supporting long-term joint health in high-performance athletes.",
      publicationTypes: ["Journal Article"],
      meshTerms: [
        "Humans",
        "Male",
        "Female",
        "Biomechanical Phenomena",
        "Knee Joint",
        "Ankle Joint",
        "Hip Joint",
        "Adult",
        "Weight Lifting",
        "Young Adult",
        "Athletes",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "FULL_TEXT_VERIFIED",
      evidenceTier: "moderate_high",
      confidence: "high",
    },
    note: {
      entryNumber: 35,
      topic: "lower_body_biomechanics",
      suppliedUse: "high-bar vs low-bar squat.",
      studyDesignAndPopulation:
        "Cross-sectional biomechanical analysis using 3D motion capture and musculoskeletal modeling in 29 elite powerlifters (13 female, 16 male; 8.4 ± 4.1 years training; relative squat 2.4 ± 0.4 x body mass).",
      interventionAndComparator:
        "Single-repetition squats performed at 70%, 75%, 80%, 85%, and 90% of 1-repetition maximum (1-RM) compared across intensities and between eccentric and concentric phases.",
      primaryOutcomes:
        "Peak resultant and directional joint contact forces for the hip, tibiofemoral, patellofemoral, and ankle joints.",
      directResults:
        "Peak resultant joint contact forces at 90% 1-RM reached 15.5 ± 3.0 BW (hip), 23.2 ± 3.9 BW (tibiofemoral), 26.7 ± 4.3 BW (patellofemoral), and 11.5 ± 2.2 BW (ankle). Joint contact forces significantly increased with intensity in all joints and most anatomical directions (p < 0.001). Peak hip, tibiofemoral, and ankle forces were significantly higher in the concentric phase than the eccentric phase (p < 0.05), while patellofemoral forces showed no significant difference between phases (p = 0.279). Notably, tibiofemoral, patellofemoral, and ankle contact forces showed no significant differences between intensity conditions during substantial parts of the concentric phase.",
      implementationImplication:
        "Elite powerlifters encounter extreme joint contact forces exceeding 20x body mass during high-intensity squats, requiring structured periodization and deloading to balance joint preservation with performance stimulus.",
      limitations:
        "Use of a musculoskeletal model with potential overestimation in deep flexion, single repetition per intensity, and a scaling factor derived from a subset (n=6) MRI data.",
      evidenceTier: "moderate_high",
      reviewStatus: "FULL_TEXT_VERIFIED",
      confidence: "high",
      noteSource: "PMC full-text sections retrieved through NCBI EFetch",
    },
  },
  {
    study: {
      pmid: "32874102",
      title:
        "How Are Squat Timing and Kinematics in The Sagittal Plane Related to Squat Depth?",
      authors: [
        "Magdalena Zawadka",
        "Jakub Smolka",
        "Maria Skublewska-Paszkowska",
        "Edyta Lukasik",
        "Piotr Gawda",
      ],
      journal: "Journal of sports science & medicine",
      year: "2020",
      volume: "19",
      issue: "3",
      pagesOrElocation: "500-507",
      doi: "",
      pmcid: "PMC7429430",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/32874102/",
      pmcFullTextUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7429430/",
      abstract:
        "The aim of this study was to analyze the relationship of range of motion (ROM) in the sagittal plane and timing parameters during a bodyweight squat to the depth of the squat. Sixty participants (20 females and 40 males) took part in this study. They were instructed to perform a bodyweight squat to the maximal depth position. Kinematic data were obtained using the optical motion capture system. The time for the descent phase of squatting was normalized from 0% (initial position, start of movement) to 100% (squat position-stop of movement). The ROM of ankle, knee, hip, pelvis and spine in the sagittal plane and the normalized time when the maximum joint angles occurred during the descent were analyzed to investigate the relationship between them and the squat depth in males and females. The knee ROM contributed most significantly, from all joints to squatting depth in both females and males (r = 0.92, p < 0.001). The squat depth was related to lumbar, hip and knee motion in females and to all kinematics parameters in males. Maximal ankle dorsiflexion and pelvis anterior tilt were reached earlier than the maximal angles of knee, hip and spine during squatting. Pelvis and ankle timing was negatively correlated with the squat depth (rs = -0.64, p < 0.001 and rs = -0.29, p = 0.02, respectively). This suggests that pelvis and ankle timing can be important to keeping balance during squatting and can lead to achieving the desired depth.",
      publicationTypes: ["Journal Article"],
      meshTerms: [
        "Ankle",
        "Biomechanical Phenomena",
        "Exercise",
        "Female",
        "Hip",
        "Humans",
        "Knee",
        "Lower Extremity",
        "Lumbar Vertebrae",
        "Male",
        "Pelvis",
        "Postural Balance",
        "Range of Motion, Articular",
        "Time and Motion Studies",
        "Young Adult",
      ],
      keywords: [
        "Squat depth",
        "ankle",
        "kinematics",
        "lumbar spine",
        "pelvis",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "other",
      confidence: "high",
    },
    note: {
      entryNumber: 36,
      topic: "lower_body_biomechanics",
      suppliedUse: "squat-depth kinematics.",
      studyDesignAndPopulation:
        "Cross-sectional kinematic study in 60 recreationally active young adults (20 females, 40 males).",
      interventionAndComparator:
        "Bodyweight squat to maximal depth compared by sex and correlated with joint range of motion and timing.",
      primaryOutcomes: "",
      directResults:
        "Knee range of motion correlated most strongly with squat depth (r=0.92); maximal ankle dorsiflexion and pelvis anterior tilt occurred significantly before maximal depth; pelvis timing (rs=-0.64) and ankle timing (rs=-0.29) negatively correlated with achieved depth.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Bodyweight-only intervention in untrained healthy young adults; analysis limited to the sagittal plane.",
      evidenceTier: "other",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "22222322",
      title:
        "Effects of changing from full range of motion to partial range of motion on squat kinetics.",
      authors: ["Eric J Drinkwater", "Norman R Moore", "Stephen P Bird"],
      journal: "Journal of strength and conditioning research",
      year: "2012",
      volume: "26",
      issue: "4",
      pagesOrElocation: "890-6",
      doi: "10.1519/JSC.0b013e318248ad2e",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/22222322/",
      pmcFullTextUrl: "",
      abstract:
        "It is commonplace for people involved in recreational weight training to limit squat depth to lift heavier loads. This study compares differences in movement kinetics when squatting in the full range of motion (FROM) vs. partial range of motion (PROM). Ten men with a 1-year minimum of resistance training attended 4 sessions each comprising 4 sets of squats following one of FROM for 10 repetitions (FROM10) at an intensity of 67% 1 repetition maximum (1RM) FROM squat, PROM for 10 repetitions (PROM10) at 67% 1RM PROM squat, FROM for 5 repetitions (FROM5) at 83% FROM squat or PROM for 5 repetitions (PROM5) at 83% 1RM PROM squat. Movement velocity was not specified. Squat kinetics data were collected using an optical encoder. Differences between conditions were analyzed by repeated-measures analysis of variance and expressed as mean differences and standardized (Cohen) effect sizes with 95% confidence limits. The PROM5 power was substantially more than the PROM10 (98 W, -21 to 217; mean, lower and upper 95% confidence limits), FROM5 (168 W, 47-289), and FROM10 (255 W, 145-365). The force produced during PROM5 was substantially more than PROM10 (372 N, 254-490), FROM5 (854 N, 731-977), and FROM10 (1,069 N, 911-1227). The peak velocity produced during FROM10 was substantially more than FROM5 (0.105 m·s(-1), 0.044-0.166), PROM10 (0.246 m·s(-1), 0.167-0.325), and PROM5 (0.305 m·s(-1), 0.228-0.382). The FROM5 was substantially more than FROM10 (86 J, 59-113), PROM5 (142 J, 90-194), and PROM10 (211 J, 165-257). Therefore, either range of motion can have practical implications in designing resistance training programs depending on if the training goal is related to power and force development, maximizing work output or speed. Moderate-load PROM training, common among recreational weight trainers, is unlikely to provide higher movement kinetics.",
      publicationTypes: ["Journal Article"],
      meshTerms: [
        "Humans",
        "Male",
        "Muscle Strength",
        "Muscle, Skeletal",
        "Range of Motion, Articular",
        "Weight Lifting",
        "Young Adult",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "high",
      confidence: "high",
    },
    note: {
      entryNumber: 37,
      topic: "lower_body_biomechanics",
      suppliedUse: "partial vs full squat kinetic differences.",
      studyDesignAndPopulation:
        "Acute repeated-measures biomechanics study in 10 resistance-trained men with at least one year of training.",
      interventionAndComparator:
        "Four squat conditions: full-range or partial-range squats, each performed for five or ten repetitions at condition-specific 1RM percentages.",
      primaryOutcomes:
        "Movement power, force, velocity, and total work measured with an optical encoder.",
      directResults:
        "Partial-range five-repetition squats produced greater force and power than the other tested conditions, while full-range five-repetition squats produced the greatest work and full-range ten-repetition squats the greatest peak velocity in this acute protocol.",
      implementationImplication:
        "Use range and loading to target a specific acute kinetic quality; these acute findings do not establish superior hypertrophy, injury prevention, or long-term sport transfer.",
      limitations:
        "Ten trained men; acute sessions only; movement velocity was not prescribed; no longitudinal adaptation outcomes.",
      evidenceTier: "high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource: "Original PubMed abstract manually verified",
    },
  },
  {
    study: {
      pmid: "22344055",
      title: "Influence of squatting depth on jumping performance.",
      authors: [
        "Hagen Hartmann",
        "Klaus Wirth",
        "Markus Klusemann",
        "Josip Dalic",
        "Claus Matuschek",
        "Dietmar Schmidtbleicher",
      ],
      journal: "Journal of strength and conditioning research",
      year: "2012",
      volume: "26",
      issue: "12",
      pagesOrElocation: "3243-61",
      doi: "10.1519/JSC.0b013e31824ede62",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/22344055/",
      pmcFullTextUrl: "",
      abstract:
        "It is unclear if increases in 1 repetition maximum (1RM) in quarter squats result in higher gains compared with full depth squats in isometric force production and vertical jump performance. The aim of the research projects was to compare the effects of different squat variants on the development of 1RM and their transfer effects to Countermovement jump (CMJ) and squat jump (SJ) height, maximal voluntary contraction (MVC), and maximal rate of force development (MRFD). Twenty-three women and 36 men (mean age: 24.11 ± 2.88 years) were parallelized into 3 groups based on their CMJ height: deep front squats (FSQ, n = 20), deep back squats (BSQ, n = 20), and quarter back squats (BSQ¼, n = 19). In addition, a control group (C, n = 16) existed (mean age: 24.38 ± 0.50 years). Experimental groups trained 2 d·wk for 10 weeks with a strength-power block periodization, which produced significant (p ≤ 0.05) gains of the specific squat 1RM. The FSQ and BSQ attained significant (p ≤ 0.05) elevations in SJ and CMJ without any interaction effects between both groups (p ≥ 0.05). The BSQ¼ and C did not reveal any significant changes of SJ and CMJ. The FSQ and BSQ had significantly higher SJ scores over C (p ≤ 0.05). The BSQ did not feature any significant group difference to BSQ¼ (p = 0.116) in SJ, whereas FSQ showed a trend toward higher SJ heights over BSQ¼ (p = 0.052). The FSQ and BSQ presented significantly (p ≤ 0.05) higher CMJ heights over BSQ¼ and C. Posttest in MVC and MRFD demonstrated no significant changes for BSQ. Significant declines in MRFD for FSQ in the right leg (p ≤ 0.05) without any interaction effects for MVC and MRFD between both FSQ and BSQ were found. Training of BSQ¼ resulted in significantly (p ≤ 0.05) lower MRFD and MVC values in contrast to FSQ and BSQ. Quarter squat training elicited significant (p ≤ 0.05) transfer losses into the isometric maximal and explosive strength behavior. These findings therefore contest the concept of superior angle-specific transfer effects. Deep front and back squats guarantee performance-enhancing transfer effects of dynamic maximal strength to dynamic speed-strength capacity of hip and knee extensors compared with quarter squats.",
      publicationTypes: ["Journal Article", "Research Support, Non-U.S. Gov't"],
      meshTerms: [
        "Analysis of Variance",
        "Anthropometry",
        "Female",
        "Humans",
        "Isometric Contraction",
        "Leg",
        "Longitudinal Studies",
        "Male",
        "Muscle Strength",
        "Muscle, Skeletal",
        "Resistance Training",
        "Task Performance and Analysis",
        "Young Adult",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "very_high",
      confidence: "high",
    },
    note: {
      entryNumber: 38,
      topic: "lower_body_biomechanics",
      suppliedUse: "squat-depth transfer to jumping.",
      studyDesignAndPopulation:
        "Ten-week parallel-group resistance-training intervention in 59 young adults, with deep front squat, deep back squat, quarter back squat, and control groups.",
      interventionAndComparator:
        "Two sessions per week of block-periodized squat training using deep front squats, deep back squats, or quarter back squats, compared with a control group.",
      primaryOutcomes:
        "Specific squat 1RM, countermovement-jump height, squat-jump height, maximal voluntary contraction, and maximal rate of force development.",
      directResults:
        "All training groups improved their trained squat 1RM. The deep front- and deep back-squat groups improved countermovement- and squat-jump height, while the quarter-squat group did not show significant jump-height change and had lower post-test maximal voluntary contraction and rate-of-force-development values than the deep-squat groups.",
      implementationImplication:
        "For the studied strength-power block and population, deep front or back squat training was associated with better jump outcomes than quarter squatting; select depth in the context of the athlete, loading plan, and specific objective.",
      limitations:
        "Ten-week protocol, mixed-sex young-adult cohort, specific periodization, and only the tested depth definitions; findings should not be generalized to all partial-range or jumping programs.",
      evidenceTier: "very_high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource: "Original PubMed abstract manually verified",
    },
  },
  {
    study: {
      pmid: "27630574",
      title:
        "Faster Movement Speed Results in Greater Tendon Strain during the Loaded Squat Exercise.",
      authors: [
        "Jacob E Earp",
        "Robert U Newton",
        "Prue Cormie",
        "Anthony J Blazevich",
      ],
      journal: "Frontiers in physiology",
      year: "2016",
      volume: "7",
      issue: "",
      pagesOrElocation: "366",
      doi: "10.3389/fphys.2016.00366",
      pmcid: "PMC5005367",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/27630574/",
      pmcFullTextUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5005367/",
      abstract:
        "Tendon dynamics influence movement performance and provide the stimulus for long-term tendon adaptation. As tendon strain increases with load magnitude and decreases with loading rate, changes in movement speed during exercise should influence tendon strain.\n\nTen resistance-trained men [squat one repetition maximum (1RM) to body mass ratio: 1.65 ± 0.12] performed parallel-depth back squat lifts with 60% of 1RM load at three different speeds: slow fixed-tempo (TS: 2-s eccentric, 1-s pause, 2-s concentric), volitional-speed without a pause (VS) and maximum-speed jump (JS). In each condition joint kinetics, quadriceps tendon length (LT), patellar tendon force (FT), and rate of force development (RFDT) were estimated using integrated ultrasonography, motion-capture, and force platform recordings.\n\nPeak LT, FT, and RFDT were greater in JS than TS (p < 0.05), however no differences were observed between VS and TS. Thus, moving at faster speeds resulted in both greater tendon stress and strain despite an increased RFDT, as would be predicted of an elastic, but not a viscous, structure. Temporal comparisons showed that LT was greater in TS than JS during the early eccentric phase (10-14% movement duration) where peak RFDT occurred, demonstrating that the tendon's viscous properties predominated during initial eccentric loading. However, during the concentric phase (61-70 and 76-83% movement duration) differing FT and similar RFDT between conditions allowed for the tendon's elastic properties to predominate such that peak tendon strain was greater in JS than TS.\n\nBased on our current understanding, there may be an additional mechanical stimulus for tendon adaptation when performing large range-of-motion isoinertial exercises at faster movement speeds.",
      publicationTypes: ["Journal Article"],
      meshTerms: [],
      keywords: [
        "Young's modulus",
        "fascicle",
        "patellar",
        "quadriceps",
        "rate of force development",
        "tendon",
        "viscoelastic",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "FULL_TEXT_VERIFIED",
      evidenceTier: "high",
      confidence: "high",
    },
    note: {
      entryNumber: 39,
      topic: "lower_body_biomechanics",
      suppliedUse: "movement speed and tendon loading.",
      studyDesignAndPopulation:
        "Within-subject experimental study of 10 healthy, resistance-trained men (1RM squat ≥ 1.5x body mass) performing loaded squats at varying speeds.",
      interventionAndComparator:
        "Parallel-depth back squats at 60% 1RM comparing three speeds: slow-tempo (2s eccentric, 1s pause, 2s concentric), volitional speed, and maximal velocity jump squats.",
      primaryOutcomes:
        "Quadriceps tendon lengthening (strain), patellar tendon force (stress), rate of force development, and vastus lateralis muscle activity.",
      directResults:
        "Peak tendon strain and force increased with movement speed, with jump squats (JS) eliciting significantly greater peak tendon lengthening and forces than slow-tempo squats (TS). Peak patellar tendon force was significantly higher in JS than TS (p=0.037), while no significant difference in peak tendon strain was found between TS (27.5 cm) and volitional speed (28.2 cm). The tendon behaved as a viscoelastic structure during the eccentric phase but predominantly as an elastic structure during the concentric phase, where peak strain occurred.",
      implementationImplication:
        "Perform loaded squats with maximal concentric intent or as jump squats to maximize quadriceps tendon strain for potential stiffness adaptations.",
      limitations:
        "Small male-only sample, reliance on cadaver-derived biometric equations, and partial extrapolation of fascicle lengths during large ranges of motion.",
      evidenceTier: "high",
      reviewStatus: "FULL_TEXT_VERIFIED",
      confidence: "high",
      noteSource: "PMC full-text sections retrieved through NCBI EFetch",
    },
  },
  {
    study: {
      pmid: "29489722",
      title:
        "Biomechanical, Anthropometric, and Psychological Determinants of Barbell Back Squat Strength.",
      authors: [
        "Andrew D Vigotsky",
        "Megan A Bryanton",
        "Greg Nuckols",
        "Chris Beardsley",
        "Bret Contreras",
        "Jessica Evans",
        "Brad J Schoenfeld",
      ],
      journal: "Journal of strength and conditioning research",
      year: "2019",
      volume: "33 Suppl 1",
      issue: "",
      pagesOrElocation: "S26-S35",
      doi: "10.1519/JSC.0000000000002535",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/29489722/",
      pmcFullTextUrl: "",
      abstract:
        "Vigotsky, AD, Bryanton, MA, Nuckols, G, Beardsley, C, Contreras, B, Evans, J, and Schoenfeld, BJ. Biomechanical, anthropometric, and psychological determinants of barbell back squat strength. J Strength Cond Res 33(7S): S26-S35, 2019-Previous investigations of strength have only focused on biomechanical or psychological determinants, while ignoring the potential interplay and relative contributions of these variables. The purpose of this study was to investigate the relative contributions of biomechanical, anthropometric, and psychological variables to the prediction of maximum parallel barbell back squat strength. Twenty-one college-aged participants (male = 14; female = 7; age = 23 ± 3 years) reported to the laboratory for 2 visits. The first visit consisted of anthropometric, psychometric, and parallel barbell back squat 1 repetition maximum (1RM) testing. On the second visit, participants performed isometric dynamometry testing for the knee, hip, and spinal extensors in a sticking point position-specific manner. Multiple linear regression and correlations were used to investigate the combined and individual relationships between biomechanical, anthropometric, and psychological variables and squat 1RM. Multiple regression revealed only 1 statistically predictive determinant: fat-free mass normalized to height (standardized estimate ± SE = 0.6 ± 0.3; t(16) = 2.28; p = 0.037). Correlation coefficients for individual variables and squat 1RM ranged from r = -0.79 to 0.83, with biomechanical, anthropometric, experiential, and sex predictors showing the strongest relationships, and psychological variables displaying the weakest relationships. These data suggest that back squat strength in a heterogeneous population is multifactorial and more related to physical rather than psychological variables.",
      publicationTypes: ["Journal Article"],
      meshTerms: [
        "Adiposity",
        "Adult",
        "Anthropometry",
        "Biomechanical Phenomena",
        "Body Height",
        "Female",
        "Humans",
        "Male",
        "Muscle Strength",
        "Muscle, Skeletal",
        "Weight Lifting",
        "Young Adult",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "high",
      confidence: "high",
    },
    note: {
      entryNumber: 40,
      topic: "lower_body_biomechanics",
      suppliedUse: "determinants of squat performance.",
      studyDesignAndPopulation:
        "Cross-sectional correlational study in 21 recreationally trained college-aged adults (14 male, 7 female) with at least 1 year of resistance training experience.",
      interventionAndComparator:
        "Assessment of biomechanical (isometric joint torques), anthropometric (fat-free mass), and psychological (self-efficacy) determinants of 1RM parallel back squat strength.",
      primaryOutcomes: "",
      directResults:
        "Relative fat-free mass was the only significant predictor of 1RM squat strength in a multiple regression model (standardized estimate = 0.575, p = 0.037); squat 1RM also showed strong individual correlations with hip extension torque (r = 0.80) and knee extension torque (r = 0.76).",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Cross-sectional design limits causal inference; small heterogeneous sample may not represent elite populations; isometric strength testing at a single position may not fully represent dynamic performance.",
      evidenceTier: "high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "36918403",
      title:
        "Gluteal Muscle Forces during Hip-Focused Injury Prevention and Rehabilitation Exercises.",
      authors: [
        "Tyler J Collings",
        "Matthew N Bourne",
        "Rod S Barrett",
        "Evy Meinders",
        "BASíLIO A M GONçALVES",
        "Anthony J Shield",
        "Laura E Diamond",
      ],
      journal: "Medicine and science in sports and exercise",
      year: "2023",
      volume: "55",
      issue: "4",
      pagesOrElocation: "650-660",
      doi: "10.1249/MSS.0000000000003091",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/36918403/",
      pmcFullTextUrl: "",
      abstract:
        "This study aimed to compare and rank gluteal muscle forces in eight hip-focused exercises performed with and without external resistance and describe the underlying fiber lengths, velocities, and muscle activations.\n\nMotion capture, ground reaction forces, and electromyography (EMG) were used as input to an EMG-informed neuromusculoskeletal model to estimate gluteus maximus, medius, and minimus muscle forces. Participants were 14 female footballers (18-32 yr old) with at least 3 months of lower limb strength training experience. Each participant performed eight hip-focused exercises (single-leg squat, split squat, single-leg Romanian deadlift [RDL], single-leg hip thrust, banded side step, hip hike, side plank, and side-lying leg raise) with and without 12 repetition maximum (RM) resistance. For each muscle, exercises were ranked by peak muscle force, and k-means clustering separated exercises into four tiers.\n\nThe tier 1 exercises for gluteus maximus were loaded split squat (95% confidence interval [CI] = 495-688 N), loaded single-leg RDL (95% CI = 500-655 N), and loaded single-leg hip thrust (95% CI = 505-640 N). The tier 1 exercises for gluteus medius were body weight side plank (95% CI = 338-483 N), loaded single-leg squat (95% CI = 278-422 N), and loaded single-leg RDL (95% CI = 283-405 N). The tier 1 exercises for gluteus minimus were loaded single-leg RDL (95% CI = 267-389 N) and body weight side plank (95% CI = 272-382 N). Peak gluteal muscle forces increased by 28-150 N when exercises were performed with 12RM external resistance compared with body weight only. Peak muscle force coincided with maximum fiber length for most exercises.\n\nGluteal muscle forces were exercise specific, and peak muscle forces increased by varying amounts when adding a 12RM external resistance. These findings may inform exercise selection by facilitating the targeting of individual gluteal muscles and optimization of mechanical loads to match performance, injury prevention, or rehabilitation training goals.",
      publicationTypes: ["Journal Article"],
      meshTerms: [
        "Humans",
        "Female",
        "Muscle, Skeletal",
        "Exercise Therapy",
        "Buttocks",
        "Electromyography",
        "Thigh",
        "Hip Injuries",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "moderate_high",
      confidence: "high",
    },
    note: {
      entryNumber: 41,
      topic: "lower_body_biomechanics",
      suppliedUse: "modeled gluteus maximus, medius and minimus forces.",
      studyDesignAndPopulation:
        "EMG-informed neuromusculoskeletal modeling study in 14 female footballers with ≥3 months of strength training experience.",
      interventionAndComparator:
        "Eight hip-focused exercises performed with 12RM external resistance versus body weight only.",
      primaryOutcomes: "",
      directResults:
        "Loaded split squat, single-leg RDL, and single-leg hip thrust produced the highest gluteus maximus forces (up to 688 N); body weight side plank and loaded single-leg squat maximized gluteus medius forces (up to 483 N); external resistance increased peak forces by 28-150 N across all exercises.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Small sample of 14 trained female athletes; model-based force estimation rather than direct measurement; acute study design.",
      evidenceTier: "moderate_high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "33900255",
      title:
        "Hip and Knee Extensor Activation During the Hip Thrust and Rear-Foot-Elevated Split Squat in Trained Females.",
      authors: [
        "Kevin McCurdy",
        "John Walker",
        "Camila Kelly",
        "Michael Polinski",
      ],
      journal: "Journal of strength and conditioning research",
      year: "2021",
      volume: "35",
      issue: "5",
      pagesOrElocation: "1201-1207",
      doi: "10.1519/JSC.0000000000004035",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/33900255/",
      pmcFullTextUrl: "",
      abstract:
        "McCurdy, K, Walker, J, Kelly, C, and Polinski, M. Hip and knee extensor activation during the hip thrust and rear-foot-elevated split squat in trained females. J Strength Cond Res 35(5): 1201-1207, 2021-The aim of the study was to compare hip and knee extensor muscle activation between the hip thrust (HT) and rear-foot-elevated split squat (RFESS) within different depths and the entire range of motion. Twenty, young adult female subjects (age, 20.9 ± 1.3 years; height, 164.6 ± 7.5 cm; mass 63.2 ± 8.8 kg) with an intermediate level of resistance training experience completed the study. Three repetitions were completed at 80% of the 1-repetition maximum. Gluteus maximus, vastus lateralis, and the medial (semitendinosus and semimembranosus) and lateral (biceps femoris) hamstrings electromyographic data were compared at the top, middle, and bottom one-third of the hip range of motion and for the entire repetition. A repeated-measures analysis of variance was used to test significance set at p ≤ 0.05. All 4 muscles revealed higher (p < 0.001) activation at the top position of the HT compared with the middle and bottom, whereas higher scores (p < 0.001) were found in the bottom position during the RFESS. The HT revealed greater activity (p < 0.001) than the RFESS in all muscles at the top, whereas the RFESS showed higher scores (p < 0.001) than the HT in all muscles in the bottom position. For the entire repetition, the RFESS produce significantly greater vastus lateralis activation (59.4 vs 43.6%). The data indicate that the greatest effect for the HT is demonstrated in the top position and at the bottom for the RFESS. Thus, we recommend to implement both exercises in a training program to maximize gluteus maximus and hamstring activation across the full range of motion. For the greatest vastus lateralis activation, the RFESS is recommended.",
      publicationTypes: ["Journal Article"],
      meshTerms: [
        "Adult",
        "Electromyography",
        "Female",
        "Hamstring Muscles",
        "Humans",
        "Muscle, Skeletal",
        "Quadriceps Muscle",
        "Resistance Training",
        "Young Adult",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "moderate_low",
      confidence: "high",
    },
    note: {
      entryNumber: 42,
      topic: "lower_body_biomechanics",
      suppliedUse: "hip thrust vs RFESS.",
      studyDesignAndPopulation:
        "Acute cross-over EMG study in 20 resistance-trained young adult females.",
      interventionAndComparator:
        "Barbell hip thrust versus rear-foot-elevated split squat at 80% 1RM.",
      primaryOutcomes: "",
      directResults:
        "Hip thrust elicited significantly greater activation of the gluteus maximus, vastus lateralis, and hamstrings at the top position, while the rear-foot-elevated split squat elicited greater activation at the bottom position; the rear-foot-elevated split squat produced significantly higher vastus lateralis activation over the entire repetition (59.4% vs. 43.6%).",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Acute surface EMG study in a small sample of trained females; does not provide direct evidence for longitudinal hypertrophy or sport-specific performance transfer.",
      evidenceTier: "moderate_low",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "33332802",
      title:
        "Activation of the Gluteus Maximus During Performance of the Back Squat, Split Squat, and Barbell Hip Thrust and the Relationship With Maximal Sprinting.",
      authors: [
        "Michael J Williams",
        "Neil V Gibson",
        "Graeme G Sorbie",
        "Ukadike C Ugbolue",
        "James Brouner",
        "Chris Easton",
      ],
      journal: "Journal of strength and conditioning research",
      year: "2021",
      volume: "35",
      issue: "1",
      pagesOrElocation: "16-24",
      doi: "10.1519/JSC.0000000000002651",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/33332802/",
      pmcFullTextUrl: "",
      abstract:
        "Williams, MJ, Gibson, N, Sorbie, GG, Ugbolue, UC, Brouner, J, and Easton, C. Activation of the gluteus maximus during performance of the back squat, split squat, and barbell hip thrust and the relationship with maximal sprinting. J Strength Cond Res 35(1): 16-24, 2021-The purpose of this research was to compare muscle activation of the gluteus maximus and ground reaction force between the barbell hip thrust, back squat, and split squat and to determine the relationship between these outcomes and vertical and horizontal forces during maximal sprinting. Twelve, male, team sport athletes (age, 25.0 ± 4.0 years; stature, 184.1 ± 6.0 cm; body mass, 82.2 ± 7.9 kg) performed separate movements of the 3 strength exercises at a load equivalent to their individual 3 repetition maximum. The ground reaction force was measured using force plates and the electromyography (EMG) activity of the upper and lower gluteus maximus and was recorded in each leg and expressed as percentage of the maximum voluntary isometric contraction (MVIC). Subjects then completed a single sprint on a nonmotorized treadmill for the assessment of maximal velocity and horizontal and vertical forces. Although ground reaction force was lower, peak EMG activity in the gluteus maximus was higher in the hip thrust than in the back squat (p = 0.024; 95% confidence interval [CI] = 4-56% MVIC) and split squat (p = 0.016; 95% CI = 6-58% MVIC). Peak sprint velocity correlated with both anterior-posterior horizontal force (r = 0.72) and peak ground reaction force during the barbell hip thrust (r = 0.69) but no other variables. The increased activation of gluteus maximus during the barbell hip thrust and the relationship with maximal running speed suggests that this movement may be optimal for training this muscle group in comparison to the back squat and split squat.",
      publicationTypes: ["Journal Article"],
      meshTerms: [
        "Adult",
        "Buttocks",
        "Electromyography",
        "Humans",
        "Isometric Contraction",
        "Male",
        "Muscle, Skeletal",
        "Thigh",
        "Young Adult",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "moderate_low",
      confidence: "high",
    },
    note: {
      entryNumber: 43,
      topic: "lower_body_biomechanics",
      suppliedUse:
        "glute activation across compound exercises and sprint relationship.",
      studyDesignAndPopulation:
        "Within-subject experimental comparison in 12 male team-sport athletes with 4.0 ± 1.0 years of strength training experience.",
      interventionAndComparator:
        "Comparison of barbell back squat, barbell split squat, and barbell hip thrust at 3-repetition maximum loads.",
      primaryOutcomes: "",
      directResults:
        "Peak gluteus maximus EMG was significantly higher in the hip thrust than the back squat (p=0.024) and split squat (p=0.016); peak sprint velocity correlated with peak horizontal force (r=0.72) and hip thrust ground reaction force (r=0.69), but not with gluteus maximus activation.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Small sample size of team-sport athletes; use of non-motorized treadmill for sprinting; vertical force through the bench was not measured during hip thrusts.",
      evidenceTier: "moderate_low",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "39539142",
      title:
        "Effects of horizontally versus vertically loaded resistance exercises on performance and muscle architecture.",
      authors: [
        "Sandro Bartolomei",
        "Giuseppe Rosaci",
        "Davide Latini",
        "Federico Nigro",
      ],
      journal: "The Journal of sports medicine and physical fitness",
      year: "2025",
      volume: "65",
      issue: "3",
      pagesOrElocation: "312-319",
      doi: "10.23736/S0022-4707.24.16218-4",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/39539142/",
      pmcFullTextUrl: "",
      abstract:
        "The aim of this study was to compare a training program based on horizontally (HT) versus vertically (VT) loaded exercises on performance and muscle architecture of the lower body muscles.\n\nNineteen resistance trained individuals were randomly assigned to HT (N.=10; age: 25.9±4.2 y; body mass: 72.7±11.4 kg; height: 174.0±6.0 cm) or VT group (N.=9; age: 26.9±4.4 y; body mass: 76.2±10.8 kg; height: 174.2.0±5.8 cm). Both 6-week training programs included 4 training sessions per week and were equated for the total number of repetitions. One repetition maximum (1RM) was assessed for squat and hip thrust, together with vertical and horizontal jumps and sprint. Muscle thickness (MT) and echo intensity (EI) of vastus lateralis, vastus medialis and gluteus were also evaluated pre- and post-training period.\n\nA significantly greater increase in 1RM hip thrust was detected in HT (+17.9%; P=0.004) while greater increases in 1RM squat were found in VT (+10.5%; P=0.007). A greater increase (P=0.009) in vastus medialis MT was detected in VT (4.1%) compared to HT (-7.9%). Similar increases in MT of gluteus were registered in both groups (P<0.05). A greater improvement in standing long jump (P=0.004) was detected in HT (+7.6%) compared to VT (+1.6%), while both groups significantly improved vertical jump performance. Combining both groups, strong correlations were detected between gluteus EI and 20-m sprint (r=0.79; P<0.001).\n\nResults indicate that HT was more effective than VT for horizontal jumps while both HT and VT were equally effective on vertical jumps. Both HT and VT promoted similar changes in muscle architecture of the gluteus, but not of the vastus medialis.",
      publicationTypes: ["Journal Article", "Randomized Controlled Trial"],
      meshTerms: [
        "Humans",
        "Resistance Training",
        "Adult",
        "Male",
        "Muscle, Skeletal",
        "Muscle Strength",
        "Young Adult",
        "Female",
        "Athletic Performance",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "very_high",
      confidence: "high",
    },
    note: {
      entryNumber: 44,
      topic: "lower_body_biomechanics",
      suppliedUse: "force orientation and transfer.",
      studyDesignAndPopulation:
        "6-week randomized controlled trial in 19 resistance-trained adults (15 men, 4 women).",
      interventionAndComparator:
        "Horizontally loaded training (hip thrust, reverse hyperextension, horizontal jumps) versus vertically loaded training (squat, step-up, vertical jumps).",
      primaryOutcomes: "",
      directResults:
        "HT increased 1RM hip thrust by 17.9% and standing long jump by 7.6%, outperforming VT; VT increased 1RM squat by 10.5% and vastus medialis thickness by 4.1%, outperforming HT; both groups similarly increased gluteus thickness and vertical jump height.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Short-term 6-week intervention in trained adults; small sample size (n=19); results may not generalize to sprint performance in this population.",
      evidenceTier: "very_high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "40988435",
      title:
        "Comparing the impact of hip thrust versus squat training on lower limb performance in sub-elite athletes: a systematic review and meta-analysis.",
      authors: [
        "Seyyed Hadi Asghari",
        "Alexei Wong",
        "Paul Comfort",
        "Seyed Javad Mirghani",
        "Shohreh Sharifian",
        "Mahbanou Ghaderi",
      ],
      journal: "Sports biomechanics",
      year: "2025",
      volume: "24",
      issue: "12",
      pagesOrElocation: "3473-3492",
      doi: "10.1080/14763141.2025.2553700",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/40988435/",
      pmcFullTextUrl: "",
      abstract:
        "The aim of this systematic review and meta-analysis was to compare the effects of squat (SQ) and hip thrust (HT) training on performance in lower body athletic tasks, across different groups. A comprehensive search was conducted up to 31 May 2024, using PubMed, Web of Science, Scopus, Google Scholar, and Embase. SQ training was found to significantly improve vertical jump height (VJH) but greater than the HT. Neither SQ nor HT training had a significant impact on horizontal jump distance (HJD), short sprint time (SST), short sprint performance (SSP) or change of direction (COD) performance. In 12 to 16 sessions subgroup, SQ training significantly improved VJH, showing a medium ES. However, in other subgroups, neither SQ nor HT exercises produced significant improvements in HJD, SSP, SST, or COD performance. Subgroup analyses corroborated these findings. Squat exercises are more effective in developing VJH, while alternatively, no conclusive preference can be made between the exercises for enhancing HJD, SSP, and SST markers. Neither exercise had a discernible impact on COD performance. Future research should focus on conducting higher-quality studies to better elucidate the specific effects of SQ and HT training, or a combination of the two exercises, on various performance metrics.",
      publicationTypes: [
        "Journal Article",
        "Systematic Review",
        "Meta-Analysis",
        "Comparative Study",
      ],
      meshTerms: [
        "Humans",
        "Athletic Performance",
        "Lower Extremity",
        "Resistance Training",
        "Biomechanical Phenomena",
        "Hip",
        "Physical Conditioning, Human",
        "Plyometric Exercise",
      ],
      keywords: ["Power", "change of direction", "sprint"],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "review",
      confidence: "high",
    },
    note: {
      entryNumber: 45,
      topic: "lower_body_biomechanics",
      suppliedUse: "hip thrust vs squat performance adaptations.",
      studyDesignAndPopulation:
        "Systematic review and meta-analysis of studies comparing training modalities in sub-elite athletes.",
      interventionAndComparator: "Squat training versus hip thrust training.",
      primaryOutcomes: "",
      directResults:
        "Squat training significantly improved vertical jump height (VJH) more than hip thrust training, with a medium effect size in the 12–16 session subgroup; no significant differences were found between exercises for horizontal jump distance, short sprint time, or change of direction performance.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Findings are specific to sub-elite athletes and influenced by training duration; lack of high-quality studies limits the ability to draw definitive conclusions for horizontal and sprint tasks.",
      evidenceTier: "review",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "24149748",
      title: "Muscle activation during various hamstring exercises.",
      authors: [
        "Matt J McAllister",
        "Kelley G Hammond",
        "Brian K Schilling",
        "Lucas C Ferreria",
        "Jacob P Reed",
        "Lawrence W Weiss",
      ],
      journal: "Journal of strength and conditioning research",
      year: "2014",
      volume: "28",
      issue: "6",
      pagesOrElocation: "1573-80",
      doi: "10.1519/JSC.0000000000000302",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/24149748/",
      pmcFullTextUrl: "",
      abstract:
        'The dorsal muscles of the lower torso and extremities have often been denoted the "posterior chain." These muscles are used to support the thoracic and lumbar spine and peripheral joints, including the hip, knee, and ankle on the dorsal aspect of the body. This study investigated the relative muscle activity of the hamstring group and selected surrounding musculature during the leg curl, good morning, glute-ham raise, and Romanian deadlift (RDL). Twelve healthy, weight-trained men performed duplicate trials of single repetitions at 85% 1-repetition maximum for each lift in random order, during which surface electromyography and joint angle data were obtained. Repeated measures analysis of variance across the 4 exercises was performed to compare the activity from the erector spinae (ES), gluteus medius (GMed), semitendinosus (ST), biceps femoris (BF), and medial gastrocnemius (MGas). Significant differences (p ≤ 0.05) were noted in eccentric muscle activity between exercise for the MGas (p < 0.027), ST (p < 0.001), BF (p < 0.001), and ES (p = 0.032), and in concentric muscle activity, for the ES (p < 0.001), BF (p = 0.010), ST (p = 0.009), MGas (p < 0.001), and the GMed (p = 0.018). Bonferroni post hoc analysis revealed significant pairwise differences during eccentric actions for the BF, ST, and MGas. Post hoc analysis also revealed significant pairwise differences during concentric actions for the ES, BF, ST, MGas, and GMed. Each of these showed effect sizes that are large or greater. The main findings of this investigation are that the ST is substantially more active than the BF among all exercises, and hamstring activity was maximized in the RDL and glute-ham raise. Therefore, athletes and coaches who seek to maximize the involvement of the hamstring musculature should consider focusing on the glute-ham raise and RDL.',
      publicationTypes: ["Journal Article"],
      meshTerms: [
        "Adult",
        "Anthropometry",
        "Electromyography",
        "Exercise",
        "Exercise Test",
        "Humans",
        "Leg",
        "Male",
        "Muscle Contraction",
        "Muscle, Skeletal",
        "Range of Motion, Articular",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "moderate_low",
      confidence: "high",
    },
    note: {
      entryNumber: 46,
      topic: "hamstrings_posterior_chain",
      suppliedUse: "leg curl, good morning, glute-ham raise and RDL.",
      studyDesignAndPopulation:
        "Repeated measures design in 12 healthy, weight-trained men performing single repetitions at 85% 1-repetition maximum.",
      interventionAndComparator:
        "Leg curl, good morning, glute-ham raise, and Romanian deadlift (RDL).",
      primaryOutcomes: "",
      directResults:
        "Semitendinosus activity was substantially higher than biceps femoris activity across all exercises; hamstring activation was maximized during the Romanian deadlift and glute-ham raise; significant activation differences were found in the erector spinae, gluteus medius, and medial gastrocnemius.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Surface electromyography in weight-trained men during single repetitions; not direct evidence of longitudinal hypertrophy or sport transfer.",
      evidenceTier: "moderate_low",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "29143379",
      title:
        "Region-dependent hamstrings activity in Nordic hamstring exercise and stiff-leg deadlift defined with high-density electromyography.",
      authors: ["A Hegyi", "A Péter", "T Finni", "N J Cronin"],
      journal: "Scandinavian journal of medicine & science in sports",
      year: "2018",
      volume: "28",
      issue: "3",
      pagesOrElocation: "992-1000",
      doi: "10.1111/sms.13016",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/29143379/",
      pmcFullTextUrl: "",
      abstract:
        "Recent studies suggest region-specific metabolic activity in hamstring muscles during injury prevention exercises, but the neural representation of this phenomenon is unknown. The aim of this study was to examine whether regional differences are evident in the activity of biceps femoris long head (BFlh) and semitendinosus (ST) muscles during two common injury prevention exercises. Twelve male participants without a history of hamstring injury performed the Nordic hamstring exercise (NHE) and stiff-leg deadlift (SDL) while BFlh and ST activities were recorded with high-density electromyography (HD-EMG). Normalized activity was calculated from the distal, middle, and proximal regions in the eccentric phase of each exercise. In NHE, ST overall activity was substantially higher than in BFlh (d = 1.06 ± 0.45), compared to trivial differences between muscles in SDL (d = 0.19 ± 0.34). Regional differences were found in NHE for both muscles, with different proximal-distal patterns: The distal region showed the lowest activity level in ST (regional differences, d range = 0.55-1.41) but the highest activity level in BFlh (regional differences, d range = 0.38-1.25). In SDL, regional differences were smaller in both muscles (d range = 0.29-0.67 and 0.16-0.63 in ST and BFlh, respectively) than in NHE. The use of HD-EMG in hamstrings revealed heterogeneous hamstrings activity during typical injury prevention exercises. High-density EMG might be useful in future studies to provide a comprehensive overview of hamstring muscle activity in other exercises and high-injury risk tasks.",
      publicationTypes: ["Journal Article"],
      meshTerms: [
        "Adult",
        "Athletic Injuries",
        "Electromyography",
        "Exercise",
        "Exercise Test",
        "Hamstring Muscles",
        "Humans",
        "Male",
        "Young Adult",
      ],
      keywords: [
        "bi-articular hamstrings",
        "electrical activity",
        "muscle function",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "moderate",
      confidence: "high",
    },
    note: {
      entryNumber: 47,
      topic: "hamstrings_posterior_chain",
      suppliedUse: "regional hamstring activity.",
      studyDesignAndPopulation:
        "Experimental study in 12 male participants without a history of hamstring injury.",
      interventionAndComparator:
        "Nordic hamstring exercise versus stiff-leg deadlift.",
      primaryOutcomes: "",
      directResults:
        "During the eccentric phase of the Nordic hamstring exercise, semitendinosus activity was substantially higher than biceps femoris long head activity (d = 1.06 ± 0.45), while the stiff-leg deadlift showed trivial differences (d = 0.19 ± 0.34); regional patterns in the Nordic hamstring exercise were muscle-specific, with semitendinosus activity lowest distally and biceps femoris long head activity highest distally.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Small sample size of 12 healthy males; acute electromyography study providing no direct evidence for hypertrophy, force, or sport transfer.",
      evidenceTier: "moderate",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "33678131",
      title:
        "Individual differences in the distribution of activation among the hamstring muscle heads during stiff-leg Deadlift and Nordic hamstring exercises.",
      authors: [
        "Aurélie Boyer",
        "François Hug",
        "Simon Avrillon",
        "Lilian Lacourpaille",
      ],
      journal: "Journal of sports sciences",
      year: "2021",
      volume: "39",
      issue: "16",
      pagesOrElocation: "1830-1837",
      doi: "10.1080/02640414.2021.1899405",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/33678131/",
      pmcFullTextUrl: "",
      abstract:
        "The aim of this study was to compare the distribution of activation among the three heads of the hamstring between a knee flexion-oriented exercise (Nordic hamstring) and a hip extension-oriented exercise (stiff-leg Deadlift) at the group and individual level. Data were collected for 20 participants. Muscle activation of the semimembranosus (SM), semitendinosus (ST), and biceps femoris (BF) was estimated using surface electromyography (EMG) during Nordic hamstring and stiff-leg Deadlift exercises. Although Nordic hamstring exercise induced a higher normalized RMS EMG value for BF (64.5 ± 17.4%) compared to SM (48.6 ± 14.6%; P<0.001) and ST (55.9 ± 17.4%; P < 0.001), the greatest active muscle varied between individuals. Similar interindividual differences in the greatest active muscle were found for the stiff-leg Deadlift exercise. Regarding the distribution of activation, the stiff-leg Deadlift favoured the contribution of the SM compared to ST (P < 0.001, 18/20 participants) whereas the Nordic hamstring exercise favoured the contribution of the ST compared to SM (P < 0.001, 19/20 participants). Importantly, these tasks affected the contribution of the activation of BF in different ways between individuals. The distribution of activation across the three muscles was well correlated between the two exercises (r values ≥ 0.42).",
      publicationTypes: [
        "Comparative Study",
        "Journal Article",
        "Observational Study",
      ],
      meshTerms: [
        "Adolescent",
        "Adult",
        "Electromyography",
        "Female",
        "Hamstring Muscles",
        "Humans",
        "Male",
        "Resistance Training",
        "Weight Lifting",
        "Young Adult",
      ],
      keywords: [
        "Muscle coordination",
        "electromyography",
        "hamstring injury prevention",
        "strengthening exercise",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "moderate_low",
      confidence: "high",
    },
    note: {
      entryNumber: 48,
      topic: "hamstrings_posterior_chain",
      suppliedUse: "individualized hamstring recruitment.",
      studyDesignAndPopulation:
        "Observational, comparative study using surface EMG in 20 sports science students (15 males, 5 females) with at least 1 year of resistance training experience.",
      interventionAndComparator:
        "Nordic hamstring exercise versus stiff-leg Deadlift.",
      primaryOutcomes: "",
      directResults:
        "Nordic hamstring favored semitendinosus over semimembranosus in 19/20 participants; stiff-leg Deadlift favored semimembranosus over semitendinosus in 18/20 participants; Nordic hamstring induced higher biceps femoris activation (64.5 ± 17.4%) than semimembranosus (48.6 ± 14.6%) and semitendinosus (55.9 ± 17.4%) at the group level.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Use of surface EMG only; not direct evidence of hypertrophy, force, or sport transfer; small sample size of 20 trained students.",
      evidenceTier: "moderate_low",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "40586278",
      title:
        "Robustness of hamstring muscle activation strategies following selective hypertrophy induced by Nordic hamstring curl and stiff-leg deadlift exercises.",
      authors: [
        "Titouan Morin",
        "Arnault H Caillet",
        "Antoine Nordez",
        "Valentin Doguet",
        "Lilian Lacourpaille",
      ],
      journal: "Journal of applied physiology (Bethesda, Md. : 1985)",
      year: "2025",
      volume: "139",
      issue: "1",
      pagesOrElocation: "296-307",
      doi: "10.1152/japplphysiol.00237.2025",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/40586278/",
      pmcFullTextUrl: "",
      abstract:
        "This study aimed to determine whether muscle activation distribution between hamstrings is modified after 9 wk of two resistance training programs that induce selective muscle hypertrophy. Using a blinded, randomized, controlled design, 36 resistance-untrained individuals were assigned to one of the three groups: control (CON), Nordic hamstring exercise (NHE), or stiff-leg deadlift (SDL). Strength gain was measured as changes in one-repetition maximum (1RM). Changes in semimembranosus (SM), semitendinosus (ST), and biceps femoris (BF) muscle volume were measured using three-dimensional (3-D) freehand ultrasound. Activation of each hamstring muscle head was assessed using surface electromyography during the trained exercise (or both for CON) performed at 80% of 1RM. We found a significant increase in 1RM after 9 wk for the NHE (37.4 ± 13.8%) and SDL (34.0 ± 21.2%) groups compared with CON. This strength gain was accompanied by selective hypertrophy of ST (24.3 ± 10.8%) and SM (11.2 ± 12.7%), for the NHE and SDL groups, respectively. However, statistical parametric mapping analyses revealed that muscle activation was not altered over time, between the groups, or by their interactions (all P ≥ 0.05). Our findings demonstrate the robustness of muscle activation strategies over time despite training-induced selective hypertrophy. These results provide a deeper understanding of the complex interplay between neural drive and muscle mechanical characteristics. This provides additional impetus to study long-term effects of activation strategies (e.g., on the development of musculoskeletal disorders), as they seem to represent a trait-like characteristic rather than a transient state.NEW & NOTEWORTHY We demonstrate that stiff-leg deadlift and Nordic hamstring exercises are effective in inducing selective hypertrophy of the semimembranosus (11.2%) and semitendinosus (24.4%), respectively. Hamstring muscle activation did not adapt to the change in the distribution of muscle volume. These resistance training exercises, commonly used in hamstring prevention and rehabilitation strategies, appear effective at increasing the force-generating potential of the targeted muscles in noninjured individuals, as their muscle volume increases without altering their activation strategies.",
      publicationTypes: [
        "Journal Article",
        "Randomized Controlled Trial",
        "Research Support, Non-U.S. Gov't",
      ],
      meshTerms: [
        "Humans",
        "Hamstring Muscles",
        "Male",
        "Resistance Training",
        "Hypertrophy",
        "Adult",
        "Muscle Strength",
        "Electromyography",
        "Young Adult",
        "Female",
        "Exercise",
        "Leg",
        "Muscle, Skeletal",
      ],
      keywords: [
        "EMG",
        "muscle coordination",
        "muscle volume",
        "resistance training",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "very_high",
      confidence: "high",
    },
    note: {
      entryNumber: 49,
      topic: "hamstrings_posterior_chain",
      suppliedUse: "selective hamstring hypertrophy.",
      studyDesignAndPopulation:
        "9-week blinded randomized controlled resistance-training intervention in 36 untrained adults.",
      interventionAndComparator:
        "Nordic hamstring exercise versus stiff-leg deadlift versus control.",
      primaryOutcomes: "",
      directResults:
        "Significant 1RM strength increases in NHE (37.4%) and SDL (34.0%) groups; selective volume increases in semitendinosus (24.3% in NHE) and semimembranosus (11.2% in SDL); no significant changes in hamstring muscle activation distribution during trained exercises at 80% 1RM despite selective hypertrophy.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Short-term intervention in untrained adults; surface EMG limitations including potential crosstalk and normalization bias; high-intensity (80% 1RM) testing may constrain neural drive flexibility.",
      evidenceTier: "very_high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "38515303",
      title:
        "Individual distribution of muscle hypertrophy among hamstring muscle heads: Adding muscle volume where you need is not so simple.",
      authors: [
        "A Frouin",
        "G Le Sant",
        "L Barbier",
        "E Jacquemin",
        "P J McNair",
        "R Ellis",
        "A Nordez",
        "L Lacourpaille",
      ],
      journal: "Scandinavian journal of medicine & science in sports",
      year: "2024",
      volume: "34",
      issue: "3",
      pagesOrElocation: "e14608",
      doi: "10.1111/sms.14608",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/38515303/",
      pmcFullTextUrl: "",
      abstract:
        "The aim of this study was to determine whether a 9-week resistance training program based on high load (HL) versus low load combined with blood flow restriction (LL-BFR) induced a similar (i) distribution of muscle hypertrophy among hamstring heads (semimembranosus, SM; semitendinosus, ST; and biceps femoris long head, BF) and (ii) magnitude of tendon hypertrophy of ST, using a parallel randomized controlled trial.\n\nA total of 45 participants were randomly allocated to one of three groups: HL, LL-BFR, and control (CON). Both HL and LL-BFR performed a 9-week resistance training program composed of seated leg curl and stiff-leg deadlift exercises. Freehand 3D ultrasound was used to assess the changes in muscle and tendon volume.\n\nThe increase in ST volume was greater in HL (26.5 ± 25.5%) compared to CON (p = 0.004). No difference was found between CON and LL-BFR for the ST muscle volume (p = 0.627). The change in SM muscle volume was greater for LL-BFR (21.6 ± 27.8%) compared to CON (p = 0.025). No difference was found between HL and CON for the SM muscle volume (p = 0.178).There was no change in BF muscle volume in LL-BFR (14.0 ± 16.5%; p = 0.436) compared to CON group. No difference was found between HL and CON for the BF muscle volume (p = 1.0). Regarding ST tendon volume, we did not report an effect of training regimens (p = 0.411).\n\nThese results provide evidence that the HL program induced a selective hypertrophy of the ST while LL-BFR induced hypertrophy of SM. The magnitude of the selective hypertrophy observed within each group varied greatly between individuals. This finding suggests that it is very difficult to early determine the location of the hypertrophy among a muscle group.",
      publicationTypes: ["Randomized Controlled Trial", "Journal Article"],
      meshTerms: [
        "Humans",
        "Hamstring Muscles",
        "Muscle Strength",
        "Hypertrophy",
        "Tendons",
        "Resistance Training",
        "Regional Blood Flow",
        "Muscle, Skeletal",
      ],
      keywords: [
        "hamstring",
        "individual hypertrophy",
        "muscle volume",
        "resistance training",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "very_high",
      confidence: "high",
    },
    note: {
      entryNumber: 50,
      topic: "hamstrings_posterior_chain",
      suppliedUse: "individual response and regional hypertrophy.",
      studyDesignAndPopulation:
        "9-week parallel randomized controlled trial in 45 recreationally active young adults (36 completed).",
      interventionAndComparator:
        "High-load (12-RM) versus low-load (30-RM) with blood flow restriction (LL-BFR) using seated leg curl and stiff-leg deadlift.",
      primaryOutcomes: "",
      directResults:
        "HL induced selective semitendinosus hypertrophy (+26.5 ± 25.5%; p=0.004); LL-BFR induced selective semimembranosus hypertrophy (+21.6 ± 27.8%; p=0.025); no significant biceps femoris or semitendinosus tendon hypertrophy in either group.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Significant inter-individual variability in hypertrophy distribution and limited to recreationally active young adults.",
      evidenceTier: "very_high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "35162922",
      title:
        "An Electromyographic Analysis of Romanian, Step-Romanian, and Stiff-Leg Deadlift: Implication for Resistance Training.",
      authors: [
        "Giuseppe Coratella",
        "Gianpaolo Tornatore",
        "Stefano Longo",
        "Fabio Esposito",
        "Emiliano Cè",
      ],
      journal:
        "International journal of environmental research and public health",
      year: "2022",
      volume: "19",
      issue: "3",
      pagesOrElocation: "",
      doi: "10.3390/ijerph19031903",
      pmcid: "PMC8835508",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/35162922/",
      pmcFullTextUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8835508/",
      abstract:
        "The present study examined the posterior chain muscle excitation in different deadlift variations. Ten competitive bodybuilders (training seniority of 10.6 ± 1.8 years) performed the Romanian (RD), Romanian standing on a step (step-RD), and stiff-leg deadlift (SD) with an 80% 1-RM. The excitation of the gluteus maximus, gluteus medius, biceps femoris, semitendinosus, erector spinae longissimus, and iliocostalis was assessed during both the ascending and descending phases. During the ascending phase, the RMS of the gluteus maximus was greater in the step-RD than in the RD (effect size (ES): 1.70, 0.55/2.84) and SD (ES: 1.18, 0.11/2.24). Moreover, a greater RMS was found in the SD than in the RD (ES: 0.99, 0.04/1.95). The RMS of the semitendinosus was greater in the step-RD than in the RD (ES: 0.82, 0.20/1.44) and SD (ES: 3.13, 1.67/4.59). Moreover, a greater RMS was found in the RD than in the SD (ES: 1.38, 0.29/2.48). The RMS of the longissimus was greater in the step-RD than in the RD (ES: 2.12, 0.89/3.34) and SD (ES: 3.28, 1.78/4.78). The descending phase had fewer differences between the exercises. No further differences between the exercises were found. The step-RD increased the overall excitation of the posterior chain muscles, possibly because of the greater range of movement and posterior muscle elongation during the anterior flexion. Moreover, the RD appeared to target the semitendinosus more than the SD, while the latter excited the gluteus maximus more.",
      publicationTypes: ["Journal Article"],
      meshTerms: [
        "Electromyography",
        "Humans",
        "Leg",
        "Muscle, Skeletal",
        "Paraspinal Muscles",
        "Resistance Training",
        "Romania",
      ],
      keywords: [
        "electromyography",
        "erector spinae",
        "gluteus",
        "hamstrings",
        "muscle activation",
        "muscle excitation",
        "strength training",
        "weight training",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "FULL_TEXT_VERIFIED",
      evidenceTier: "moderate_low",
      confidence: "high",
    },
    note: {
      entryNumber: 51,
      topic: "hamstrings_posterior_chain",
      suppliedUse: "deadlift variant comparison.",
      studyDesignAndPopulation:
        "The study was a cross-over, repeated-measures, within-subject investigation involving 10 male competitive bodybuilders with a minimum of 5 years of competition experience.",
      interventionAndComparator:
        "Participants performed the Romanian deadlift (RD), step Romanian deadlift (step-RD on a 15 cm platform), and stiff-leg deadlift (SD) at 80% 1-RM.",
      primaryOutcomes:
        "The primary outcomes were surface electromyographic (sEMG) excitation (RMS) of the gluteus maximus, gluteus medius, biceps femoris, semitendinosus, erector spinae longissimus, and iliocostalis during the ascending and descending phases.",
      directResults:
        "The step-RD elicited significantly greater excitation in the gluteus maximus (ES: 1.70–2.16 vs RD; ES: 1.18–2.24 vs SD), semitendinosus (ES: 0.82–0.83 vs RD; ES: 1.50–3.13 vs SD), and erector spinae longissimus (ES: 2.12–3.28 vs RD/SD) during the ascending and/or descending phases. The SD showed greater gluteus maximus excitation than RD (ES: 0.99), while the RD showed greater semitendinosus excitation than SD (ES: 1.38) during the ascending phase. No significant differences were found for the gluteus medius, biceps femoris, or iliocostalis across the three deadlift variations.",
      implementationImplication:
        "Practitioners should consider incorporating a 15 cm step during Romanian deadlifts to maximize posterior chain muscle recruitment by increasing the range of motion and muscle elongation.",
      limitations:
        "The findings are limited by a small sample of 10 male competitive bodybuilders, the use of surface EMG as a proxy for recruitment rather than long-term hypertrophy, and the absence of kinematic or quadriceps data.",
      evidenceTier: "moderate_low",
      reviewStatus: "FULL_TEXT_VERIFIED",
      confidence: "high",
      noteSource: "PMC full-text sections retrieved through NCBI EFetch",
    },
  },
  {
    study: {
      pmid: "32107499",
      title:
        "Electromyographic activity in deadlift exercise and its variants. A systematic review.",
      authors: ["Isabel Martín-Fuentes", "José M Oliva-Lozano", "José M Muyor"],
      journal: "PloS one",
      year: "2020",
      volume: "15",
      issue: "2",
      pagesOrElocation: "e0229507",
      doi: "10.1371/journal.pone.0229507",
      pmcid: "PMC7046193",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/32107499/",
      pmcFullTextUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7046193/",
      abstract:
        'The main purpose of this review was to systematically analyze the literature concerning studies which have investigated muscle activation when performing the Deadlift exercise and its variants. This study was conducted according to the Preferred Reporting Items for Systematic Reviews and Meta-Analysis Statement (PRISMA). Original studies from inception until March 2019 were sourced from four electronic databases including PubMed, OVID, Scopus and Web of Science. Inclusion criteria were as follows: (a) a cross-sectional or longitudinal study design; (b) evaluation of neuromuscular activation during Deadlift exercise or variants; (c) inclusion of healthy and trained participants, with no injury issues at least for six months before measurements; and (d) analyzed "sEMG amplitude", "muscle activation" or "muscular activity" with surface electromyography (sEMG) devices. Major findings indicate that the biceps femoris is the most studied muscle, followed by gluteus maximus, vastus lateralis and erector spinae. Erector spinae and quadriceps muscles reported greater activation than gluteus maximus and biceps femoris muscles during Deadlift exercise and its variants. However, the Romanian Deadlift is associated with lower activation for erector spinae than for biceps femoris and semitendinosus. Deadlift also showed greater activation of the quadriceps muscles than the gluteus maximus and hamstring muscles. In general, semitendinosus muscle activation predominates over that of biceps femoris within hamstring muscles complex. In conclusion 1) Biceps femoris is the most evaluated muscle, followed by gluteus maximus, vastus lateralis and erector spinae during Deadlift exercises; 2) Erector spinae and quadriceps muscles are more activated than gluteus maximus and biceps femoris muscles within Deadlift exercises; 3) Within the hamstring muscles complex, semitendinosus elicits slightly greater muscle activation than biceps femoris during Deadlift exercises; and 4) A unified criterion upon methodology is necessary in order to report reliable outcomes when using surface electromyography recordings.',
      publicationTypes: [
        "Journal Article",
        "Research Support, Non-U.S. Gov't",
        "Systematic Review",
      ],
      meshTerms: [
        "Electromyography",
        "Exercise",
        "Female",
        "Humans",
        "Male",
        "Muscle Contraction",
        "Muscle Strength",
        "Muscle, Skeletal",
        "Resistance Training",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "FULL_TEXT_VERIFIED",
      evidenceTier: "review",
      confidence: "high",
    },
    note: {
      entryNumber: 52,
      topic: "hamstrings_posterior_chain",
      suppliedUse: "deadlift family muscle activation.",
      studyDesignAndPopulation:
        "Systematic review of 19 cross-sectional studies involving healthy, resistance-trained participants (n=8-34 per study, aged 18-34, minimum 6 months training experience).",
      interventionAndComparator:
        "Deadlift and its variants (e.g., Romanian, stiff-leg, hexagonal bar, fat gripz, elastic bands) compared to each other or other exercises (e.g., squats, hip thrusts, Nordic hamstring exercise, leg curls).",
      primaryOutcomes:
        "Muscle activation (sEMG amplitude) of the biceps femoris, gluteus maximus, erector spinae, and quadriceps.",
      directResults:
        "The systematic review of 19 studies found that the erector spinae and quadriceps generally exhibit higher sEMG activity than the gluteus maximus and hamstrings during deadlift exercises (reported in 9/19 studies). Within the hamstrings, the semitendinosus elicited slightly greater activation than the biceps femoris (6/19 studies). Conventional deadlifts elicited higher activation than variants using elastic bands for the gluteus maximus and hamstrings. Comparatively, hip thrusts and front/back squats produced higher gluteus maximus activation than deadlifts, while Nordic hamstring exercises and leg curls elicited higher biceps femoris activation than stiff-leg deadlifts. Using Fat Gripz implements significantly increased forearm activation but was associated with a significant reduction in 1RM strength.",
      implementationImplication:
        "Program deadlifts primarily for erector spinae and quadriceps recruitment, while utilizing targeted exercises like hip thrusts or leg curls for superior gluteus maximus and hamstring activation.",
      limitations:
        "The evidence is limited by heterogeneous sEMG methodology, a lack of female-only data (only 2/19 studies), and a reliance on cross-sectional recruitment data which does not confirm long-term adaptation.",
      evidenceTier: "review",
      reviewStatus: "FULL_TEXT_VERIFIED",
      confidence: "high",
      noteSource: "PMC full-text sections retrieved through NCBI EFetch",
    },
  },
  {
    study: {
      pmid: "30808663",
      title:
        "Including the Nordic hamstring exercise in injury prevention programmes halves the rate of hamstring injuries: a systematic review and meta-analysis of 8459 athletes.",
      authors: ["Nicol van Dyk", "Fearghal P Behan", "Rod Whiteley"],
      journal: "British journal of sports medicine",
      year: "2019",
      volume: "53",
      issue: "21",
      pagesOrElocation: "1362-1370",
      doi: "10.1136/bjsports-2018-100045",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/30808663/",
      pmcFullTextUrl: "",
      abstract:
        "Does the Nordic hamstring exercise (NHE) prevent hamstring injuries when included as part of an injury prevention intervention?\n\nSystematic review and meta-analysis.\n\nWe considered the population to be any athletes participating in any sporting activity, the intervention to be the NHE, the comparison to be usual training or other prevention programmes, which did not include the NHE, and the outcome to be the incidence or rate of hamstring injuries.\n\nThe effect of including the NHE in injury prevention programmes compared with controls on hamstring injuries was assessed in 15 studies that reported the incidence across different sports and age groups in both women and men.\n\nMEDLINE via PubMed, CINAHL via Ebsco, and OpenGrey.\n\nThere is a reduction in the overall injury risk ratio of 0.49 (95% CI 0.32 to 0.74, p=0.0008) in favour of programmes including the NHE. Secondary analyses when pooling the eight randomised control studies demonstrated a small increase in the overall injury risk ratio 0.52 (95% CI 0.32 to 0.85, p=0.0008), still in favour of the NHE. Additionally, when studies with a high risk of bias were removed (n=8), there is an increase of 0.06 in the risk ratio to 0.55 (95% CI 0.34 to 0.89, p=0.006).\n\nProgrammes that include the NHE reduce hamstring injuries by up to 51%. The NHE essentially halves the rate of hamstring injuries across multiple sports in different athletes.\n\nPROSPERO CRD42018106150.",
      publicationTypes: [
        "Journal Article",
        "Meta-Analysis",
        "Systematic Review",
      ],
      meshTerms: [
        "Athletes",
        "Athletic Injuries",
        "Hamstring Muscles",
        "Humans",
        "Leg Injuries",
        "Soft Tissue Injuries",
      ],
      keywords: [
        "hamstrings",
        "injury prevention",
        "intervention",
        "sports and exercise medicine",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "review",
      confidence: "high",
    },
    note: {
      entryNumber: 53,
      topic: "hamstrings_posterior_chain",
      suppliedUse: "Nordic injury prevention.",
      studyDesignAndPopulation:
        "Systematic review and meta-analysis of 15 studies (including 8 RCTs) involving 8,459 athletes across various sports and age groups.",
      interventionAndComparator:
        "Injury prevention programs including the Nordic hamstring exercise versus usual training or prevention programs without the exercise.",
      primaryOutcomes: "",
      directResults:
        "Programs including the Nordic hamstring exercise reduced the overall injury risk ratio by 51% (RR 0.49; 95% CI 0.32–0.74; p=0.0008); analysis of the 8 randomized controlled trials showed a risk reduction of 48% (RR 0.52; 95% CI 0.32–0.85).",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Inclusion of studies with a high risk of bias; removing these studies slightly increased the injury risk ratio to 0.55.",
      evidenceTier: "review",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "27752982",
      title:
        "Effect of Injury Prevention Programs that Include the Nordic Hamstring Exercise on Hamstring Injury Rates in Soccer Players: A Systematic Review and Meta-Analysis.",
      authors: [
        "Wesam Saleh A Al Attar",
        "Najeebullah Soomro",
        "Peter J Sinclair",
        "Evangelos Pappas",
        "Ross H Sanders",
      ],
      journal: "Sports medicine (Auckland, N.Z.)",
      year: "2017",
      volume: "47",
      issue: "5",
      pagesOrElocation: "907-916",
      doi: "10.1007/s40279-016-0638-2",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/27752982/",
      pmcFullTextUrl: "",
      abstract:
        "Hamstring injuries are among the most common non-contact injuries in sports. The Nordic hamstring (NH) exercise has been shown to decrease risk by increasing eccentric hamstring strength.\n\nThe purpose of this systematic review and meta-analysis was to investigate the effectiveness of the injury prevention programs that included the NH exercise on reducing hamstring injury rates while factoring in athlete workload.\n\nTwo researchers independently searched for eligible studies using the following databases: the Cochrane Central Register of Controlled Trials via OvidSP, AMED (Allied and Complementary Medicine) via OvidSP, EMBASE, PubMed, MEDLINE, SPORTDiscus, Web of Science, CINAHL and AusSportMed, from inception to December 2015. The keyword domains used during the search were Nordic, hamstring, injury prevention programs, sports and variations of these keywords. The initial search resulted in 3242 articles which were filtered to five articles that met the inclusion criteria. The main inclusion criteria were randomized controlled trials or interventional studies on use of an injury prevention program that included the NH exercise while the primary outcome was hamstring injury rate. Extracted data were subjected to meta-analysis using a random effects model.\n\nThe pooled results based on total injuries per 1000 h of exposure showed that programs that included the NH exercise had a statistically significant reduction in hamstring injury risk ratio [IRR] of 0.490 (95 % confidence interval [CI] 0.291-0.827, p = 0.008). Teams using injury prevention programs that included the NH exercise reduced hamstring injury rates up to 51 % in the long term compared with the teams that did not use any injury prevention measures.\n\nThis systematic review and meta-analysis demonstrates that injury prevention programs that include NH exercises decrease the risk of hamstring injuries among soccer players. A protocol was registered in the International Prospective Register of Systematic Reviews, PROSPERO (CRD42015019912).",
      publicationTypes: [
        "Journal Article",
        "Meta-Analysis",
        "Systematic Review",
      ],
      meshTerms: [
        "Athletic Injuries",
        "Exercise",
        "Exercise Therapy",
        "Humans",
        "Leg Injuries",
        "Muscle, Skeletal",
        "Soccer",
        "Soft Tissue Injuries",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "review",
      confidence: "high",
    },
    note: {
      entryNumber: 54,
      topic: "hamstrings_posterior_chain",
      suppliedUse: "soccer-specific hamstring injury reduction.",
      studyDesignAndPopulation:
        "Systematic review and meta-analysis of 5 randomized controlled trials and interventional studies involving soccer players.",
      interventionAndComparator:
        "Injury prevention programs incorporating the Nordic hamstring exercise compared to no injury prevention measures.",
      primaryOutcomes: "",
      directResults:
        "Inclusion of the Nordic hamstring exercise significantly reduced the risk of hamstring injuries (IRR 0.490; 95% CI 0.291–0.827; p = 0.008); teams using these programs saw a reduction in injury rates of up to 51% in the long term.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Meta-analysis based on a small number of studies (n=5); results are specific to soccer players and may not generalize to other athletic populations.",
      evidenceTier: "review",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "39120165",
      title:
        "The Effects of Nordic Hamstring Exercise on Performance and Injury in the Lower Extremities: An Umbrella Review.",
      authors: [
        "Hugo Nunes",
        "Luís Gonçalves Fernandes",
        "Pedro Nunes Martins",
        "Ricardo Maia Ferreira",
      ],
      journal: "Healthcare (Basel, Switzerland)",
      year: "2024",
      volume: "12",
      issue: "15",
      pagesOrElocation: "",
      doi: "10.3390/healthcare12151462",
      pmcid: "PMC11311354",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/39120165/",
      pmcFullTextUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11311354/",
      abstract:
        "Due to their potential positive outcomes, hamstring eccentric exercises are becoming increasingly popular in training regimens. Among the various exercises, the Nordic Hamstring Exercise (NHE) is the most common. Despite its popularity, there are still some doubts about its benefits and risks. So, the aim of this umbrella review was to summarize the effects of NHE on performance and injury prevention. Following the PRISMA guidelines, a comprehensive literature search was conducted across multiple e-databases, according to the P (injured and non-injured athletes or recreationally active or healthy individuals) I (NHE) C (no intervention, placebo, or other interventions) O (performance or injury) S (systematic reviews) model. The quality of the studies was accessed with the AMSTAR-2. From the 916 systematic reviews found, only 10 could be included. They encompassed 125 studies, enrolling 17,260 subjects. The results from the studies indicate that NHE interventions demonstrated positive effects on sprint performance, muscle activation, eccentric strength, and muscle architecture (fascicle length, muscle thickness, and pennation angle). Furthermore, NHE is effective in preventing hamstring injuries (up to 51%). In conclusion, NHE should be integrated in training (especially, in the warm-up phase) for both enhancing athletic performance and preventing hamstring injuries. For achieving more positive results, it is recommended that high-volume is followed by low-volume maintenance, targeting 48 reps/week.",
      publicationTypes: ["Journal Article", "Review"],
      meshTerms: [],
      keywords: ["injury", "nordic hamstrings", "performance"],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "FULL_TEXT_VERIFIED",
      evidenceTier: "review",
      confidence: "high",
    },
    note: {
      entryNumber: 55,
      topic: "hamstrings_posterior_chain",
      suppliedUse: "Nordic training outcomes.",
      studyDesignAndPopulation:
        "Umbrella review of 10 systematic reviews encompassing 125 studies and 17,260 predominantly male athletes and recreationally active individuals (ages 10–40), primarily soccer players.",
      interventionAndComparator:
        "Nordic Hamstring Exercise (NHE) protocols, typically 2–3 sets of 6–12 repetitions performed 1–3 times per week, compared to standard training or warm-up routines without NHE.",
      primaryOutcomes:
        "Hamstring injury frequency, knee flexor eccentric strength, and muscle architecture adaptations including fascicle length and pennation angle.",
      directResults:
        "The inclusion of Nordic Hamstring Exercise (NHE) resulted in a significant reduction of hamstring injuries by up to 51% across various sports and competition levels. Knee flexor eccentric strength increased by 10–15% when measured via isokinetic dynamometry and 16–26% when using NHE-specific devices. Muscle architecture adaptations were observed, specifically an increase in biceps femoris long head fascicle length; an 11% increase in fascicle length was associated with a 21% reduction in injury probability. Low-volume protocols (approx. 31 repetitions per week) were found to be as effective as higher volumes for increasing fascicle length, though higher volumes generally yielded greater strength adaptations.",
      implementationImplication:
        "Implement Nordic Hamstring Exercises at a minimum of one session per week (approx. 30–50 repetitions) to increase fascicle length and reduce hamstring injury risk, while managing volume to avoid excessive fatigue.",
      limitations:
        "The findings are limited by the critically low methodological quality of 60% of the included reviews, high protocol heterogeneity, and a sample population predominantly composed of young male athletes.",
      evidenceTier: "review",
      reviewStatus: "FULL_TEXT_VERIFIED",
      confidence: "high",
      noteSource: "PMC full-text sections retrieved through NCBI EFetch",
    },
  },
  {
    study: {
      pmid: "40276368",
      title:
        "The impact of resistance training on gluteus maximus hypertrophy: a systematic review and meta-analysis.",
      authors: [
        "Walter Krause Neto",
        "Thaís Lima Vieira Krause",
        "Eliane Florencio Gama",
      ],
      journal: "Frontiers in physiology",
      year: "2025",
      volume: "16",
      issue: "",
      pagesOrElocation: "1542334",
      doi: "10.3389/fphys.2025.1542334",
      pmcid: "PMC12018462",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/40276368/",
      pmcFullTextUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12018462/",
      abstract:
        "This systematic review aims to examine and synthesize the existing literature regarding gluteus maximus (GMax) hypertrophy as a result of dynamic exercises that incorporate hip extension with external resistance. A comprehensive search was undertaken across the following databases: PubMed/Medline, SportDiscuss, Scopus, Web of Science, CINAHL, Science Direct, Google Scholar, and ResearchGate. Twelve articles met the established inclusion criteria, leading to the subsequent key findings: 1) resistance training exhibits a moderate effect on GMax hypertrophy (11 studies, SMD 0.71, 95% CI [0.50, 0.91], p < 0.00001, I2 = 22%); 2) subgroup analyses of single (seven studies, SMD 0.74, 95% CI [0.36, 1.13], p = 0.0001, I2 = 52%) and combined (six studies, SMD 0.68, 95% CI [0.44, 0.92], p < 0.00001, I2 = 0%) training protocols have demonstrated moderate effects; 3) when emphasizing GMax hypertrophy at the expense of other muscle groups, single exercises, such as the barbell hip thrust, should be prioritized; 4) back squats performed in parallel or full range of motion significantly enhance GMax hypertrophy; 5) leg press machines and kneeling hip extensions can also facilitate increased GMax hypertrophy; 6) training programs that incorporate combined hip extension exercises, whether single-joint or multi-joint, significantly promote an increase in GMax hypertrophy. This study concludes that a variety of exercises-whether focused on a specific joint (single-joint) or encompassing multiple joints (multi-joint)-can effectively stimulate GMax hypertrophy, whether executed individually or in combination.",
      publicationTypes: ["Journal Article", "Systematic Review"],
      meshTerms: [],
      keywords: [
        "exercise",
        "hip",
        "muscle mass",
        "resistance training",
        "skeletal muscle",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "FULL_TEXT_VERIFIED",
      evidenceTier: "review",
      confidence: "high",
    },
    note: {
      entryNumber: 56,
      topic: "hamstrings_posterior_chain",
      suppliedUse: "glute hypertrophy evidence.",
      studyDesignAndPopulation:
        "Systematic review and meta-analysis of 12 studies involving 318 healthy participants (144 women, 174 men) aged 18-45 years, ranging from untrained to experienced status.",
      interventionAndComparator:
        "Resistance training protocols involving 11 traditional strength exercise variations, 10 bodyweight squat variations, and 2 jump variations compared to pre-intervention levels or alternative training modalities.",
      primaryOutcomes:
        "Gluteus maximus hypertrophy assessed via muscle thickness, muscle volume, or cross-sectional area using ultrasound or magnetic resonance imaging.",
      directResults:
        "Resistance training significantly increases gluteus maximus (GMax) hypertrophy with an overall standardized mean difference (SMD) of 0.71 (95% CI: 0.50 to 0.91; p < 0.00001; I2 = 22%). Gains were observed across all measurement modalities, including muscle volume, thickness, and cross-sectional area. Multi-joint exercises such as full range-of-motion (140° knee flexion) back squats and parallel squats were effective, while squats limited to 90° knee flexion were notably less effective. Single-joint exercises like the barbell hip thrust and kneeling hip extensions also demonstrated significant hypertrophic effects, with combinations of multi-joint and single-joint exercises potentially enhancing overall development.",
      implementationImplication:
        "Integrate a diverse range of resistance exercises, including full-range-of-motion squats and hip thrusts, to maximize gluteus maximus hypertrophy while individualizing movement depth and progression.",
      limitations:
        "Findings are limited by healthy adult populations (18-45 years), variations in diagnostic methods (ultrasound vs. MRI), inconsistent measurement sites, and incomplete reporting of randomization, blinding, and prior training history.",
      evidenceTier: "review",
      reviewStatus: "FULL_TEXT_VERIFIED",
      confidence: "high",
      noteSource: "PMC full-text sections retrieved through NCBI EFetch",
    },
  },
  {
    study: {
      pmid: "32132843",
      title:
        "Gluteus Maximus Activation during Common Strength and Hypertrophy Exercises: A Systematic Review.",
      authors: [
        "Walter Krause Neto",
        "Enrico Gori Soares",
        "Thais Lima Vieira",
        "Rodolfo Aguiar",
        "Thiago Andrade Chola",
        "Vinicius de Lima Sampaio",
        "Eliane Florencio Gama",
      ],
      journal: "Journal of sports science & medicine",
      year: "2020",
      volume: "19",
      issue: "1",
      pagesOrElocation: "195-203",
      doi: "",
      pmcid: "PMC7039033",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/32132843/",
      pmcFullTextUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7039033/",
      abstract:
        "The gluteus maximus (GMax) is one of the primary hip extensors. Several exercises have been performed by strength and conditioning practitioners aiming to increase GMax strength and size. This systematic review aimed to describe the GMax activation levels during strength exercises that incorporate hip extension and use of external load. A search of the current literature was performed using PubMed/Medline, SportDiscuss, Scopus, Google Scholar, and Science Direct electronic databases. Sixteen articles met the inclusion criteria and reported muscle activation levels as a percentage of a maximal voluntary isometric contraction (MVIC). The exercises classified as very high level of GMax activation (>60% MVIC) were step-up, lateral step-up, diagonal step-up, cross over step-up, hex bar deadlift, rotational barbell hip thrust, traditional barbell hip thrust, American barbell hip thrust, belt squat, split squat, in-line lunge, traditional lunge, pull barbell hip thrust, modified single-leg squat, conventional deadlift, and band hip thrust. We concluded that several exercises could induce very high levels of GMax activation. The step-up exercise and its variations present the highest levels of GMax activation followed by several loaded exercises and its variations, such as deadlifts, hip thrusts, lunges, and squats. The results of this systematic review may assist practitioners in selecting exercised for strengthening GMax.",
      publicationTypes: ["Journal Article", "Systematic Review"],
      meshTerms: [
        "Electromyography",
        "Humans",
        "Isometric Contraction",
        "Muscle Strength",
        "Muscle, Skeletal",
        "Resistance Training",
        "Weight Lifting",
      ],
      keywords: [
        "Skeletal muscle",
        "electromyography",
        "gluteus maximus",
        "strength training",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "review",
      confidence: "high",
    },
    note: {
      entryNumber: 57,
      topic: "hamstrings_posterior_chain",
      suppliedUse: "glute exercise comparison.",
      studyDesignAndPopulation:
        "Systematic review of 16 electromyographic (EMG) studies involving 231 participants (90 women, 141 men) to assess gluteus maximus activation during loaded strength exercises.",
      interventionAndComparator:
        "Various dynamic hip-extension exercises with external loads (e.g., step-ups, deadlifts, hip thrusts, squats, lunges) compared via surface electromyography (% MVIC).",
      primaryOutcomes: "",
      directResults:
        'Step-up and its variations elicited the highest activation (pooled average 125.09% MVIC, range 104.19–169.22%); other exercises achieving "very high" activation (>60% MVIC) included hex bar deadlift (88%), rotational hip thrust (86.18%), traditional hip thrust (82.37%), and belt squat (71.34%).',
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Findings are based on surface EMG, which does not directly measure hypertrophy or force; high heterogeneity in normalization methods, electrode placement, and loading protocols (40–100% 1RM) across included studies.",
      evidenceTier: "review",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "26491608",
      title:
        "AN EXAMINATION OF THE GLUTEAL MUSCLE ACTIVITY ASSOCIATED WITH DYNAMIC HIP ABDUCTION AND HIP EXTERNAL ROTATION EXERCISE: A SYSTEMATIC REVIEW.",
      authors: ["Paul Macadam", "John Cronin", "Bret Contreras"],
      journal: "International journal of sports physical therapy",
      year: "2015",
      volume: "10",
      issue: "5",
      pagesOrElocation: "573-91",
      doi: "",
      pmcid: "PMC4595911",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/26491608/",
      pmcFullTextUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4595911/",
      abstract:
        "A wide variety of hip abduction and hip external rotation exercises are used for training, both in athletic performance and in rehabilitation programming. Though several different exercises exist, a comprehensive understanding of which exercises best target the gluteus maximus (Gmax) and gluteus medius (Gmed) and the magnitude of muscular activation associated with each exercise is yet to be established.\n\nThe purpose of this systematic review was to quantify the electromyographic (EMG) activity of exercises that utilize the Gmax and Gmed muscles during hip abduction and hip external rotation.\n\nPubmed, Sports Discuss, Web of Science and Science Direct were searched using the Boolean phrases (gluteus medius OR gluteus maximus) AND (activity OR activation) AND (electromyography OR EMG) AND (hip abduction OR hip external rotation). A systematic approach was used to evaluate 575 articles. Articles that examined injury-free participants of any age, gender or activity level were included. No restrictions were imposed on publication date or publication status. Articles were excluded when not available in English, where studies did not normalize EMG activity to maximum voluntary isometric contraction (MVIC), where no hip abduction or external rotation motion occurred or where the motion was performed with high acceleration.\n\nTwenty-three studies met the inclusion criteria and were retained for analysis. The highest Gmax activity was elicited during the lateral step up, cross over step up and rotational single leg squat (ranging from 79 to 113 % MVIC). Gmed activity was highest during the side bridge with hip abduction, standing hip abduction with elastic resistance at the ankle and side lying hip abduction (ranging from 81 to 103 % MVIC).\n\nThe methodological approaches varied between studies, notably in the different positions used for obtaining MVIC, which could have dramatically impacted normalized levels of gluteal activation, while variation also occurred in exercise technique and/or equipment.\n\nThe findings from this review provide an indication for the amount of muscle activity generated by basic strengthening and rehabilitation exercises, which may assist practitioners in making decisions for Gmax and Gmed strengthening and injury rehabilitation programs.",
      publicationTypes: ["Journal Article"],
      meshTerms: [],
      keywords: [
        "EMG",
        "gluteal musculature",
        "hip strength",
        "rehabilitation",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "review",
      confidence: "high",
    },
    note: {
      entryNumber: 58,
      topic: "hamstrings_posterior_chain",
      suppliedUse: "glute med/min and hip rotation exercises.",
      studyDesignAndPopulation:
        "Systematic review of 23 electromyographic studies involving injury-free participants of various ages and activity levels.",
      interventionAndComparator:
        "Comparison of various dynamic hip abduction and external rotation exercises based on gluteus maximus and medius activation levels.",
      primaryOutcomes: "",
      directResults:
        "Highest gluteus maximus activity was elicited by lateral step up, cross over step up, and rotational single leg squat (79-113% MVIC); highest gluteus medius activity was elicited by side bridge with hip abduction, standing hip abduction with resistance, and side lying hip abduction (81-103% MVIC).",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Methodological heterogeneity in MVIC normalization and exercise technique across included studies; EMG activation does not directly measure hypertrophy or sport transfer.",
      evidenceTier: "review",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "35165946",
      title:
        "Partial range of motion and muscle hypertrophy: not all ROMs lead to Rome.",
      authors: [
        "Witalo Kassiano",
        "Bruna Costa",
        "João Pedro Nunes",
        "Alex S Ribeiro",
        "Brad J Schoenfeld",
        "Edilson S Cyrino",
      ],
      journal: "Scandinavian journal of medicine & science in sports",
      year: "2022",
      volume: "32",
      issue: "3",
      pagesOrElocation: "632-633",
      doi: "10.1111/sms.14121",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/35165946/",
      pmcFullTextUrl: "",
      abstract: "",
      publicationTypes: ["Letter"],
      meshTerms: [
        "Humans",
        "Hypertrophy",
        "Muscle Strength",
        "Muscle, Skeletal",
        "Muscles",
        "Range of Motion, Articular",
        "Resistance Training",
        "Rome",
      ],
      keywords: [
        "excursion",
        "length-tension relationship",
        "muscle length",
        "regional hypertrophy",
        "strength training",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "RECORD_ONLY",
      evidenceTier: "other",
      confidence: "low",
    },
    note: {
      entryNumber: 59,
      topic: "hamstrings_posterior_chain",
      suppliedUse: "ROM interpretation.",
      studyDesignAndPopulation: "",
      interventionAndComparator: "",
      primaryOutcomes: "",
      directResults:
        "No abstract was available in the verified PubMed record, so no analytical finding is stored for recommendation use.",
      implementationImplication:
        "Do not use this source to influence exercise recommendations until the original full text or an authoritative abstract is obtained and reviewed.",
      limitations:
        "Verified citation record only; no abstract or preserved full text was available in this evidence package.",
      evidenceTier: "other",
      reviewStatus: "RECORD_ONLY",
      confidence: "low",
      noteSource:
        "Original PubMed citation record verified; no abstract available",
    },
  },
  {
    study: {
      pmid: "40570881",
      title:
        "Does Muscle Length Influence Regional Hypertrophy? A Systematic Review and Meta-Analysis.",
      authors: [
        "Dorian Varovic",
        "Milo Wolf",
        "Brad J Schoenfeld",
        "James Steele",
        "Jozo Grgic",
        "Pavle Mikulic",
      ],
      journal: "International journal of sports medicine",
      year: "2025",
      volume: "46",
      issue: "14",
      pagesOrElocation: "1027-1036",
      doi: "10.1055/a-2615-4935",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/40570881/",
      pmcFullTextUrl: "",
      abstract:
        'The aim of this review was to examine how mean muscle length during resistance training (RT) influences regional muscle hypertrophy. Three databases were screened for relevant studies that manipulated muscle length through range of motion or exercise selection and evaluated regional muscle hypertrophy. Twelve studies conducted among young adults were included in the Bayesian meta-analysis. Standardized mean differences (SMDs) indicated trivial hypertrophic effects estimated with relatively high precision between proximal (25% muscle length; SMD: 0.05 [95% quantile interval {QI}:-0.07, 0.16]; exponentiated log-transformed response ratio [lnRR]: 0.57% [95% QI:-1.92%, 3.24%]), mid-belly (50% muscle length; SMD: 0.07 [95% QI:-0.02, 0.15]; exponentiated lnRR: 1.22% [95% QI:-0.77%, 3.22%]), and distal (75% muscle length; SMD: 0.09 [95% QI:-0.01, 0.19]; exponentiated lnRR: 1.88% [95% QI:-0.44%, 4.34%]) sites. The effects of RT at longer muscle lengths showed an increasing trend from proximal to distal sites. However, the percentage of posterior distributions falling within regions of practical equivalence was high across all sites. Our findings suggest that RT at both longer and shorter mean muscle lengths produces similar hypertrophic effects. Relatively small differences between "shorter" and "longer" mean muscle length (an average difference of 21.8% mean muscle length) between conditions/groups in the examined studies warrant caution when interpreting the findings.',
      publicationTypes: [
        "Journal Article",
        "Systematic Review",
        "Meta-Analysis",
      ],
      meshTerms: [
        "Humans",
        "Muscle, Skeletal",
        "Resistance Training",
        "Hypertrophy",
        "Bayes Theorem",
        "Range of Motion, Articular",
        "Young Adult",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "review",
      confidence: "high",
    },
    note: {
      entryNumber: 60,
      topic: "hamstrings_posterior_chain",
      suppliedUse: "regional hypertrophy and muscle length.",
      studyDesignAndPopulation:
        "Systematic review and Bayesian meta-analysis of 12 studies involving young adults.",
      interventionAndComparator:
        "Resistance training at longer mean muscle lengths versus shorter mean muscle lengths.",
      primaryOutcomes: "",
      directResults:
        "Trivial hypertrophic differences between proximal (SMD 0.05), mid-belly (SMD 0.07), and distal (SMD 0.09) sites; both longer and shorter mean muscle lengths produced similar regional hypertrophic effects.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Small average difference (21.8%) in mean muscle length between conditions across included studies; findings limited to young adults.",
      evidenceTier: "review",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "33555823",
      title:
        "Understanding Bench Press Biomechanics-The Necessity of Measuring Lateral Barbell Forces.",
      authors: [
        "Lasse Mausehund",
        "Amelie Werkhausen",
        "Julia Bartsch",
        "Tron Krosshaug",
      ],
      journal: "Journal of strength and conditioning research",
      year: "2022",
      volume: "36",
      issue: "10",
      pagesOrElocation: "2685-2695",
      doi: "10.1519/JSC.0000000000003948",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/33555823/",
      pmcFullTextUrl: "",
      abstract:
        "Mausehund, L, Werkhausen, A, Bartsch, J, and Krosshaug, T. Understanding bench press biomechanics-The necessity of measuring lateral barbell forces. J Strength Cond Res 36(10): 2685-2695, 2022-The purpose of this study was to advance the expertise of the bench press exercise by complementing electromyographic (EMG) with net joint moment (NJM) and strength normalized NJM (nNJM) measurements, thus establishing the magnitude of the elbow and shoulder muscular loads and efforts. Normalized NJMs were determined as the ratio of the bench press NJMs to the maximum NJMs produced during maximum voluntary isokinetic contractions. Furthermore, we wanted to assess how changes in grip width and elbow positioning affected elbow and shoulder NJMs and nNJMs, and muscle activity of the primary movers. Thirty-five strength-trained adults performed a 6-8 repetition maximum set of each bench press variation, while elbow and shoulder NJMs and EMG activity of 7 upper extremity muscles were recorded. The results show that all bench press variations achieved high elbow and shoulder muscular efforts. A decrease in grip width induced larger elbow NJMs, and larger EMG activity of the lateral head of the triceps brachii, anterior deltoid, and clavicular head of the pectoralis major ( p ≤ 0.05). An increase in grip width elicited larger shoulder NJMs and nNJMs, and larger EMG activity of the abdominal head of the pectoralis major ( p ≤ 0.05). In conclusion, all bench press variations may stimulate strength gains and hypertrophy of the elbow extensors and shoulder flexors and horizontal adductors. However, greater adaptations of the elbow extensors and shoulder flexors may be expected when selecting narrower grip widths, whereas wider grip widths may induce greater adaptations of the shoulder horizontal adductors.",
      publicationTypes: ["Journal Article"],
      meshTerms: [
        "Adult",
        "Arm",
        "Biomechanical Phenomena",
        "Electromyography",
        "Exercise Therapy",
        "Humans",
        "Muscle Strength",
        "Muscle, Skeletal",
        "Pectoralis Muscles",
        "Weight Lifting",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "high",
      confidence: "high",
    },
    note: {
      entryNumber: 61,
      topic: "pressing_bench_chest_triceps",
      suppliedUse: "bench-press joint moments and lateral force.",
      studyDesignAndPopulation:
        "Cross-sectional biomechanical analysis of 35 strength-trained adults performing 6-8 repetition maximum sets of bench press variations.",
      interventionAndComparator:
        "Bench press variations involving changes in grip width and elbow positioning.",
      primaryOutcomes: "",
      directResults:
        "Decreasing grip width increased elbow net joint moments and EMG activity in the triceps brachii lateral head, anterior deltoid, and clavicular pectoralis major; increasing grip width increased shoulder net joint moments and abdominal pectoralis major EMG activity.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Acute biomechanical study measuring joint kinetics and muscle activity; does not provide direct evidence for long-term hypertrophy or sport-specific performance transfer.",
      evidenceTier: "high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "33049982",
      title:
        "Effect of Five Bench Inclinations on the Electromyographic Activity of the Pectoralis Major, Anterior Deltoid, and Triceps Brachii during the Bench Press Exercise.",
      authors: [
        "David Rodríguez-Ridao",
        "José A Antequera-Vique",
        "Isabel Martín-Fuentes",
        "José M Muyor",
      ],
      journal:
        "International journal of environmental research and public health",
      year: "2020",
      volume: "17",
      issue: "19",
      pagesOrElocation: "",
      doi: "10.3390/ijerph17197339",
      pmcid: "PMC7579505",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/33049982/",
      pmcFullTextUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7579505/",
      abstract:
        "The bench press exercise is one of the most used for training and for evaluating upper-body strength. The aim of the current study was to evaluate the electromyographic (EMG) activity levels of the pectoralis major (PM) in its three portions (upper portion, PMUP, middle portion, PMMP, and lower portion, PMLP), the anterior deltoid (AD), and the triceps brachii (TB) medial head during the bench press exercise at five bench angles (0°, 15°, 30°, 45°, and 60°). Thirty trained adults participated in the study. The EMG activity of the muscles was recorded at the aforementioned inclinations at 60% of one-repetition maximum (1RM). The results showed that the maximal EMG activity for PMUP occurred at a bench inclination of 30°. PMMP and PMLP showed higher EMG activity at a 0° bench inclination. AD had the highest EMG activity at 60°. TB showed similar EMG activities at all bench inclinations. In conclusion, the horizontal bench press produces similar electromyographic activities for the pectoralis major and the anterior deltoid. An inclination of 30° produces greater activation of the upper portion of the pectoralis major. Inclinations greater than 45° produce significantly higher activation of the anterior deltoid and decrease the muscular performance of the pectoralis major.",
      publicationTypes: ["Journal Article", "Research Support, Non-U.S. Gov't"],
      meshTerms: [
        "Adult",
        "Arm",
        "Electromyography",
        "Humans",
        "Muscle Strength",
        "Muscle, Skeletal",
        "Pectoralis Muscles",
        "Weight Lifting",
      ],
      keywords: [
        "EMG",
        "chest press",
        "fitness",
        "muscle activity",
        "resistance exercise",
        "strength",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "FULL_TEXT_VERIFIED",
      evidenceTier: "moderate_low",
      confidence: "high",
    },
    note: {
      entryNumber: 62,
      topic: "pressing_bench_chest_triceps",
      suppliedUse: "bench angle.",
      studyDesignAndPopulation:
        "Randomized, counterbalanced, repeated measures study involving 30 healthy, resistance-trained adults (minimum 1 year experience, performing ≥3 sessions per week).",
      interventionAndComparator:
        "Free-weight barbell bench press performed at five inclinations (0°, 15°, 30°, 45°, and 60°) using a load of 60% 1RM.",
      primaryOutcomes:
        "Surface electromyographic (EMG) activity normalized to maximal voluntary isometric contraction (% MVIC) for the pectoralis major (upper, middle, and lower portions), anterior deltoid, and triceps brachii medial head.",
      directResults:
        "At 0°, activation was similar across all pectoralis major portions (~27% MVIC) and the anterior deltoid (~26% MVIC). The upper pectoralis major (PMUP) reached peak activation at 30° (~30% MVIC), where it was significantly higher than the middle and lower portions (p ≤ 0.01), though the increase from 0° was not statistically significant (p > 0.05). At 45° and 60°, the anterior deltoid showed the highest activation (~33% MVIC), significantly exceeding all other muscles (p ≤ 0.001). Triceps brachii activation remained stable at approximately 15% MVIC across all angles (p > 0.05).",
      implementationImplication:
        "Utilize a 30° bench inclination to maximize upper pectoralis major recruitment, but avoid exceeding 30° if the goal is to maintain pectoralis major contribution rather than shifting the primary load to the anterior deltoids.",
      limitations:
        "The study is limited by its reliance on surface EMG for recruitment proxy, a specific 60% 1RM load, a young trained population, and the measurement of only the medial head of the triceps.",
      evidenceTier: "moderate_low",
      reviewStatus: "FULL_TEXT_VERIFIED",
      confidence: "high",
      noteSource: "PMC full-text sections retrieved through NCBI EFetch",
    },
  },
  {
    study: {
      pmid: "34644424",
      title:
        "Non-uniform excitation of the pectoralis major muscle during flat and inclined bench press exercises.",
      authors: [
        "Hélio V Cabral",
        "Leonardo M L de Souza",
        "Liliam F de Oliveira",
        "Taian M Vieira",
      ],
      journal: "Scandinavian journal of medicine & science in sports",
      year: "2022",
      volume: "32",
      issue: "2",
      pagesOrElocation: "381-390",
      doi: "10.1111/sms.14082",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/34644424/",
      pmcFullTextUrl: "",
      abstract:
        "Non-physiological sources may lead to equivocal interpretation on the degree of muscle excitation from electromyograms (EMGs) amplitude. This presumably explains the contradictory findings regarding the effect of the bench press inclination on the pectoralis major (PM) activation pattern. To contend with these issues, herein we used high-density surface EMG to investigate whether different PM regions are excited during the flat and 45° inclined bench press exercises. Single-differential EMGs were collected from 15 regions along the PM cranio-caudal axis, while 8 volunteers performed a set of the flat and 45° inclined bench press at 50% and 70% of 1 repetition maximum. The coefficient of variation, the range of motion, and the cycle duration were calculated from the barbell vertical position to assess the within-subject consistency across cycles. The number of channels detecting the largest EMGs amplitude (active channels), their interquartile range, and their barycentre coordinate were assessed to characterize the EMG amplitude distribution within PM. No significant differences in the range of motion (p > 0.11), cycle duration (p > 0.28), number of active channels (p > 0.05), and interquartile range of active channels (p > 0.39) were observed between the two bench press inclinations. Conversely, the barycentre shifted toward the PM clavicular region (p < 0.001) when the bench press changed from flat to 45°. Our results revealed that greatest EMG amplitudes were concentrated at the PM sternocostal and clavicular heads when exercising in the flat and 45° inclined bench press, respectively. Performing the bench press exercise, with different postures, seem to demand the excitation of different PM regions.",
      publicationTypes: ["Journal Article"],
      meshTerms: [
        "Electromyography",
        "Exercise",
        "Humans",
        "Muscle Strength",
        "Muscle, Skeletal",
        "Pectoralis Muscles",
        "Resistance Training",
        "Weight Lifting",
      ],
      keywords: [
        "bench press variations",
        "dynamic contractions",
        "electromyography",
        "high-density surface electromyography",
        "resistance training",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "moderate",
      confidence: "high",
    },
    note: {
      entryNumber: 63,
      topic: "pressing_bench_chest_triceps",
      suppliedUse: "regional pec excitation.",
      studyDesignAndPopulation:
        "Acute cross-over study involving 8 volunteers performing bench press variations.",
      interventionAndComparator:
        "Flat bench press versus 45° inclined bench press at 50% and 70% of 1 repetition maximum.",
      primaryOutcomes: "",
      directResults:
        "The EMG barycentre shifted significantly toward the pectoralis major clavicular region (p < 0.001) when changing from flat to 45° incline; peak EMG amplitudes were concentrated in the sternocostal head during flat bench and the clavicular head during 45° incline; no significant differences were observed in range of motion or cycle duration between inclinations.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Acute EMG-based study in a small sample (n=8) provides no direct evidence for longitudinal hypertrophy or force production.",
      evidenceTier: "moderate",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "28713459",
      title:
        "The Effects of Bench Press Variations in Competitive Athletes on Muscle Activity and Performance.",
      authors: [
        "Atle Hole Saeterbakken",
        "Dag-André Mo",
        "Suzanne Scott",
        "Vidar Andersen",
      ],
      journal: "Journal of human kinetics",
      year: "2017",
      volume: "57",
      issue: "",
      pagesOrElocation: "61-71",
      doi: "10.1515/hukin-2017-0047",
      pmcid: "PMC5504579",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/28713459/",
      pmcFullTextUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5504579/",
      abstract:
        "The aim of the study was to compare the EMG activity performing 6RM competition style bench press (flat bench-wide grip) with 1) medium and narrow grip widths on a flat bench and 1) inclined and declined bench positions with a wide grip. Twelve bench press athletes competing at national and international level participated in the study. EMG activity was measured in the pectoralis major, anterior and posterior deltoid, biceps brachii, triceps brachii and latissimus dorsi. Non-significant differences in activation were observed between the three bench positions with the exception of 58.5-62.6% lower triceps brachii activation, but 48.3-68.7% greater biceps brachii activation in the inclined bench compared with the flat and declined bench position. Comparing the three grip widths, non-significant differences in activations were observed, with the exception of 25.9-30.5% lower EMG activity in the biceps brachii using a narrow grip, compared to the medium and wide grip conditions. The 6-RM loads were 5.8-11.1% greater using a medium and wide grip compared to narrow grip width and 18.5-21.5% lower in the inclined bench position compared with flat and declined. Comparing the EMG activity during the competition bench press style with either the inclined and declined bench position (wide grip) or using a narrow and medium grip (flat bench), only resulted in different EMG activity in the biceps- and triceps brachii. The 6RM loads varied with each bench press variation and we recommend the use of a wide grip on a flat bench during high load hypertrophy training to bench press athletes.",
      publicationTypes: ["Journal Article"],
      meshTerms: [],
      keywords: ["Resistance", "performance", "strength", "training"],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "FULL_TEXT_VERIFIED",
      evidenceTier: "high",
      confidence: "high",
    },
    note: {
      entryNumber: 64,
      topic: "pressing_bench_chest_triceps",
      suppliedUse: "bench variations.",
      studyDesignAndPopulation:
        "Within-participants crossover design involving 12 national and international level competitive bench press athletes (mean age 34.3 ± 14.1 years).",
      interventionAndComparator:
        "The study compared 6-RM bench press performance and muscle activity across three bench angles (+25º incline, -25º decline, and flat) and three grip widths (wide, medium, and narrow).",
      primaryOutcomes:
        "The primary outcomes were 6-RM load capacity and surface EMG activity of the pectoralis major, triceps brachii, anterior deltoid, posterior deltoid, biceps brachii, and latissimus dorsi.",
      directResults:
        "In competitive bench press athletes, 6-RM loads were significantly lower in the incline position (109.2 ± 11.1 kg) compared to flat (132.7 ± 17.1 kg, -21.5%) and decline (129.4 ± 13.7 kg, -18.5%) positions. Wide grip 6-RM (132.7 ± 17.0 kg) was 5.8% and 11.1% greater than medium (125.4 ± 17.4 kg) and narrow (119.2 ± 16.6 kg) grips, respectively. Despite these load differences, pectoralis major and anterior deltoid activation remained similar across all bench angles and grip widths, though the incline position showed 25.7% higher anterior deltoid activity than the decline. The incline bench significantly reduced triceps brachii activity (58.5-62.6% lower) while increasing biceps brachii activity (48.3-68.7% higher) compared to flat and decline positions. Narrow grip width resulted in 25.9-30.5% lower biceps activation than wider grips.",
      implementationImplication:
        "Bench press variations can be used to maintain prime mover activation while reducing absolute joint loading or shifting accessory muscle recruitment, which may assist in managing training volume or rehabilitation.",
      limitations:
        "The findings are limited by a small sample of 12 elite athletes, the use of non-normalized surface EMG, and a lack of longitudinal data on hypertrophy or sport transfer.",
      evidenceTier: "high",
      reviewStatus: "FULL_TEXT_VERIFIED",
      confidence: "high",
      noteSource: "PMC full-text sections retrieved through NCBI EFetch",
    },
  },
  {
    study: {
      pmid: "25799093",
      title:
        "Influence of bench angle on upper extremity muscular activation during bench press exercise.",
      authors: ["Jakob D Lauver", "Trent E Cayot", "Barry W Scheuermann"],
      journal: "European journal of sport science",
      year: "2016",
      volume: "16",
      issue: "3",
      pagesOrElocation: "309-16",
      doi: "10.1080/17461391.2015.1022605",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/25799093/",
      pmcFullTextUrl: "",
      abstract:
        "This study compared the muscular activation of the pectoralis major, anterior deltoid and triceps brachii during a free-weight barbell bench press performed at 0°, 30°, 45° and -15° bench angles. Fourteen healthy resistance trained males (age 21.4 ± 0.4 years) participated in this study. One set of six repetitions for each bench press conditions at 65% one repetition maximum were performed. Surface electromyography (sEMG) was utilised to examine the muscular activation of the selected muscles during the eccentric and concentric phases. In addition, each phase was subdivided into 25% contraction durations, resulting in four separate time points for comparison between bench conditions. The sEMG of upper pectoralis displayed no difference during any of the bench conditions when examining the complete concentric contraction, however differences during 26-50% contraction duration were found for both the 30° [122.5 ± 10.1% maximal voluntary isometric contraction (MVIC)] and 45° (124 ± 9.1% MVIC) bench condition, resulting in greater sEMG compared to horizontal (98.2 ± 5.4% MVIC) and -15 (96.1 ± 5.5% MVIC). The sEMG of lower pectoralis was greater during -15° (100.4 ± 5.7% MVIC), 30° (86.6 ± 4.8% MVIC) and horizontal (100.1 ± 5.2% MVIC) bench conditions compared to the 45° (71.9 ± 4.5% MVIC) for the whole concentric contraction. The results of this study support the use of a horizontal bench to achieve muscular activation of both the upper and lower heads of the pectoralis. However, a bench incline angle of 30° or 45° resulted in greater muscular activation during certain time points, suggesting that it is important to consider how muscular activation is affected at various time points when selecting bench press exercises.",
      publicationTypes: ["Comparative Study", "Journal Article"],
      meshTerms: [
        "Biomechanical Phenomena",
        "Deltoid Muscle",
        "Electromyography",
        "Humans",
        "Isometric Contraction",
        "Male",
        "Muscle, Skeletal",
        "Pectoralis Muscles",
        "Upper Extremity",
        "Weight Lifting",
        "Young Adult",
      ],
      keywords: [
        "Resistance training",
        "electromyography",
        "muscular activation",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "moderate_low",
      confidence: "high",
    },
    note: {
      entryNumber: 65,
      topic: "pressing_bench_chest_triceps",
      suppliedUse: "incline effects on pec/delt/triceps.",
      studyDesignAndPopulation:
        "Comparative study involving 14 healthy resistance-trained males (age 21.4 ± 0.4 years).",
      interventionAndComparator:
        "Free-weight barbell bench press performed at four different bench angles: 0°, 30°, 45°, and -15°.",
      primaryOutcomes: "",
      directResults:
        "Upper pectoralis activation was significantly higher at 30° (122.5% MVIC) and 45° (124% MVIC) during the 26-50% duration compared to 0° and -15°; lower pectoralis activation was significantly lower at 45° (71.9% MVIC) compared to 0°, 30°, and -15° for the whole concentric contraction.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Acute surface EMG measurements at a submaximal load (65% 1RM); results do not directly demonstrate longitudinal hypertrophy or performance transfer.",
      evidenceTier: "moderate_low",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "36334406",
      title:
        "Non-uniform excitation of pectoralis major induced by changes in bench press inclination leads to uneven variations in the cross-sectional area measured by panoramic ultrasonography.",
      authors: [
        "José Carlos Dos Santos Albarello",
        "Hélio V Cabral",
        "Bruno Felipe Mendonça Leitão",
        "Gustavo Henrique Halmenschlager",
        "Tea Lulic-Kuryllo",
        "Thiago Torres da Matta",
      ],
      journal:
        "Journal of electromyography and kinesiology : official journal of the International Society of Electrophysiological Kinesiology",
      year: "2022",
      volume: "67",
      issue: "",
      pagesOrElocation: "102722",
      doi: "10.1016/j.jelekin.2022.102722",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/36334406/",
      pmcFullTextUrl: "",
      abstract:
        "This study combined surface electromyography with panoramic ultrasound imaging to investigate whether non-uniform excitation could lead to acute localized variations in cross-sectional area and muscle thickness of the clavicular and sternocostal heads of pectoralis major (PM). Bipolar surface electromyograms (EMGs) were acquired from both PM heads, while 13 men performed four sets of the flat and 45° inclined bench press exercises. Before and immediately after exercise, panoramic ultrasound images were collected transversely to the fibers. Normalized root mean square (RMS) amplitude and variations in the cross-sectional area and muscle thickness were calculated separately for each PM head. For all sets of the inclined bench press, the normalized RMS amplitude was greater for the clavicular head than the sternocostal head (P < 0.001), and the opposite was observed during the flat bench press (P < 0.001). Similarly, while greater increases in cross-sectional area were observed in the clavicular than in the sternocostal head after the inclined bench press (P < 0.001), greater increases were quantified in the sternocostal than in the clavicular head after the flat bench press exercise (P = 0.046). Therefore, our results suggest that the PM regional excitation induced by changes in bench press inclination leads to acute, uneven responses of muscle architecture following the exercise.",
      publicationTypes: ["Journal Article"],
      meshTerms: [
        "Male",
        "Humans",
        "Pectoralis Muscles",
        "Muscle, Skeletal",
        "Electromyography",
        "Exercise Therapy",
        "Ultrasonography",
        "Resistance Training",
        "Weight Lifting",
        "Muscle Strength",
      ],
      keywords: [
        "Chest press variations",
        "Muscle architecture",
        "Resistance training",
        "Surface electromyography",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "moderate_low",
      confidence: "high",
    },
    note: {
      entryNumber: 66,
      topic: "pressing_bench_chest_triceps",
      suppliedUse:
        "regional activation linked with regional structural adaptation.",
      studyDesignAndPopulation:
        "Acute within-subject crossover study involving 13 men.",
      interventionAndComparator:
        "Four sets of 45° inclined bench press versus flat bench press.",
      primaryOutcomes: "",
      directResults:
        "Inclined bench press resulted in significantly greater clavicular head excitation (P < 0.001) and acute cross-sectional area increase (P < 0.001) than the sternocostal head; flat bench press resulted in significantly greater sternocostal head excitation (P < 0.001) and acute cross-sectional area increase (P = 0.046) than the clavicular head.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Acute localized increases in cross-sectional area and thickness likely reflect transient edema rather than longitudinal hypertrophy; small sample size of 13 men.",
      evidenceTier: "moderate_low",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "20512064",
      title:
        "An electromyography analysis of 3 muscles surrounding the shoulder joint during the performance of a chest press exercise at several angles.",
      authors: ["Arthur A Trebs", "Jason P Brandenburg", "William A Pitney"],
      journal: "Journal of strength and conditioning research",
      year: "2010",
      volume: "24",
      issue: "7",
      pagesOrElocation: "1925-30",
      doi: "10.1519/JSC.0b013e3181ddfae7",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/20512064/",
      pmcFullTextUrl: "",
      abstract:
        "This study compared the activation of the clavicular head and the sternocostal head of the pectoralis major and the anterior deltoid when performing the bench press at several different angles. Fifteen healthy male subjects participated in this study. Subjects performed the chest press exercise at 0 (flat bench), 28, 44, and 56 degrees above horizontal using 70% of their respective 1 repetition maximum for each angle. Electromyographic activity was recorded during each repetition. Activation of the clavicular head of the pectoralis major was significantly greater at 44 degrees compared to 0 degrees (p = 0.010), at 56 degrees compared to 0 degrees (p = 0.013), and at 44 degrees compared to 28 degrees (p = 0.003). Activation of the sternocostal head of the pectoralis major was significantly greater at 0 degrees compared to 28 degrees (p = 0.013), at 0 degrees compared to 44 degrees (p = 0.018), at 0 degrees compared to 56 degrees (p = 0.001), at 28 degrees compared to 56 degrees (p = 0.003), and at 44 degrees compared to 56 degrees (p = 0.001). Activation of the anterior deltoid was significantly greater at 28 degrees compared to 0 degrees (p = 0.002), at 44 degrees compared to 0 degrees (p = 0.012), and at 56 degrees compared to 0 degrees (p = 0.014). To optimize recruiting the involved musculature, it would seem that performing both the flat and incline chest press exercises is necessary.",
      publicationTypes: ["Journal Article", "Randomized Controlled Trial"],
      meshTerms: [
        "Adult",
        "Athletic Performance",
        "Clavicle",
        "Electromyography",
        "Exercise",
        "Humans",
        "Male",
        "Pectoralis Muscles",
        "Resistance Training",
        "Shoulder Joint",
        "Weight Lifting",
        "Young Adult",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "moderate_low",
      confidence: "high",
    },
    note: {
      entryNumber: 67,
      topic: "pressing_bench_chest_triceps",
      suppliedUse: "press angle and shoulder musculature.",
      studyDesignAndPopulation:
        "Randomized controlled trial involving 15 healthy male subjects performing chest press at 70% 1RM.",
      interventionAndComparator:
        "Chest press exercise performed at four bench angles (0, 28, 44, and 56 degrees above horizontal).",
      primaryOutcomes: "",
      directResults:
        "Clavicular pectoralis major activation was significantly greater at 44° and 56° compared to 0°, and at 44° compared to 28°; sternocostal activation was highest at 0° and decreased as incline increased; anterior deltoid activation was significantly higher at all incline angles (28°, 44°, 56°) compared to 0°.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Acute surface EMG study in a small sample of 15 healthy males; does not directly measure hypertrophy or long-term performance adaptations.",
      evidenceTier: "moderate_low",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "28170449",
      title:
        "A systematic review of surface electromyography analyses of the bench press movement task.",
      authors: [
        "Petr Stastny",
        "Artur Gołaś",
        "Dusan Blazek",
        "Adam Maszczyk",
        "Michał Wilk",
        "Przemysław Pietraszewski",
        "Miroslav Petr",
        "Petr Uhlir",
        "Adam Zając",
      ],
      journal: "PloS one",
      year: "2017",
      volume: "12",
      issue: "2",
      pagesOrElocation: "e0171632",
      doi: "10.1371/journal.pone.0171632",
      pmcid: "PMC5295722",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/28170449/",
      pmcFullTextUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5295722/",
      abstract:
        "The bench press exercise (BP) plays an important role in recreational and professional training, in which muscle activity is an important multifactorial phenomenon. The objective of this paper is to systematically review electromyography (EMG) studies performed on the barbell BP exercise to answer the following research questions: Which muscles show the greatest activity during the flat BP? Which changes in muscle activity are related to specific conditions under which the BP movement is performed?\n\nPubMed, Scopus, Web of Science and Cochrane Central Register of Controlled Trials (CENTRAL) in the Cochrane Library were searched through June 10, 2016. A combination of the following search terms was used: bench press, chest press, board press, test, measure, assessment, dynamometer, kinematics and biomechanics. Only original, full-text articles were considered.\n\nThe search process resulted in 14 relevant studies that were included in the discussion. The triceps brachii (TB) and pectoralis major (PM) muscles were found to have similar activity during the BP, which was significantly higher than the activity of the anterior deltoid. During the BP movement, muscle activity changes with exercise intensity, velocity of movement, fatigue, mental focus, movement phase and stability conditions, such as bar vibration or unstable surfaces. Under these circumstances, TB is the most common object of activity change.\n\nPM and TB EMG activity is more dominant and shows greater EMG amplitude than anterior deltoid during the BP. There are six factors that can influence muscle activity during the BP; however, the most important factor is exercise intensity, which interacts with all other factors. The research on muscle activity in the BP has several unresolved areas, such as clearly and strongly defined guidelines to perform EMG measurements (e.g., how to elaborate with surface EMG limits) or guidelines for the use of exact muscle models.",
      publicationTypes: ["Journal Article", "Systematic Review"],
      meshTerms: [
        "Electromyography",
        "Exercise",
        "Humans",
        "Muscle Contraction",
        "Muscle, Skeletal",
        "Psychomotor Performance",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "FULL_TEXT_VERIFIED",
      evidenceTier: "review",
      confidence: "high",
    },
    note: {
      entryNumber: 68,
      topic: "pressing_bench_chest_triceps",
      suppliedUse: "bench-press EMG evidence.",
      studyDesignAndPopulation:
        "Systematic review of 14 studies involving resistance-trained males (minimum 6 months experience) performing flat bench press tasks.",
      interventionAndComparator:
        "Analysis of EMG activity across variations in exercise intensity (20–110% 1RM), movement velocity, fatigue, mental focus, movement phase, and surface stability.",
      primaryOutcomes:
        "Surface EMG amplitude and frequency of the pectoralis major, triceps brachii, and anterior deltoid.",
      directResults:
        "The pectoralis major (PM) and triceps brachii (TB) exhibit similar EMG activity levels, which are significantly higher than those of the anterior deltoid (AD). Exercise intensity is the primary factor influencing muscle activation; increasing loads beyond 80% 1RM significantly increases PM, TB, and AD amplitudes, often exceeding 100% MVIC. The TB is the most sensitive muscle to changes in exercise conditions, with its activity increasing continuously throughout the concentric phase and during the sticking region. Mental focus cues effectively increase PM and TB activity at submaximal loads (20–60% 1RM), though this effect is largely lost at 80% 1RM. Stability conditions like bar vibration increase activity across all three muscles, but unstable surfaces primarily increase trunk stabilizer activation rather than prime mover amplitude.",
      implementationImplication:
        "Prioritize high-intensity loading (>80% 1RM) for maximal prime mover recruitment and utilize mental focus cues during submaximal training (20–60% 1RM) to enhance muscle-specific activation.",
      limitations:
        "Findings are limited to resistance-trained young males and are subject to surface EMG technical limitations such as electrode shift and lack of standardized muscle subdivision reporting.",
      evidenceTier: "review",
      reviewStatus: "FULL_TEXT_VERIFIED",
      confidence: "high",
      noteSource: "PMC full-text sections retrieved through NCBI EFetch",
    },
  },
  {
    study: {
      pmid: "26540024",
      title:
        "Bench Press Upper-Body Muscle Activation Between Stable and Unstable Loads.",
      authors: [
        "Dustin D Dunnick",
        "Lee E Brown",
        "Jared W Coburn",
        "Scott K Lynn",
        "Saldiam R Barillas",
      ],
      journal: "Journal of strength and conditioning research",
      year: "2015",
      volume: "29",
      issue: "12",
      pagesOrElocation: "3279-83",
      doi: "10.1519/JSC.0000000000001198",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/26540024/",
      pmcFullTextUrl: "",
      abstract:
        "The bench press is one of the most commonly used upper-body exercises in training and is performed with many different variations, including unstable loads (ULs). Although there is much research on use of an unstable surface, there is little to none on the use of an UL. The purpose of this study was to investigate muscle activation during the bench press while using a stable load (SL) vs. UL. Twenty resistance-trained men (age = 24.1 ± 2 years; ht = 177.5 ± 5.8 cm; mass = 88.7 ± 13.7 kg) completed 2 experimental conditions (SL and UL) at 2 different intensities (60 and 80% one repetition maximum). Unstable load was achieved by hanging 16 kg kettlebells by elastic bands from the end of the bar. All trial lifts were set to a 2-second cadence with a slight pause at the bottom. Subjects had electrodes attached to 5 muscles (pectoralis major, anterior deltoid, medial deltoid, triceps brachii, and latissimus dorsi) and performed 3 isometric bench press trials to normalize electromyographic data. All 5 muscles demonstrated significantly greater activation at 80% compared with 60% load and during concentric compared with eccentric actions. These results suggest that upper body muscle activation is not different in the bench press between UL and SL. Therefore, coaches should use their preference when designing training programs.",
      publicationTypes: ["Journal Article"],
      meshTerms: [
        "Adult",
        "Electromyography",
        "Humans",
        "Isometric Contraction",
        "Male",
        "Muscle, Skeletal",
        "Upper Extremity",
        "Weight Lifting",
        "Young Adult",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "moderate_low",
      confidence: "high",
    },
    note: {
      entryNumber: 69,
      topic: "pressing_bench_chest_triceps",
      suppliedUse: "stability effects.",
      studyDesignAndPopulation:
        "Within-subject experimental study in 20 resistance-trained men (age 24.1 ± 2 years).",
      interventionAndComparator:
        "Stable load versus unstable load (kettlebells suspended by elastic bands) during bench press at 60% and 80% 1RM.",
      primaryOutcomes: "",
      directResults:
        "Muscle activation of the pectoralis major, anterior deltoid, medial deltoid, triceps brachii, and latissimus dorsi was significantly greater at 80% vs 60% 1RM and during concentric vs eccentric actions; no significant differences were found between stable and unstable loads.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Acute study measuring surface EMG activation only; findings do not directly translate to long-term hypertrophy, force, or sport transfer.",
      evidenceTier: "moderate_low",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "20300023",
      title:
        "Muscle activation when performing the chest press and shoulder press on a stable bench vs. a Swiss ball.",
      authors: [
        "Brandon P Uribe",
        "Jared W Coburn",
        "Lee E Brown",
        "Daniel A Judelson",
        "Andy V Khamoui",
        "Diamond Nguyen",
      ],
      journal: "Journal of strength and conditioning research",
      year: "2010",
      volume: "24",
      issue: "4",
      pagesOrElocation: "1028-33",
      doi: "10.1519/JSC.0b013e3181ca4fb8",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/20300023/",
      pmcFullTextUrl: "",
      abstract:
        "The aim of this study was to examine the effects of a stable surface (bench) vs. an unstable surface (Swiss ball) on muscle activation when performing the dumbbell chest press and shoulder press. Sixteen healthy men (24.19 +/- 2.17 years) performed 1 repetition maximum (1RM) tests for the chest press and shoulder press on a stable surface. A minimum of 48 hours post 1RM, subjects returned to perform 3 consecutive repetitions each of the chest press and shoulder press at 80% 1RM under 4 different randomized conditions (chest press on bench, chest press on Swiss ball, shoulder press on bench, shoulder press on Swiss ball). Electromyography was used to assess muscle activation of the anterior deltoid, pectoralis major, and rectus abdominus. The results revealed no significant difference in muscle activation between surface types for either exercise. This suggests that using an unstable surface neither improves nor impairs muscle activation under the current conditions. Coaches and other practitioners can expect similar muscle activation when using a Swiss ball vs. a bench.",
      publicationTypes: [
        "Comparative Study",
        "Journal Article",
        "Randomized Controlled Trial",
      ],
      meshTerms: [
        "Abdominal Muscles",
        "Analysis of Variance",
        "Electromyography",
        "Exercise Test",
        "Humans",
        "Male",
        "Muscle Contraction",
        "Muscle Fatigue",
        "Muscle Strength",
        "Pectoralis Muscles",
        "Postural Balance",
        "Probability",
        "Range of Motion, Articular",
        "Shoulder Joint",
        "Surface Properties",
        "Task Performance and Analysis",
        "Weight Lifting",
        "Young Adult",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "moderate_low",
      confidence: "high",
    },
    note: {
      entryNumber: 70,
      topic: "pressing_bench_chest_triceps",
      suppliedUse: "stable vs unstable pressing.",
      studyDesignAndPopulation:
        "Randomized crossover study in 16 healthy men (24.19 ± 2.17 years).",
      interventionAndComparator:
        "Dumbbell chest press and shoulder press on a stable bench versus a Swiss ball at 80% 1RM.",
      primaryOutcomes: "",
      directResults:
        "No significant difference in muscle activation (EMG) of the anterior deltoid, pectoralis major, and rectus abdominus between surface types for either exercise.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Acute surface EMG study in healthy men; not direct evidence of long-term hypertrophy or sport transfer.",
      evidenceTier: "moderate_low",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "21735215",
      title:
        "Muscle activations under varying lifting speeds and intensities during bench press.",
      authors: ["Akihiro Sakamoto", "Peter James Sinclair"],
      journal: "European journal of applied physiology",
      year: "2012",
      volume: "112",
      issue: "3",
      pagesOrElocation: "1015-25",
      doi: "10.1007/s00421-011-2059-0",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/21735215/",
      pmcFullTextUrl: "",
      abstract:
        "During a set of resistance exercise performed until exhaustion, the relationship between intensity and the number of repetitions can be affected by lifting speed, with faster speeds producing higher numbers. The hypothesized mechanisms include enhanced utilization of the stretch-shortening cycle. This study investigated muscle activations under varying speeds and intensities during bench press using surface electromyography (EMG) to suggest further mechanisms for the above finding. Thirteen weight-trained men (21.7 ± 3.6-year-old) performed bench press until fatigue under five intensities (40-80% 1RM), and four speeds (slow 5.6-s/repetition, medium 2.8-s/repetition, fast 1.9-s/repetition, and ballistic maximum speed). Surface EMG was recorded from the pectoralis, deltoid, and triceps for root-mean-square amplitude and median frequency. EMG amplitudes were greater for faster and heavier conditions before fatigue. Faster conditions, however, produced a significant fall in amplitude during the final concentric phase compared to slower movements. After fatigue, EMG amplitude increased, with the speed effect being maintained. The intensity effect on amplitude either disappeared or remained similar, depending on the muscles. Median frequencies before fatigue were similar among speeds and intensities. The fall in frequency after fatigue was similar across speeds, but greater for lighter intensities. It was concluded that reduced muscle activation during the final concentric phase in faster conditions allowed a better muscle pump, explaining the increased repetition numbers. Fatigue levels are likely to have been similar across speeds, but greater for lower intensities. An incomplete rise in EMG amplitude after fatigue for lower intensities could imply an increased contribution of central fatigue or neuromuscular transmission failure.",
      publicationTypes: ["Journal Article", "Randomized Controlled Trial"],
      meshTerms: [
        "Acceleration",
        "Adolescent",
        "Adult",
        "Exercise",
        "Exercise Therapy",
        "Humans",
        "Lifting",
        "Male",
        "Muscle Contraction",
        "Muscle Strength",
        "Muscle, Skeletal",
        "Physical Exertion",
        "Resistance Training",
        "Weight Lifting",
        "Young Adult",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "moderate_low",
      confidence: "high",
    },
    note: {
      entryNumber: 71,
      topic: "pressing_bench_chest_triceps",
      suppliedUse: "load and velocity.",
      studyDesignAndPopulation:
        "Randomized within-subject trial in 13 weight-trained men (mean age 21.7 ± 3.6 years).",
      interventionAndComparator:
        "Bench press to fatigue at five intensities (40%, 50%, 60%, 70%, 80% 1RM) across four lifting speeds (5.6s, 2.8s, 1.9s, and ballistic).",
      primaryOutcomes: "",
      directResults:
        "EMG amplitudes were significantly higher for faster speeds and heavier loads pre-fatigue; faster speeds exhibited a significant decrease in amplitude during the final concentric phase compared to slower speeds; post-fatigue median frequency decrease was significantly greater at lighter intensities.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Surface EMG results; does not provide direct evidence for muscle force, hypertrophy, or athletic performance transfer.",
      evidenceTier: "moderate_low",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "22692106",
      title:
        "Mechanical load and physiological responses of four different resistance training methods in bench press exercise.",
      authors: [
        "Sebastian Buitrago",
        "Nicolas Wirtz",
        "Zengyuan Yue",
        "Heinz Kleinöder",
        "Joachim Mester",
      ],
      journal: "Journal of strength and conditioning research",
      year: "2013",
      volume: "27",
      issue: "4",
      pagesOrElocation: "1091-100",
      doi: "10.1519/JSC.0b013e318260ec77",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/22692106/",
      pmcFullTextUrl: "",
      abstract:
        "The purpose of the study was to compare the mechanical impact and the corresponding physiological responses of 4 different and often practically applied resistance training methods (RTMs). Ten healthy male subjects (27.3 ± 3.2 years) experienced in resistance training performed 1 exhausting set of bench press exercise until exhaustion for each of the following RTMs: strength endurance (SE), fast force endurance (FFE), hypertrophy (HYP), and maximum strength (MAX). The RTMs were defined by different lifting masses and different temporal distributions of the contraction modes per repetition. Mean concentric power (P), total concentric work (W), and exercise time (EXTIME) were determined. Oxygen uptake (V[Combining Dot Above]O2) was measured during exercise and for 30 minutes postexercise. Mean V[Combining Dot Above]O2, volume of consumed O2, and excess postexercise oxygen consumption (EPOC) were calculated over 30 minutes of recovery. Maximum blood lactate concentration (LAmax) was also determined postexercise. The P was significantly higher (p < 0.01) for FFE and MAX compared with that for SE and HYP. The W was significantly higher for FFE than for all other RTMs (p < 0.01), and it was also lower for SE than for MAX (p < 0.05). EXTIME for SE was significantly higher (p < 0.01) than for all other RTMs, whereas EXTIME for MAX was significantly lower (p < 0.01) than for all other RTMs. Mean V[Combining Dot Above]O2 was significantly higher during FFE than during all other RTMs (p < 0.01). Consumed O2 was significantly higher (p < 0.05) during SE than for HYP and MAX, and it was also significantly higher for FFE and HYP compared with MAX (p < 0.05). The LAmax was significantly higher after FFE than after MAX (p < 0.05). There were no significant differences in EPOC between all RTMs. The results indicate that FFE and MAX are adequate to train muscular power despite the discrepancy in the external load. Because FFE performance achieves the highest amount in mechanical work, it may also elicit the highest total energy expenditure. The FFE challenges aerobic metabolism most and SE enables the longest EXTIME, indicating both are appropriate to enhance aerobic muscular capacities. The EPOC and LA values may indicate that energy needs covered by anaerobic metabolism are not higher during HYP and MAX compared with the RTM of lower external load.",
      publicationTypes: ["Journal Article", "Randomized Controlled Trial"],
      meshTerms: [
        "Adult",
        "Energy Metabolism",
        "Exercise Tolerance",
        "Humans",
        "Lactic Acid",
        "Male",
        "Oxygen Consumption",
        "Resistance Training",
        "Time Factors",
        "Weight Lifting",
        "Young Adult",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "high",
      confidence: "high",
    },
    note: {
      entryNumber: 72,
      topic: "pressing_bench_chest_triceps",
      suppliedUse: "bench programming methods.",
      studyDesignAndPopulation:
        "Randomized crossover trial in 10 healthy, resistance-trained male subjects (mean age 27.3 years).",
      interventionAndComparator:
        "Four resistance training methods (RTMs) in bench press performed until exhaustion: strength endurance (SE), fast force endurance (FFE), hypertrophy (HYP), and maximum strength (MAX).",
      primaryOutcomes: "",
      directResults:
        "Mean concentric power was significantly higher for FFE and MAX compared with SE and HYP (p < 0.01); total concentric work was significantly higher for FFE than all other RTMs (p < 0.01); mean VO2 was significantly higher during FFE than all other RTMs (p < 0.01); no significant differences were found in excess postexercise oxygen consumption (EPOC) between methods.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Acute, single-set intervention in a small sample of resistance-trained men; not direct longitudinal or sport-transfer evidence.",
      evidenceTier: "high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "32681665",
      title:
        "Effects of velocity loss in the bench press exercise on strength gains, neuromuscular adaptations, and muscle hypertrophy.",
      authors: [
        "Fernando Pareja-Blanco",
        "Julian Alcazar",
        "Pedro J Cornejo-Daza",
        "Juan Sánchez-Valdepeñas",
        "Carlos Rodriguez-Lopez",
        "Javier Hidalgo-de Mora",
        "Miguel Sánchez-Moreno",
        "Beatriz Bachero-Mena",
        "Luis M Alegre",
        "Manuel Ortega-Becerra",
      ],
      journal: "Scandinavian journal of medicine & science in sports",
      year: "2020",
      volume: "30",
      issue: "11",
      pagesOrElocation: "2154-2166",
      doi: "10.1111/sms.13775",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/32681665/",
      pmcFullTextUrl: "",
      abstract:
        "This study aimed to compare the effects of four velocity-based training (VBT) programs in bench press (BP) between a wide range of velocity loss (VL) thresholds-0% (VL0), 15% (VL15), 25% (VL25), and 50% (VL50)-on strength gains, neuromuscular adaptations, and muscle hypertrophy.\n\nSixty-four resistance-trained young men were randomly assigned into four groups (VL0, VL15, VL25, and VL50) that differed in the VL allowed in each set. Subjects followed a VBT program for 8-weeks using the BP exercise. Before and after the VBT program the following tests were performed: (a) cross-sectional area (CSA) measurements of pectoralis major (PM) muscle; (b) maximal isometric test; (c) progressive loading test; and (d) fatigue test.\n\nSignificant group x time interactions were observed for CSA (P < .01) and peak root mean square in PM (peak RMS-PM, P < .05). VL50 showed significantly greater gains in CSA than VL0 (P < .05). Only the VL15 group showed significant increases in peak RMS-PM (P < .01). Moreover, only VL0 showed significant gains in the early rate of force development (RFD, P = .05), while VL25 and VL50 improved in the late RFD (P ≤ .01-.05). No significant group × time interactions were found for any of the dynamic strength variables analyzed, although all groups showed significant improvements in all these parameters.\n\nHigher VL thresholds allowed for a greater volume load which maximized muscle hypertrophy, whereas lower VL thresholds evoked positive neuromuscular-related adaptations. No significant differences were found between groups for strength gains, despite the wide differences in the total volume accumulated by each group.",
      publicationTypes: ["Journal Article", "Randomized Controlled Trial"],
      meshTerms: [
        "Adaptation, Physiological",
        "Adult",
        "Electromyography",
        "Exercise Test",
        "Humans",
        "Isometric Contraction",
        "Male",
        "Muscle Fatigue",
        "Muscle Strength",
        "Muscle, Skeletal",
        "Resistance Training",
        "Ultrasonography",
        "Upper Extremity",
        "Weight Lifting",
        "Young Adult",
      ],
      keywords: [
        "fatigue",
        "neural adaptations",
        "resistance training",
        "structural adaptations",
        "training prescription",
        "velocity-based training",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "very_high",
      confidence: "high",
    },
    note: {
      entryNumber: 73,
      topic: "pressing_bench_chest_triceps",
      suppliedUse: "velocity-loss threshold and fatigue.",
      studyDesignAndPopulation:
        "8-week randomized controlled trial in 62 resistance-trained young men.",
      interventionAndComparator:
        "Velocity-based bench press training with velocity loss thresholds of 0%, 15%, 25%, and 50%.",
      primaryOutcomes: "",
      directResults:
        "All groups increased pectoralis major cross-sectional area (CSA) and 1RM strength; VL50 achieved significantly greater CSA gains than VL0 (P=0.04) despite similar strength gains; VL15 uniquely increased peak EMG amplitude (P<0.01); VL0 specifically improved early rate of force development (RFD0-50), while higher VL thresholds (VL25, VL50) improved late RFD.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "8-week intervention in resistance-trained young men using a Smith machine; results may not generalize to free-weight performance or other populations.",
      evidenceTier: "very_high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "32460639",
      title:
        "The effect of targeted resistance training on bench press performance and the alternation of prime mover muscle activation patterns.",
      authors: [
        "Katarzyna Stronska",
        "Artur Golas",
        "Michal Wilk",
        "Adam Zajac",
        "Adam Maszczyk",
        "Petr Stastny",
      ],
      journal: "Sports biomechanics",
      year: "2022",
      volume: "21",
      issue: "10",
      pagesOrElocation: "1262-1276",
      doi: "10.1080/14763141.2020.1752790",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/32460639/",
      pmcFullTextUrl: "",
      abstract:
        "Targeted muscle strengthening might improve performance or help overcome training stagnation; therefore, the aim of the present study was to investigate changes in muscle activity patterns before and after six weeks of targeted resistance training. Twenty-seven resistance-trained men were divided into three groups according to their prime mover activity, as measured by surface electromyography during a bench press (BP). Each group underwent a six-week block of targeted exercises for one of the following muscles: anterior deltoid (AD), pectoralis major (PM) or triceps brachii (TB). ANOVA showed that each group increased their 1 repetition maximum (1RM) (p < 0.05) and the activity of the exercised muscle group during an isometric bench press (p < 0.01) and during a dynamic bench press (p < 0.01) at 85% of the 1RM. During the isometric BP, the TB training group had an increase in TB activity in comparison to the other groups. Targeted muscle training is a useful method for muscle activity increase and increasing the maximum strength in complex exercise, when applied in activity-deficient muscle groups. Strengthening the TB elicits changes in all prime movers and results in TB activity domination during a bench press.",
      publicationTypes: ["Journal Article"],
      meshTerms: [
        "Biomechanical Phenomena",
        "Electromyography",
        "Humans",
        "Male",
        "Muscle Strength",
        "Muscle, Skeletal",
        "Resistance Training",
        "Weight Lifting",
      ],
      keywords: [
        "Anterior deltoid",
        "electromyography",
        "intervention",
        "pectoralis major",
        "triceps brachii",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "very_high",
      confidence: "high",
    },
    note: {
      entryNumber: 74,
      topic: "pressing_bench_chest_triceps",
      suppliedUse: "specific strengthening and bench performance.",
      studyDesignAndPopulation:
        "6-week targeted resistance training intervention in 27 resistance-trained men.",
      interventionAndComparator:
        "Targeted strengthening of the anterior deltoid, pectoralis major, or triceps brachii versus the other targeted muscle groups.",
      primaryOutcomes: "",
      directResults:
        "All groups increased their 1RM (p < 0.05) and sEMG activity of the targeted muscle during isometric and dynamic bench press (p < 0.01); the triceps brachii group showed significant increases in triceps activity compared to other groups during isometric bench press, suggesting that targeted triceps training can shift prime mover dominance.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Reliance on surface electromyography (sEMG) for activation patterns; short-term 6-week duration in resistance-trained men.",
      evidenceTier: "very_high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "31735359",
      title:
        "Peak of neuromuscular activation and angle where it occurs during bench press exercise performed with different repetition number and duration in resistance trained individuals.",
      authors: [
        "L T Lacerda",
        "M H Chagas",
        "M S Gurgel",
        "R C R Diniz",
        "M B Lanza",
        "G H C Peixoto",
        "A G P Andrade",
        "F V Lima",
      ],
      journal: "Journal of biomechanics",
      year: "2020",
      volume: "98",
      issue: "",
      pagesOrElocation: "109465",
      doi: "10.1016/j.jbiomech.2019.109465",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/31735359/",
      pmcFullTextUrl: "",
      abstract:
        "The present study compared neuromuscular activation, measured by surface electromyography (EMG) amplitude [measure by EMG peak (EMGPEAK)] and range of motion (ROM) where EMGPEAK occurred between two training protocols, matched by time under tension, but with a different number and duration of repetitions. Sixteen recreationally trained males performed 2 training protocols with 3 sets, 180 s of rest with 60% of one-repetition maximum(1RM) on the bench press performed in a Smith machine. Protocol A consisted of 6 repetitions with a repetition duration of 6 s and protocol B consisted of 12 repetitions with a repetition duration of 3 s. EMG activity of anterior deltoid, pectoralis major and triceps brachii muscles were recorded. The results showed a general higher EMG amplitude (regardless of the muscle) in protocol B (p = 0.010), and pectoral and triceps brachii consistently presented higher neuromuscular activation than anterior deltoid at both protocols (p = 0.007). Additionally, the ROM where EMGPEAK occurred in triceps brachii was in the middle of the concentric action (~50% of ROM), this occurred in the first half of the same action (~24% of ROM) in the other muscles. In conclusion, protocol B demonstrated an increased EMG amplitude over protocol A, although both protocols responded similarly by achieving the highest EMG amplitude at same ROM among the muscles analysed.",
      publicationTypes: ["Journal Article", "Research Support, Non-U.S. Gov't"],
      meshTerms: [
        "Adult",
        "Arm",
        "Electromyography",
        "Humans",
        "Male",
        "Muscle Strength",
        "Muscle, Skeletal",
        "Pectoralis Muscles",
        "Psychomotor Performance",
        "Range of Motion, Articular",
        "Resistance Training",
        "Rest",
        "Time Factors",
      ],
      keywords: ["Electromyography peak", "Human movement", "Range of motion"],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "moderate_low",
      confidence: "high",
    },
    note: {
      entryNumber: 75,
      topic: "pressing_bench_chest_triceps",
      suppliedUse: "ROM-specific activation.",
      studyDesignAndPopulation:
        "Acute crossover comparison of repetition duration and number in 16 recreationally trained males.",
      interventionAndComparator:
        "Protocol with 12 repetitions of 3s duration versus 6 repetitions of 6s duration, matched for time under tension at 60% 1RM.",
      primaryOutcomes: "",
      directResults:
        "Protocol with 12 repetitions (3s duration) elicited significantly higher surface EMG amplitude across all muscles compared to 6 repetitions (6s duration) (p = 0.010); peak activation occurred at approximately 50% of the concentric range of motion for the triceps brachii and 24% for the pectoralis major and anterior deltoid.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Acute intervention measuring surface EMG amplitude only; findings do not directly indicate longitudinal hypertrophy, force production, or sport transfer.",
      evidenceTier: "moderate_low",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "26134664",
      title:
        "The Effect of Performing Bi- and Unilateral Row Exercises on Core Muscle Activation.",
      authors: [
        "A Saeterbakken",
        "V Andersen",
        "A Brudeseth",
        "H Lund",
        "M S Fimland",
      ],
      journal: "International journal of sports medicine",
      year: "2015",
      volume: "36",
      issue: "11",
      pagesOrElocation: "900-5",
      doi: "10.1055/s-0034-1398646",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/26134664/",
      pmcFullTextUrl: "",
      abstract:
        "The purpose of the study was to compare core muscle activation in 3 different row exercises (free-weight bent-over row, seated cable row and machine row) performed unilaterally and bilaterally, at matched effort levels. 15 resistance-trained men (26.0±4.4 years, 81.0±9.5 kg, 1.81±0.07 m) performed the exercises in randomized order. For erector spinae and multifidus, EMG activities in unilateral machine- and cable row were 60-63% and 74-78% of the bilateral performance (P≤0.036). For external oblique, the EMG activities recorded during bilateral exercises were 37-41% of the unilateral performance (P≤0.010). In unilateral cable- and machine rows, the EMG activities in external oblique and multifidus were 50-57% and 70-73% of the free-weight row (P≤0.002). In bilateral free-weight row, EMG activity in erector spinae was greater than bilateral machine- (+34%, P=0.004) and unilateral free-weight rows (+12%, P=0.016). For rectus abdominis there were no significant differences between conditions. In conclusion, 1) free-weight row provided greater EMG activity in erector spinae (bilaterally and unilaterally) and multifidus (unilaterally) than machine row; 2) unilateral performance of exercises activated the external oblique more than bilateral performance, regardless of exercise; and 3) generally bilateral performance of exercises provided higher erector spinae and multifidus EMG activity compared to unilateral performance.",
      publicationTypes: ["Journal Article"],
      meshTerms: [
        "Abdominal Muscles",
        "Adult",
        "Back Muscles",
        "Electromyography",
        "Exercise",
        "Exercise Test",
        "Humans",
        "Male",
        "Paraspinal Muscles",
        "Rectus Abdominis",
        "Resistance Training",
        "Young Adult",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "moderate_low",
      confidence: "high",
    },
    note: {
      entryNumber: 76,
      topic: "pulling_rows_exercise_modality",
      suppliedUse: "bilateral vs unilateral rows.",
      studyDesignAndPopulation:
        "Acute randomized cross-over surface EMG study in 15 resistance-trained men.",
      interventionAndComparator:
        "Free-weight bent-over row, seated cable row, and machine row performed unilaterally versus bilaterally at matched effort levels.",
      primaryOutcomes: "",
      directResults:
        "Unilateral performance reduced erector spinae and multifidus activation to 60-78% of bilateral levels but increased external oblique activation by approximately 2.5-fold compared to bilateral performance; bilateral free-weight row elicited 34% greater erector spinae activation than machine row and 12% more than unilateral free-weight row; no significant differences were observed for rectus abdominis.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Acute surface EMG intervention in trained men; not direct longitudinal adaptation or sport-transfer evidence.",
      evidenceTier: "moderate_low",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "40513198",
      title:
        "Impact of different ranges of motion in the prone barbell row on muscle excitation.",
      authors: [
        "Josef Fischer",
        "Christian Burger",
        "Josefina Manieu Seguel",
        "Coşkun Rodoplu",
        "Florian Kurt Paternoster",
        "Markus Tilp",
        "Andreas Konrad",
      ],
      journal:
        "Journal of electromyography and kinesiology : official journal of the International Society of Electrophysiological Kinesiology",
      year: "2025",
      volume: "83",
      issue: "",
      pagesOrElocation: "103025",
      doi: "10.1016/j.jelekin.2025.103025",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/40513198/",
      pmcFullTextUrl: "",
      abstract:
        "This study investigated muscle excitation via surface electromyography (sEMG) during different ranges of motion (ROMs) in the prone barbell row. Sixteen resistance-trained males performed a 10-repetition maximum (10RM) across three ROMs: full, upper half, and lower half. Time under tension was standardized at 2 s for both the concentric and eccentric phases. SEMG measurements were taken for the trapezius transversus (TT), rear deltoid (RD), latissimus dorsi (LD) and biceps brachii (BB). Mean sEMG amplitude and peak sEMG amplitude were analyzed. The LD showed significantly higher mean muscle excitation in the upper-half ROM compared to both the lower-half ROM (p < 0.001, d = - 0.59) and full ROM (p < 0.001, d = - 0.58). The TT exhibited significantly lower peak excitation in the upper-half ROM compared to the lower-half ROM (p = 0.042, d = 0.42) and full ROM (p = 0.013, d = 0.54). For the other muscles, no significant difference between the ROMs was found. The effect of ROM during the prone barbell row exercise on muscle excitation was of a medium magnitude only, as well as inconsistent, suggesting that ROM adjustments with standardized time under tension have limited impact on overall muscle activation.",
      publicationTypes: ["Journal Article"],
      meshTerms: [
        "Humans",
        "Male",
        "Electromyography",
        "Muscle, Skeletal",
        "Range of Motion, Articular",
        "Adult",
        "Young Adult",
        "Prone Position",
        "Weight Lifting",
        "Muscle Contraction",
      ],
      keywords: [
        "EMG",
        "Electromyography",
        "Muscle activation",
        "Range of motion",
        "Resistance training",
        "Time under tension",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "moderate_low",
      confidence: "high",
    },
    note: {
      entryNumber: 77,
      topic: "pulling_rows_exercise_modality",
      suppliedUse: "row ROM.",
      studyDesignAndPopulation:
        "Randomized crossover trial in 16 resistance-trained males (mean age 27.5 years).",
      interventionAndComparator:
        "Full range of motion (ROM) versus upper-half ROM versus lower-half ROM in the prone barbell row at 10RM intensity.",
      primaryOutcomes: "",
      directResults:
        "Latissimus dorsi mean excitation was significantly higher in the upper-half ROM compared to both lower-half and full ROM (p < 0.001); trapezius transversus peak excitation was significantly lower in the upper-half ROM compared to lower-half (p = 0.042) and full ROM (p = 0.013); no significant differences were observed for the rear deltoid or biceps brachii.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Acute surface EMG measurement in trained males; does not provide direct evidence for muscle hypertrophy or long-term strength adaptations.",
      evidenceTier: "moderate_low",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "31198105",
      title:
        "The effects of lifting straps in maximum strength, number of repetitions and muscle activation during lat pull-down.",
      authors: [
        "Denis Fabrício Valério",
        "Ricardo Berton",
        "João Francisco Barbieri",
        "Jader Calzavara",
        "Antônio Carlos De Moraes",
        "Renato Barroso",
      ],
      journal: "Sports biomechanics",
      year: "2021",
      volume: "20",
      issue: "7",
      pagesOrElocation: "858-865",
      doi: "10.1080/14763141.2019.1610490",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/31198105/",
      pmcFullTextUrl: "",
      abstract:
        "The objective of the study was to investigate the effects of using lifting straps on the lat pull-down exercise on maximal strength, number of repetitions, and muscle activation. Twelve resistance-trained men participated (age 27 ± 4 years, body mass 84 ± 10 kg, height 177 ± 6 cm, resistance training experience 6.6 ± 2.4 years). All participants performed the 1RM tests and training protocols either with the lifting straps (WS) or without (WOS). Exercise sessions for both conditions (WS and WOS) consisted of 3 sets to concentric failure with a load of 70% of one repetition maximum (1RM) and rest intervals of 60 s. For the 1RM test, no difference was observed between WS and WOS conditions (96.5 ± 12.7 kg and 96.6 ± 11.9 kg, respectively). There were no differences between the WS and WOS conditions in the number of repetitions per set, total repetitions and latissimus dorsi muscle activation. In conclusion, the findings of this study demonstrate that the use of lifting straps in the lat pull-down exercise by resistance-trained individuals does not promote beneficial effect in the 1RM value, the number of repetitions performed with 70% of 1RM, and muscle activation.",
      publicationTypes: ["Journal Article", "Randomized Controlled Trial"],
      meshTerms: [
        "Adult",
        "Biomechanical Phenomena",
        "Cross-Over Studies",
        "Electromyography",
        "Hand Strength",
        "Humans",
        "Male",
        "Muscle Strength",
        "Sports Equipment",
        "Superficial Back Muscles",
        "Weight Lifting",
        "Young Adult",
      ],
      keywords: ["Resistance training", "ergogenic technique", "grip strength"],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "moderate_low",
      confidence: "high",
    },
    note: {
      entryNumber: 78,
      topic: "pulling_rows_exercise_modality",
      suppliedUse: "grip limitation and lifting straps.",
      studyDesignAndPopulation:
        "Randomised, within-individual, crossover design in 12 resistance-trained men.",
      interventionAndComparator:
        "Lat pull-down with lifting straps versus without lifting straps.",
      primaryOutcomes: "",
      directResults:
        "No significant differences were observed between lifting straps and no-straps conditions for 1RM (96.5 ± 12.7 kg vs. 96.6 ± 11.9 kg), repetitions to failure at 70% 1RM, or latissimus dorsi muscle activation.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Acute cross-over study in a small sample of trained men; results may not generalize to other pulling exercises or long-term adaptations.",
      evidenceTier: "moderate_low",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "39716392",
      title:
        "Eight-week lat pull-down resistance training with joint instability leads to superior pull-up endurance performance and reduced antagonist coactivation in recreationally active male college students.",
      authors: [
        "Qian Li",
        "Jiaqi Yan",
        "Minjie Qiao",
        "Jiuqing Quan",
        "Yiqing Chen",
        "Mingxin Gong",
        "Wenxin Niu",
        "Lejun Wang",
      ],
      journal: "European journal of sport science",
      year: "2025",
      volume: "25",
      issue: "1",
      pagesOrElocation: "e12243",
      doi: "10.1002/ejsc.12243",
      pmcid: "PMC11667758",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/39716392/",
      pmcFullTextUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11667758/",
      abstract:
        "This study aimed to investigate the effects of an 8-week lat pull-down resistance training program with joint instability on pull-up performance in male college students. Thirty-four healthy recreationally active male college students were randomly assigned to either the joint instability resistance training (IRT) or traditional resistance training (TRT) group. Participants of the TRT and IRT groups performed lat pull-down training on stable and joint instability conditions for 8 weeks, respectively. Pull-up endurance (number of repetitions), anthropometry, lat pull-down maximal voluntary isometric contraction (MVIC) peak force, and movement stability of performing unstable lat pull-down were tested before and after the 8-week training. Surface electromyography of biceps brachii (BB), triceps brachii (TB), brachioradialis (BR), anterior deltoid (AD), middle deltoid (MD), posterior deltoid (PD), pectoralis major (PM), and latissimus dorsi (LD) muscles were recorded during the pull-up endurance test. The level of significance is set at p ≤ 0.05. The results demonstrated that the pull-up endurance and lat pull-down MVIC peak force of both IRT and TRT groups were significantly enhanced after 8-week training compared to the pre-training test. Notably, the number of pull-up repetitions of the IRT group was 45.5% higher than the TRT group. These findings suggest that lat pull-down training performed with joint instability may lead to greater improvements in pull-up endurance compared to the stable condition, possibly attributed to enhanced muscle contraction efficiency as indicated by decreased antagonist coactivation activity.",
      publicationTypes: ["Journal Article", "Randomized Controlled Trial"],
      meshTerms: [
        "Adult",
        "Humans",
        "Male",
        "Young Adult",
        "Electromyography",
        "Isometric Contraction",
        "Joint Instability",
        "Muscle Strength",
        "Muscle, Skeletal",
        "Physical Endurance",
        "Resistance Training",
        "Students",
      ],
      keywords: [
        "biomechanics",
        "coaching",
        "endurance",
        "strength",
        "training",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "FULL_TEXT_VERIFIED",
      evidenceTier: "very_high",
      confidence: "high",
    },
    note: {
      entryNumber: 79,
      topic: "pulling_rows_exercise_modality",
      suppliedUse: "pulldown-to-pull-up transfer.",
      studyDesignAndPopulation:
        "Randomized controlled trial involving 34 recreationally active male college students assigned to 8 weeks of stable or unstable lat pull-down training.",
      interventionAndComparator:
        "An 8-week lat pull-down resistance training program (3x/week, 4 sets of 12 reps, 65-80% 1RM) utilizing elastic bands to induce joint instability (IRT) compared to traditional machine-based lat pull-down (TRT).",
      primaryOutcomes:
        "Pull-up endurance repetitions, lat pull-down maximal voluntary isometric contraction (MVIC) peak force, movement stability, and muscle activation patterns (EMG).",
      directResults:
        "Both training groups significantly improved pull-up endurance, but the joint instability resistance training (IRT) group demonstrated a 228.38% increase to 8.47 ± 3.54 repetitions, which was 45.5% superior to the traditional resistance training (TRT) group's 5.82 ± 3.36 repetitions (p < 0.01). While both groups achieved similar gains in lat pull-down MVIC peak force (~25%), IRT significantly improved movement stability by reducing barbell acceleration (13.8% lower than TRT, p = 0.03) and specifically reduced the anterior/posterior deltoid coactivation ratio by 31.5% (p = 0.03). Agonist muscle excitation (EMG RMS) decreased by 24.2% in both groups, but only IRT significantly reduced antagonist EMG RMS (-20.4%, p < 0.01). No significant changes in mid-upper arm circumference (MUAC) were observed, indicating that performance gains were mediated by neural adaptations and movement economy rather than hypertrophy.",
      implementationImplication:
        "Incorporating elastic-band-induced instability into lat pull-down training is more effective for improving pull-up endurance and neural coordination than stable variations in recreational populations.",
      limitations:
        "The study was limited to a small sample of recreationally active male college students over 8 weeks, used surface EMG for recruitment analysis only, and lacked significant evidence of muscular hypertrophy.",
      evidenceTier: "very_high",
      reviewStatus: "FULL_TEXT_VERIFIED",
      confidence: "high",
      noteSource: "PMC full-text sections retrieved through NCBI EFetch",
    },
  },
  {
    study: {
      pmid: "12489346",
      title:
        "Electromyographic validation of the trapezius and serratus anterior muscles in rowing exercises with closed grip.",
      authors: ["M L Büll", "V Freitas", "M Vitti", "G J M Rosa"],
      journal: "Electromyography and clinical neurophysiology",
      year: "2002",
      volume: "42",
      issue: "8",
      pagesOrElocation: "451-7",
      doi: "",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/12489346/",
      pmcFullTextUrl: "",
      abstract:
        "Because the lack of specialized textbooks, the select of basic exercises for physical conditioning programmes is based on empirical knowledge. This fact led the authors to propose the study on electromyographic activity of the trapezius (upper portion) (TS) and the serratus anterior (lower portion) (SI) muscles in rowing exercises with closed grip in three different modalities. The tests were carried out with 24 male volunteers, 18 to 25 years old, by using a two-channel TECA TE 4 electromyograph and Hewlett Packard surface electrodes. For exercises execution, a long bar made of light wood was used. TS acted significantly in the three different modalities, that is, upright, sitting and bent over, while SI acted preferentially in upright and sitting rowing exercises, justifying their inclusion as basic exercises in physical conditioning programmes.",
      publicationTypes: [
        "Journal Article",
        "Research Support, Non-U.S. Gov't",
        "Validation Study",
      ],
      meshTerms: [
        "Adolescent",
        "Adult",
        "Arm",
        "Electromyography",
        "Exercise",
        "Hand Strength",
        "Humans",
        "Male",
        "Muscle, Skeletal",
        "Physical Fitness",
        "Reference Values",
        "Reproducibility of Results",
        "Shoulder",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "moderate_low",
      confidence: "high",
    },
    note: {
      entryNumber: 80,
      topic: "pulling_rows_exercise_modality",
      suppliedUse: "row grip.",
      studyDesignAndPopulation:
        "Cross-sectional electromyographic study of 24 male volunteers aged 18-25 years.",
      interventionAndComparator:
        "Upright, sitting, and bent-over rowing modalities with a closed grip.",
      primaryOutcomes: "",
      directResults:
        "Upper trapezius activity was significant across all three rowing modalities; lower serratus anterior activity was preferential to the upright and sitting modalities.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Surface EMG study using a light wood bar in a small sample of young males; no longitudinal or force-transfer data.",
      evidenceTier: "moderate_low",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "12395615",
      title:
        "Electromyographic validation of the trapezius and serratus anterior muscles in rowing exercises with middle grip.",
      authors: ["M L Büll", "V Freitas", "M Vitti", "G J M Rosa"],
      journal: "Electromyography and clinical neurophysiology",
      year: "2002",
      volume: "42",
      issue: "7",
      pagesOrElocation: "403-11",
      doi: "",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/12395615/",
      pmcFullTextUrl: "",
      abstract:
        "Because the lack of textbooks based on electromyographic studies in the area of exercises for physical conditioning, the authors proposed to study the trapezius (upper portion) (TS) and the serratus anterior (lower portion) (SI) muscles during the execution of four different modalities of rowing exercises with middle grip in 24 male volunteers, 18 to 25 years old. For the recordings, it was used a two-channel TECA TE 4 electromyograph and Hewlett Packard surface electrodes. For the movements, a supine bench and a 120 cm-long bar made of low weight wood were used. The results showed that TS acted significantly in upright, sitting and inclined rowing, justifying its inclusion in physical conditioning programmes, while SI, in spite of acting preferentially in upright and sitting rowing, presented activity levels which do not justify its inclusion.",
      publicationTypes: ["Journal Article", "Validation Study"],
      meshTerms: [
        "Action Potentials",
        "Adolescent",
        "Adult",
        "Arm",
        "Electromyography",
        "Exercise",
        "Hand Strength",
        "Humans",
        "Male",
        "Muscle, Skeletal",
        "Physical Fitness",
        "Reference Values",
        "Reproducibility of Results",
        "Shoulder",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "moderate_low",
      confidence: "high",
    },
    note: {
      entryNumber: 81,
      topic: "pulling_rows_exercise_modality",
      suppliedUse: "row grip width.",
      studyDesignAndPopulation:
        "Electromyographic validation study in 24 male volunteers aged 18 to 25 years.",
      interventionAndComparator:
        "Four modalities of rowing exercises using a middle grip, including upright, sitting, and inclined rowing.",
      primaryOutcomes: "",
      directResults:
        "Upper trapezius demonstrated significant activity in upright, sitting, and inclined rowing; lower serratus anterior activity was insufficient to justify inclusion in physical conditioning programs.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Reliance on surface EMG in a small, young male sample; not direct evidence of muscle hypertrophy or sport transfer.",
      evidenceTier: "moderate_low",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "37535335",
      title:
        "Free-Weight and Machine-Based Training Are Equally Effective on Strength and Hypertrophy: Challenging a Traditional Myth.",
      authors: [
        "Alejandro Hernández-Belmonte",
        "Alejandro Martínez-Cava",
        "Ángel Buendía-Romero",
        "Francisco Franco-López",
        "Jesús G Pallarés",
      ],
      journal: "Medicine and science in sports and exercise",
      year: "2023",
      volume: "55",
      issue: "12",
      pagesOrElocation: "2316-2327",
      doi: "10.1249/MSS.0000000000003271",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/37535335/",
      pmcFullTextUrl: "",
      abstract:
        "This study aimed to compare the effects of free-weight and machine-based resistance training on strength, hypertrophy, and joint discomfort.\n\nThirty-eight resistance-trained men participated in an 8-wk resistance program allocated into free-weight ( n = 19) or machine-based ( n = 19) groups. Training variables were identical for both modalities, so they only differed in the use of barbells or machines to execute the full squat, bench press, prone bench pull, and shoulder press exercises. The velocity-based method was implemented to accurately adjust the intensity throughout the program. Strength changes were evaluated using eight velocity-monitored loading tests (four exercises × two modalities) and included the relative one-repetition maximum (1RM Rel ), as well as the mean propulsive velocity against low (MPV Low ) and high (MPV High ) loads. Ultrasound-derived cross-sectional area of quadriceps (proximal and distal regions), pectoralis major, and rectus abdominis was measured to examine hypertrophy. Complementarily, Western Ontario and McMaster Universities and Disabilities of the Arm, Shoulder and Hand questionnaires were administrated to assess changes in lower- and upper-limb joint discomfort. Outcomes were compared using ANCOVA and percentage of change (∆) statistics.\n\nEach group significantly ( P < 0.001) increased 1RM Rel , MPV Low , and MPV High for both modalities tested, but especially in the one they trained. When considering together the eight exercises tested, strength changes for both modalities were similar (∆ differences ≤1.8%, P ≥ 0.216). Likewise, the cross-sectional area of all the muscles evaluated was significantly increased by both modalities, with no significant differences between them (∆ difference ≤2.0%, P ≥ 0.208). No between-group differences ( P ≥ 0.144) were found for changes in stiffness, pain, and functional disability levels, which were reduced by both modalities.\n\nFree-weight and machine-based modalities are similarly effective to promote strength and hypertrophy without increasing joint discomfort.",
      publicationTypes: ["Journal Article"],
      meshTerms: [
        "Male",
        "Humans",
        "Muscle Strength",
        "Quadriceps Muscle",
        "Posture",
        "Exercise",
        "Hypertrophy",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "very_high",
      confidence: "high",
    },
    note: {
      entryNumber: 82,
      topic: "pulling_rows_exercise_modality",
      suppliedUse: "free weights vs machines.",
      studyDesignAndPopulation:
        "8-week parallel-group resistance-training intervention in 38 resistance-trained men.",
      interventionAndComparator:
        "Free-weight resistance training versus machine-based resistance training using barbells or machines for four multi-joint exercises.",
      primaryOutcomes: "",
      directResults:
        "Both groups significantly increased relative 1RM and mean propulsive velocity across all exercises (P < 0.001); strength changes were similar between modalities (differences ≤1.8%, P ≥ 0.216); muscle cross-sectional area for quadriceps, pectoralis major, and rectus abdominis increased significantly in both groups with no significant between-group differences (differences ≤2.0%, P ≥ 0.208).",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Short-term (8-week) intervention in resistance-trained men using velocity-based intensity control; not direct evidence for other populations or exercises.",
      evidenceTier: "very_high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "33114782",
      title:
        "Using Machines or Free Weights for Resistance Training in Novice Males? A Randomized Parallel Trial.",
      authors: ["Dirk Aerenhouts", "Eva D'Hondt"],
      journal:
        "International journal of environmental research and public health",
      year: "2020",
      volume: "17",
      issue: "21",
      pagesOrElocation: "",
      doi: "10.3390/ijerph17217848",
      pmcid: "PMC7662789",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/33114782/",
      pmcFullTextUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7662789/",
      abstract:
        "This study compared the effect of a resistance training (RT) program with machines, free weights, or a combination of both on changes in anthropometrics, strength, and functional ability in novice adult males. Thirty-six male novices in RT (18-45 years) followed a 10-week RT program. Participants were randomly assigned to one of three groups (N = 12 each): machines only; free weights only; or switching from machines to free weights (after 5 weeks). Muscle size (circumferences of upper arm, thigh and chest), strength (1 Repetition Maximum) on both machines and free weights, and functional ability (Functional Movement ScreenTM (Functional Movement Systems Inc., Chatham, VA, USA)) were assessed prior to the RT program, halfway at 5 weeks, and within one week after the final training bout. Repeated measures MANOVAs showed no significant time by RT group interactions for the different outcome measures. Regardless of RT group, significant improvements over time were observed for anthropometrics (F = 9.144, p < 0.001), strength (F = 6.918, p < 0.001), and functional ability (F = 25.578, p < 0.001). To conclude, similar gains in muscularity, strength, and functional ability can be expected for male novices in RT regardless of the equipment being used and without a fallback when changing from machines to free weights. Accordingly, any choice of RT equipment can be made, considering individual preferences.",
      publicationTypes: ["Journal Article", "Randomized Controlled Trial"],
      meshTerms: [
        "Activities of Daily Living",
        "Adolescent",
        "Adult",
        "Anthropometry",
        "Humans",
        "Male",
        "Middle Aged",
        "Muscle Strength",
        "Muscle, Skeletal",
        "Resistance Training",
        "Young Adult",
      ],
      keywords: [
        "exercise prescription",
        "learning transfer",
        "physical fitness",
        "progression",
        "strength",
        "untrained",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "FULL_TEXT_VERIFIED",
      evidenceTier: "very_high",
      confidence: "high",
    },
    note: {
      entryNumber: 83,
      topic: "pulling_rows_exercise_modality",
      suppliedUse: "machine vs free-weight training.",
      studyDesignAndPopulation:
        "Randomized parallel trial involving 50 novice male adults (36 finishers, aged 18-45) with no prior resistance training experience.",
      interventionAndComparator:
        "A 10-week whole-body resistance training program (2 sessions/week, 3 sets of 12-RM) comparing machine-only, free-weight-only, and a combined group switching from machines to free weights at 5 weeks.",
      primaryOutcomes:
        "Anthropometric muscle size estimations (circumferences), estimated 1-RM strength for 10 exercises, and Functional Movement Screen (FMS) scores.",
      directResults:
        "All training groups demonstrated significant improvements over time in all measured outcomes (p < 0.05) with no significant inter-group differences in muscle size or strength gains. Significant increases from pre- to post-intervention were observed in upper arm relaxed (p < 0.001), upper arm flexed (p < 0.001), thigh (p = 0.008), and chest (p < 0.001) circumferences, as well as estimated 1-RM for all machine and free weight exercises (p < 0.001). Functional Movement Screen scores improved significantly in all groups (p = 0.001), while standing broad jump performance showed a significant main effect of time (p < 0.001) and a group effect favoring free weights over the combined group (p < 0.01).",
      implementationImplication:
        "For novice males, resistance training using machines, free weights, or a combination of both is equally effective for increasing muscle size, strength, and functional movement quality during the initial 10 weeks of training.",
      limitations:
        "Findings are limited to novice males over 10 weeks and rely on indirect anthropometric muscle size estimations and estimated rather than direct 1-RM testing.",
      evidenceTier: "very_high",
      reviewStatus: "FULL_TEXT_VERIFIED",
      confidence: "high",
      noteSource: "PMC full-text sections retrieved through NCBI EFetch",
    },
  },
  {
    study: {
      pmid: "32358310",
      title:
        "Effects of Training With Free Weights Versus Machines on Muscle Mass, Strength, Free Testosterone, and Free Cortisol Levels.",
      authors: [
        "Shane R Schwanbeck",
        "Stephen M Cornish",
        "Trevor Barss",
        "Philip D Chilibeck",
      ],
      journal: "Journal of strength and conditioning research",
      year: "2020",
      volume: "34",
      issue: "7",
      pagesOrElocation: "1851-1859",
      doi: "10.1519/JSC.0000000000003349",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/32358310/",
      pmcFullTextUrl: "",
      abstract:
        'Schwanbeck, SR, Cornish, SM, Barss, T, and Chilibeck, PD. Effects of training with free weights versus machines on muscle mass, strength, free testosterone, and free cortisol levels. J Strength Cond Res 34(7): 1851-1859, 2020-Free weights offer a more unstable training environment, which enhances muscle recruitment, whereas some machines have the advantage of using a "cam" pulley system that better matches strength curves. We compared the effect of training with free weights vs. machines on muscle mass, strength, free testosterone, and free cortisol concentrations. Forty-six subjects (26 women; 22 ± 3 years) were randomized to train using free weights or machines for 8 weeks (with each muscle group trained 2-3/weeks, 3-4 sets of 4-10 repetitions). Muscle thickness and strength were measured at 0 and 8 weeks. Salivary hormone concentrations were assessed before and at the end of workouts at the beginning, midway (4 weeks), and end (8 weeks) of the training intervention. Biceps and quadriceps muscle thickness increased (p < 0.01) with no difference between groups. There was a group × time interaction for machine bench press strength (p = 0.05) with the machine group increasing more than the free-weight group (13.9 vs. 8.6%). Free-weight bench press and squat, and Smith machine squat strength increased in both groups (11-19%; p < 0.01) with no difference between groups. Men in the free-weight group had a greater increase in free testosterone from before to after acute training sessions than men in the machine group and all women (p < 0.01); however, there was no differences between groups in free cortisol response to acute resistance exercise. Training sessions with free weights induced greater increases in free testosterone in men; however, training with free weights or machines resulted in similar increases in muscle mass and strength.',
      publicationTypes: ["Comparative Study", "Journal Article"],
      meshTerms: [
        "Adult",
        "Arm",
        "Exercise",
        "Female",
        "Humans",
        "Hydrocortisone",
        "Male",
        "Muscle Strength",
        "Quadriceps Muscle",
        "Random Allocation",
        "Resistance Training",
        "Saliva",
        "Testosterone",
        "Young Adult",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "very_high",
      confidence: "high",
    },
    note: {
      entryNumber: 84,
      topic: "pulling_rows_exercise_modality",
      suppliedUse: "modality comparison.",
      studyDesignAndPopulation:
        "8-week randomized comparative resistance-training intervention in 46 healthy, resistance-trained young adults (20 men, 26 women).",
      interventionAndComparator:
        "8-week resistance training using exclusively free weights versus exclusively machines.",
      primaryOutcomes: "",
      directResults:
        "Both groups achieved similar increases in biceps and quadriceps muscle thickness (p < 0.01) and 1RM strength (11-19% across most exercises); the machine group showed a greater increase in machine bench press strength (13.9% vs 8.6%, p = 0.05); men in the free-weight group had higher acute free testosterone spikes post-workout (p < 0.01), but this did not result in superior hypertrophy.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Short-term 8-week intervention in young, healthy, previously trained adults; acute hormonal differences did not translate to long-term structural or performance advantages.",
      evidenceTier: "very_high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "30688873",
      title:
        "Specificity and Transfer of Lower-Body Strength: Influence of Bilateral or Unilateral Lower-Body Resistance Training.",
      authors: ["Brendyn B Appleby", "Stuart J Cormack", "Robert U Newton"],
      journal: "Journal of strength and conditioning research",
      year: "2019",
      volume: "33",
      issue: "2",
      pagesOrElocation: "318-326",
      doi: "10.1519/JSC.0000000000002923",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/30688873/",
      pmcFullTextUrl: "",
      abstract:
        "Appleby, BB, Cormack, SJ, and Newton, RU. Specificity and transfer of lower-body strength: Influence of bilateral or unilateral lower-body resistance training. J Strength Cond Res 33(2): 318-326, 2019-To examine the development of lower-body strength using either bilateral or unilateral resistance training. Developmental rugby players (n = 33; mean training age = 5.4 ± 2.9 years; 1 repetition maximum [1RM] 90° squat = 178 ± 27 kg) completed an 18-week randomized controlled training design (bilateral group [BIL], n = 13; unilateral group [UNI], n = 10; comparison, n = 10). The 8-week training phase involved 2 lower-body, volume-load matched resistance sessions per week (6-8 sets × 4-8 reps at 45-88% 1RM), differing only in the prescription of a bilateral (back squat) or unilateral (step-up) resistance exercise. Maximum strength was assessed by a randomized order of 1RM back squat and step-up testing and analyzed for within- and between-group differences using effect sizes (ES ± 90% confidence limits [CL]). Both training groups showed practically important improvements in their trained exercise (ES ± 90% CL: BIL = 0.67 ± 0.48; UNI = 0.74 ± 0.38) with transfer to their nontrained resistance exercise (BIL step-up = 0.27 ± 0.39: UNI squat = 0.42 ± 0.39). The difference between groups in adaptation of squat strength was unclear (BIL ES = -0.34 ± 0.55), while the UNI group showed an advantage in step-up training (ES = 0.41 ± 0.36). The results demonstrate that practically important increases in lower-body strength can be achieved using bilateral or unilateral resistance training and development of that strength may be expressed in the movement not trained, supporting the transfer of strength training between exercises of similar joint movements and muscles. Coaches may choose to incorporate unilateral strength training where the prescription of bilateral training may be inhibited.",
      publicationTypes: ["Clinical Trial", "Journal Article"],
      meshTerms: [
        "Athletes",
        "Back",
        "Exercise",
        "Football",
        "Humans",
        "Male",
        "Muscle Strength",
        "Muscle, Skeletal",
        "Resistance Training",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "very_high",
      confidence: "high",
    },
    note: {
      entryNumber: 85,
      topic: "unilateral_bilateral_transfer_specificity",
      suppliedUse: "bilateral/unilateral transfer.",
      studyDesignAndPopulation:
        "18-week randomized controlled training design (8-week intervention) in 33 developmental rugby players.",
      interventionAndComparator:
        "Bilateral back squat training versus unilateral step-up training.",
      primaryOutcomes: "",
      directResults:
        "Both groups significantly improved 1RM in their trained exercise (Bilateral squat ES=0.79; Unilateral step-up ES=0.63); transfer to the nontrained exercise occurred in both groups (Bilateral to step-up ES=0.22; Unilateral to squat ES=0.44); between-group differences in squat adaptation were unclear, while the unilateral group showed a small advantage in step-up strength (ES=0.41).",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Conducted in developmental rugby players during a preseason phase, which may limit generalizability to elite or untrained populations.",
      evidenceTier: "very_high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "30844983",
      title:
        "Unilateral and Bilateral Lower-Body Resistance Training Does not Transfer Equally to Sprint and Change of Direction Performance.",
      authors: ["Brendyn B Appleby", "Stuart J Cormack", "Robert U Newton"],
      journal: "Journal of strength and conditioning research",
      year: "2020",
      volume: "34",
      issue: "1",
      pagesOrElocation: "54-64",
      doi: "10.1519/JSC.0000000000003035",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/30844983/",
      pmcFullTextUrl: "",
      abstract:
        "Appleby, BB, Cormack, SJ, and Newton, RU. Unilateral and bilateral lower-body resistance training does not transfer equally to sprint and change of direction performance. J Strength Cond Res 34(1): 54-64, 2020-Given maximal strength can be developed using bilateral or unilateral resistance training, the purpose of this study was to determine the magnitude of transfer of unilateral or bilateral resistance training to sprint and change of direction (COD) performance. Thirty-three trained participants (average training age = 5.4 ± 2.9 years and 1 repetition maximum [1RM] 90° squat = 177.6 ± 26.7 kg) completed either a bilateral group (BIL, n = 13), unilateral (UNI, n = 10), or comparison (COM, n = 10) 18-week randomized controlled training design. Training involved 2 lower-body, volume-load-matched resistance sessions per week (6-8 sets × 4-8 reps at 45-88% 1RM), differing only in the prescription of a bilateral (squat) or unilateral (step-up) resistance exercise. Strength was assessed through 1RM squat and step-up, in addition to 20-m sprint and a customized 50° COD test. The effect size statistic ± 90% confidence limit (ES ± CL) was calculated to examine the magnitude of difference within and between groups at each time point. BIL and UNI groups improved their trained and nontrained strength exercise with an unclear difference in adaptation of squat strength (ES = -0.34 + 0.55). Both groups improved 20-m sprint (ES: BIL = -0.38 ± 0.49 and UNI = -0.31 ± 0.31); however, the difference between the groups was unclear (ES = 0.07 ± 0.58). Although both groups had meaningful improvements in COD performance, bilateral resistance training had a greater transfer to COD performance than unilateral resistance training (between-groups ES = 0.59 ± 0.64). Both bilateral and unilateral training improved maximal lower-body strength and sprint acceleration. However, the BIL group demonstrated superior improvements in COD performance. This finding potentially highlights the importance of targeting the underlying physiological stimulus that drives adaptation and not exercise selection based on movement specificity of the target performance.",
      publicationTypes: ["Journal Article", "Randomized Controlled Trial"],
      meshTerms: [
        "Acceleration",
        "Adaptation, Physiological",
        "Adolescent",
        "Adult",
        "Algorithms",
        "Athletic Performance",
        "Exercise Test",
        "Humans",
        "Male",
        "Muscle Strength",
        "Posture",
        "Resistance Training",
        "Running",
        "Young Adult",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "very_high",
      confidence: "high",
    },
    note: {
      entryNumber: 86,
      topic: "unilateral_bilateral_transfer_specificity",
      suppliedUse: "sprint/COD specificity.",
      studyDesignAndPopulation:
        "18-week randomized controlled training intervention in 33 trained team-sport athletes (rugby academy players, training age 5.4 ± 2.9 years).",
      interventionAndComparator:
        "Volume-load-matched bilateral resistance training (back squat) versus unilateral resistance training (step-up) performed twice weekly.",
      primaryOutcomes: "",
      directResults:
        "Both groups significantly improved maximal strength and 20-m sprint acceleration; however, the bilateral group demonstrated superior improvements in change of direction (COD) performance compared to the unilateral group (between-groups ES = 0.59).",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Step-up exercise lacked a significant eccentric phase present in the squat, potentially influencing COD results; confounding from concurrent high-load preseason rugby training; and lack of participant blinding.",
      evidenceTier: "very_high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "26200193",
      title:
        "Unilateral vs. Bilateral Squat Training for Strength, Sprints, and Agility in Academy Rugby Players.",
      authors: [
        "Derrick E Speirs",
        "Mark A Bennett",
        "Charlotte V Finn",
        "Anthony P Turner",
      ],
      journal: "Journal of strength and conditioning research",
      year: "2016",
      volume: "30",
      issue: "2",
      pagesOrElocation: "386-92",
      doi: "10.1519/JSC.0000000000001096",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/26200193/",
      pmcFullTextUrl: "",
      abstract:
        "The purpose of this study was to investigate the effects of a 5-week lower-limb unilateral or bilateral strength program on measures of strength, sprinting, and change of direction speed. Eighteen academy rugby players (18.1 ± 0.5 years, 97.4 ± 11.3 kg, 183.7 ± 11.3 cm) were randomly assigned to either a unilateral (UNI) or bilateral (BI) group. The UNI group squatted exclusively with the rear elevated split squat (RESS), whereas the BI group trained only with the bilateral back squat (BS). Both groups trained at a relative percentage of the respective 1 repetition maximum (1RM) twice weekly over a 5-week period. Subjects were assessed at baseline and postintervention for 1RM BS, 1RM RESS, 10-m sprint, 40-m sprint, and pro-agility. There was a significant main effect of time for 1RM BS (F1,16 = 86.5, p < 0.001), ES (0.84 < Cohen d < 0.92), 1RM RESS (F1,16 = 133.0, p < 0.001), ES (0.89 < Cohen d < 0.94), 40-m sprint (F1,16 = 14.4, p = 0.002), ES (0.47 < Cohen d < 0.67) and pro-agility (F1,16 = 55.9, p < 0.001), ES (0.77 < Cohen d < 0.89), but not 10-m sprints (F1,16 = 2.69, p = 0.121), ES (0.14 < Cohen d < 0.38). No significant interactions between group and time were observed for any of the dependent variables. This is the first study to suggest that BI and UNI training interventions may be equally efficacious in improving measures of lower-body strength, 40-m speed, and change of direction in academy level rugby players.",
      publicationTypes: ["Journal Article"],
      meshTerms: [
        "Adolescent",
        "Athletic Performance",
        "Football",
        "Humans",
        "Lower Extremity",
        "Male",
        "Muscle Strength",
        "Physical Conditioning, Human",
        "Random Allocation",
        "Running",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "very_high",
      confidence: "high",
    },
    note: {
      entryNumber: 87,
      topic: "unilateral_bilateral_transfer_specificity",
      suppliedUse: "rugby transfer.",
      studyDesignAndPopulation:
        "5-week randomized longitudinal strength-training intervention in 18 academy rugby players (mean age 18.1 years) with at least one year of resistance training experience.",
      interventionAndComparator:
        "Unilateral training (rear elevated split squat) versus bilateral training (bilateral back squat) performed twice weekly.",
      primaryOutcomes: "",
      directResults:
        "Both groups significantly improved 1RM back squat (UNI: 5.7%; BI: 5.0%), 1RM rear elevated split squat (UNI: 9.2%; BI: 10.5%), 40-m sprint (ES 0.47–0.67), and pro-agility (ES 0.77–0.89); no significant differences were found between groups for any measure.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Short 5-week intervention duration in a specific cohort of trained adolescent rugby players; lack of significant improvement in 10-m sprint times.",
      evidenceTier: "very_high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "28936703",
      title:
        "Cross-education of muscular strength following unilateral resistance training: a meta-analysis.",
      authors: ["A Manca", "D Dragone", "Z Dvir", "Franca Deriu"],
      journal: "European journal of applied physiology",
      year: "2017",
      volume: "117",
      issue: "11",
      pagesOrElocation: "2335-2354",
      doi: "10.1007/s00421-017-3720-z",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/28936703/",
      pmcFullTextUrl: "",
      abstract:
        "Cross-education (CE) of strength is a well-known phenomenon whereby exercise of one limb can induce strength gains in the contralateral untrained limb. The only available meta-analyses on CE, which date back to a decade ago, estimated a modest 7.8% increase in contralateral strength following unilateral training. However, in recent years new evidences have outlined larger contralateral gains, which deserve to be systematically evaluated. Therefore, the aim of this meta-analysis was to appraise current data on CE and determine its overall magnitude of effect.\n\nFive databases were searched from inception to December 2016. All randomized controlled trials focusing on unilateral resistance training were carefully checked by two reviewers who also assessed the eligibility of the identified trials and extracted data independently. The risk of bias was assessed using the Cochrane Risk-of-Bias tool.\n\nThirty-one studies entered the meta-analysis. Data from 785 subjects were pooled and subgroup analyses by body region (upper/lower limb) and type of training (isometric/concentric/eccentric/isotonic-dynamic) were performed. The pooled estimate of CE was a significant 11.9% contralateral increase (95% CI 9.1-14.8; p < 0.00001; upper limb: + 9.4%, p < 0.00001; lower limb: + 16.4%, p < 0.00001). Significant CE effects were induced by isometric (8.2%; p = 0.0003), concentric (11.3%; p < 0.00001), eccentric (17.7%; p = 0.003) and isotonic-dynamic training (15.9%; p < 0.00001), although a high risk of bias was detected across the studies.\n\nUnilateral resistance training induces significant contraction type-dependent gains in the contralateral untrained limb. Methodological issues in the included studies are outlined to provide guidance for a reliable quantification of CE in future studies.",
      publicationTypes: ["Journal Article", "Meta-Analysis"],
      meshTerms: [
        "Humans",
        "Muscle Strength",
        "Muscle, Skeletal",
        "Randomized Controlled Trials as Topic",
        "Resistance Training",
      ],
      keywords: [
        "Contralateral training",
        "Meta-analysis",
        "Resistance training",
        "Strength",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "review",
      confidence: "high",
    },
    note: {
      entryNumber: 88,
      topic: "unilateral_bilateral_transfer_specificity",
      suppliedUse: "cross-education.",
      studyDesignAndPopulation:
        "Meta-analysis of 31 randomized controlled trials involving 785 subjects.",
      interventionAndComparator:
        "Unilateral resistance training compared to the contralateral untrained limb.",
      primaryOutcomes: "",
      directResults:
        "Pooled estimate showed a significant 11.9% increase in contralateral strength (95% CI 9.1–14.8%; p < 0.00001); subgroup analysis revealed gains of 16.4% in lower limbs and 9.4% in upper limbs; eccentric (17.7%), isotonic-dynamic (15.9%), concentric (11.3%), and isometric (8.2%) training all induced significant effects.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Meta-analysis restricted by a high risk of bias across primary studies and results are highly specific to contraction type.",
      evidenceTier: "review",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "37582807",
      title:
        "Effect of free-weight vs. machine-based strength training on maximal strength, hypertrophy and jump performance - a systematic review and meta-analysis.",
      authors: [
        "Markus E Haugen",
        "Fredrik T Vårvik",
        "Stian Larsen",
        "Arvid S Haugen",
        "Roland van den Tillaar",
        "Thomas Bjørnsen",
      ],
      journal: "BMC sports science, medicine & rehabilitation",
      year: "2023",
      volume: "15",
      issue: "1",
      pagesOrElocation: "103",
      doi: "10.1186/s13102-023-00713-4",
      pmcid: "PMC10426227",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/37582807/",
      pmcFullTextUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10426227/",
      abstract:
        "The effectiveness of strength training with free-weight vs. machine equipment is heavily debated. Thus, the purpose of this meta-analysis was to summarize the data on the effect of free-weight versus machine-based strength training on maximal strength, jump height and hypertrophy.\n\nThe review was conducted in accordance with the preferred reporting items for systematic reviews and meta-analyses (PRISMA) guidelines, and the systematic search of literature was conducted up to January 1st, 2023. Studies that directly compared free-weight vs. machine-based strength training for a minimum of 6 weeks in adults (18-60 yrs.) were included.\n\nThirteen studies (outcomes: maximal strength [n = 12], jump performance [n = 5], muscle hypertrophy [n = 5]) with a total sample of 1016 participants (789 men, 219 women) were included. Strength in free-weight tests increased significantly more with free-weight training than with machines (SMD: -0.210, CI: -0.391, -0.029, p = 0.023), while strength in machine-based tests tended to increase more with machine training than with free-weights (SMD: 0.291, CI: -0.017, 0.600, p = 0.064). However, no differences were found between modalities in direct comparison (free-weight strength vs. machine strength) for dynamic strength (SMD: 0.084, CI: -0.106, 0.273, p = 0.387), isometric strength (SMD: -0.079, CI: -0.432, 0.273, p = 0.660), countermovement jump (SMD: -0.209, CI: -0.597, 0.179, p = 0.290) and hypertrophy (SMD: -0.055, CI: -0.397, 0.287, p = 0.751).\n\nNo differences were detected in the direct comparison of strength, jump performance and muscle hypertrophy. Current body of evidence indicates that strength changes are specific to the training modality, and the choice between free-weights and machines are down to individual preferences and goals.",
      publicationTypes: ["Journal Article"],
      meshTerms: [],
      keywords: [
        "Equipment",
        "Exercise",
        "Force production",
        "Modalities",
        "Muscle size",
        "Resistance training",
        "Stability",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "FULL_TEXT_VERIFIED",
      evidenceTier: "review",
      confidence: "high",
    },
    note: {
      entryNumber: 89,
      topic: "unilateral_bilateral_transfer_specificity",
      suppliedUse: "exercise modality.",
      studyDesignAndPopulation:
        "Systematic review and meta-analysis of 13 experimental studies involving 681 healthy adults (ages 18–60) ranging from untrained to trained status.",
      interventionAndComparator:
        "Free-weight strength training compared to machine-based strength training for a minimum duration of 6 weeks.",
      primaryOutcomes:
        "Maximal dynamic strength, isometric strength, muscle hypertrophy, and countermovement jump height.",
      directResults:
        "Meta-analysis of 13 studies found no significant differences between free-weight and machine-based training for maximal dynamic strength (ES: 0.922 vs. 0.970), isometric strength (ES: 0.270 vs. 0.198), hypertrophy (ES: 0.251 vs. 0.206), or countermovement jump performance (ES: 0.496 vs. 0.273). Strength gains were highly specific to the training modality, where free-weight training was superior when tested with free weights and machine training tended toward superiority in machine-based tests. Sub-analysis revealed a significant difference favoring machine training for upper-body strength, while no difference was observed for lower-body strength.",
      implementationImplication:
        "Select training modality based on specific performance requirements or personal preference, as both free weights and machines effectively drive hypertrophy and general strength adaptations.",
      limitations:
        "Small number of studies for hypertrophy and jump outcomes, reliance on indirect body composition measures in several trials, and relatively short average intervention duration of 9 weeks.",
      evidenceTier: "review",
      reviewStatus: "FULL_TEXT_VERIFIED",
      confidence: "high",
      noteSource: "PMC full-text sections retrieved through NCBI EFetch",
    },
  },
  {
    study: {
      pmid: "34609100",
      title:
        "Machines and free weight exercises: a systematic review and meta-analysis comparing changes in muscle size, strength, and power.",
      authors: ["Kyle A Heidel", "Zachary J Novak", "Scott J Dankel"],
      journal: "The Journal of sports medicine and physical fitness",
      year: "2022",
      volume: "62",
      issue: "8",
      pagesOrElocation: "1061-1070",
      doi: "10.23736/S0022-4707.21.12929-9",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/34609100/",
      pmcFullTextUrl: "",
      abstract:
        'The aim of this study was to compare changes in muscle size, strength, and power between free-weight and machine-based exercises.\n\nThe online databases of Pubmed, Scopus, and Web of Science were each searched using the following terms: "free weights" OR barbells OR dumbbells AND machines" up until September 15, 2020. A three-level random effects meta-analytic model was used to compute effect sizes.\n\nWhen strength was tested using a free-weight exercise, individuals training with free-weights gained more strength than those training with machines (ES: 0.655; [95% CI: 0.269, 1.041]). When strength was tested a machine-based exercise incorporated as part of the machine-based training program, individuals training with machines gained more strength than those training with free-weights (ES: -0.784 [95% CI: -1.223, -0.344]). When strength was tested using a neutral device, machines and free-weight exercises resulted in similar strength gains (ES: 0.128 [95% CI: -0303, 0.559]). There were no differences in the change in power (ES: -0.049 [95% CI: -0.557, 0.460]) or muscle hypertrophy (ES: -0.01 [95% CI: -0.525, 0.545]) between exercise modes.\n\nIndividuals looking to increase strength and power should consider the specificity of exercise, and how their strength and power will be tested and applied. Individuals looking to increase general strength and muscle mass to maintain health may choose whichever activity they prefer and are more likely to adhere to.',
      publicationTypes: [
        "Journal Article",
        "Meta-Analysis",
        "Systematic Review",
      ],
      meshTerms: [
        "Exercise",
        "Exercise Therapy",
        "Humans",
        "Muscle Strength",
        "Muscle, Skeletal",
        "Resistance Training",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "review",
      confidence: "high",
    },
    note: {
      entryNumber: 90,
      topic: "unilateral_bilateral_transfer_specificity",
      suppliedUse: "modality comparison.",
      studyDesignAndPopulation:
        "Systematic review and meta-analysis of longitudinal resistance training studies comparing free weights to machines.",
      interventionAndComparator:
        "Free-weight resistance training versus machine-based resistance training.",
      primaryOutcomes: "",
      directResults:
        "Strength gains were specific to the training mode (free weights superior for free-weight tests, ES: 0.655; machines superior for machine tests, ES: -0.784), while no significant differences were found for neutral strength tests (ES: 0.128), muscle hypertrophy (ES: -0.01), or power (ES: -0.049).",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Strength outcomes are highly dependent on the specificity of the testing modality; results may not generalize to all populations or sport-specific transfers.",
      evidenceTier: "review",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "41316621",
      title:
        "Comparable regional hypertrophy of the knee extensor muscles in response to resistance training with machines versus free weights: a randomized within-subject approach.",
      authors: [
        "Magellan T Amanuma",
        "Pedro Luiz T Ikeda",
        "Mariana T Sakamoto",
        "Julio Cesar Justino",
        "Nicollas Silva Abreu",
        "Maria Vitória de Sena Silva",
        "Vitor de Salles Painelli",
      ],
      journal: "Journal of bodywork and movement therapies",
      year: "2025",
      volume: "45",
      issue: "",
      pagesOrElocation: "562-568",
      doi: "10.1016/j.jbmt.2025.09.027",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/41316621/",
      pmcFullTextUrl: "",
      abstract:
        "Muscle hypertrophy response to resistance training (RT) with machines and free weights is widely debated in the literature. Understanding which form of exercise is superior for muscle hypertrophy has therapeutic and ergogenic repercussions.\n\nTherefore, we compared muscle hypertrophy response between RT performed with free weights (FW) vs. machines (MACH).\n\nRandomized within-subject design.\n\nEight young, healthy, untrained women (age: 22 ± 5 years; 62.0 ± 8.7 kg; 1.71 ± 0.05 m; BMI: 21.4 ± 3.3 kg m2) had each of their legs submitted to RT with FW or MACH. RT included exercises targeting the knee extensor muscles (FW: lunge; MACH: inclined leg press), 3 days·week-1, for 9 weeks. Muscle hypertrophy was determined pre- and post-RT through ultrasound to assess MT of the vastus lateralis (VL) and rectus femoris (RF) at their proximal (50 %) and distal (70 %) portions. The Mixed Model was conducted for data analysis, with significance set at p ≤ 0.05.\n\nNo between-group differences were identified for any of the muscles and portions before RT (all comparisons, p > 0.05). MT increases were detected for both FW and MACH in RF50 % (respectively, +10.7 %, p = 0.027; and +8.9 %, p = 0.051), RF70 % (respectively, +24.8 %, p = 0.019; and +27.3 %, p = 0.017), VL50 % (respectively, +13.3 %, p = 0.011; and +12.1 %, p = 0.031) and VL70 % (respectively, +12.7 %, p = 0.046; and +15.7 %, p = 0.016), indicating that RT-induced muscle hypertrophy occurred across all muscles and portions. However, Group × Time interaction was not identified for RF50 % (p = 0.816), RF70 % (p = 0.588), VL50 % (p = 0.679) or VL70 % (p = 0.635) MT values.\n\nFW and MACH were comparably effective to induce muscle hypertrophy in previously untrained women.",
      publicationTypes: [
        "Journal Article",
        "Randomized Controlled Trial",
        "Research Support, Non-U.S. Gov't",
      ],
      meshTerms: [
        "Adult",
        "Female",
        "Humans",
        "Young Adult",
        "Hypertrophy",
        "Knee",
        "Muscle Strength",
        "Muscle, Skeletal",
        "Quadriceps Muscle",
        "Resistance Training",
        "Ultrasonography",
        "Adolescent",
      ],
      keywords: [
        "Equipment and supplies",
        "Exercise",
        "Hypertrophy",
        "Muscle strength",
        "Physiological adaptation",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "very_high",
      confidence: "high",
    },
    note: {
      entryNumber: 91,
      topic: "unilateral_bilateral_transfer_specificity",
      suppliedUse: "regional quadriceps hypertrophy.",
      studyDesignAndPopulation:
        "9-week randomized within-subject resistance-training intervention in 8 healthy untrained young women.",
      interventionAndComparator:
        "Resistance training with free weights (lunge) versus machines (inclined leg press).",
      primaryOutcomes: "",
      directResults:
        "Significant muscle thickness increases in both groups for rectus femoris and vastus lateralis at both 50% and 70% of femur length; no significant differences between free weights (lunge) and machines (leg press) were observed for any muscle region.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Small sample size of eight participants; findings in untrained women may not generalize to other populations; lunge and leg press represent different movement mechanics beyond just the equipment type.",
      evidenceTier: "very_high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "26063470",
      title:
        "The Optimal Load for Maximal Power Production During Lower-Body Resistance Exercises: A Meta-Analysis.",
      authors: [
        "Marco A Soriano",
        "Pedro Jiménez-Reyes",
        "Matthew R Rhea",
        "Pedro J Marín",
      ],
      journal: "Sports medicine (Auckland, N.Z.)",
      year: "2015",
      volume: "45",
      issue: "8",
      pagesOrElocation: "1191-205",
      doi: "10.1007/s40279-015-0341-8",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/26063470/",
      pmcFullTextUrl: "",
      abstract:
        "The development of muscular power is often a key focus of sports performance enhancement programs.\n\nThe purpose of this meta-analysis was to examine the effect of load on peak power during the squat, jump squat, power clean, and hang power clean, thus integrating the findings of various studies to provide the strength and conditioning professional with more reliable evidence upon which to base their program design.\n\nA search of electronic databases [MEDLINE (SPORTDiscus), PubMed, Google Scholar, and Web of Science] was conducted to identify all publications up to 30 June 2014. Hedges' g (95% confidence interval) was estimated using a weighted random-effect model. A total of 27 studies with 468 subjects and 5766 effect sizes met the inclusion criterion and were included in the statistical analyses. Load in each study was labeled as one of three intensity zones: Zone 1 represented an average intensity ranging from 0 to 30% of one repetition maximum (1RM); Zone 2 between 30 and 70% of 1RM; and Zone 3 ≥70% of 1RM.\n\nThese results showed different optimal loads for each exercise examined. Moderate loads (from >30 to <70% of 1RM) appear to provide the optimal load for power production in the squat exercise. Lighter loads (≤30% of 1RM) showed the highest peak power production in the jump squat. Heavier loads (≥70% of 1RM) resulted in greater peak power production in the power clean and hang power clean.\n\nOur meta-analysis of results from the published literature provides evidence for exercise-specific optimal loads for power production.",
      publicationTypes: ["Journal Article", "Meta-Analysis"],
      meshTerms: [
        "Humans",
        "Muscle Strength",
        "Resistance Training",
        "Weight Lifting",
        "Weight-Bearing",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "review",
      confidence: "high",
    },
    note: {
      entryNumber: 92,
      topic: "power_ballistic_weightlifting_derivatives",
      suppliedUse: "optimal loading for power.",
      studyDesignAndPopulation:
        "Meta-analysis of 27 studies involving 468 subjects and 5766 effect sizes.",
      interventionAndComparator:
        "Comparison of three load intensity zones (0-30%, 30-70%, and ≥70% 1RM) on peak power production across four lower-body exercises.",
      primaryOutcomes: "",
      directResults:
        "Optimal loads for peak power are exercise-specific; moderate loads (30-70% 1RM) were optimal for the squat, lighter loads (≤30% 1RM) for the jump squat, and heavier loads (≥70% 1RM) for the power clean and hang power clean.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Meta-analysis of published literature with potential for publication bias; results are exercise-specific and may vary based on individual training status or technique.",
      evidenceTier: "review",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "17277599",
      title:
        "Optimal loading for maximal power output during lower-body resistance exercises.",
      authors: [
        "Prue Cormie",
        "Grant O McCaulley",
        "N Travis Triplett",
        "Jeffrey M McBride",
      ],
      journal: "Medicine and science in sports and exercise",
      year: "2007",
      volume: "39",
      issue: "2",
      pagesOrElocation: "340-9",
      doi: "10.1249/01.mss.0000246993.71599.bf",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/17277599/",
      pmcFullTextUrl: "",
      abstract:
        "The influence of various loads on power output in the jump squat (JS), squat (S), and power clean (PC) was examined to determine the load that maximizes power output in each lift.\n\nTwelve Division I male athletes participated in four testing sessions. The first session involved performing one-repetition maximums (1RM) in the S and PC, followed by three randomized testing sessions involving either the JS, S, or PC. Peak force, velocity, and power were calculated across loads of 0, 12, 27, 42, 56, 71, and 85% of each subject's 1RM in the JS and S and at 10% intervals from 30 to 90% of each subject's 1RM in the PC.\n\nThe optimal load for the JS was 0% of 1RM; absolute peak power was significantly lower from the optimal load at 42, 56, 71, and 85% of 1RM (P < or = 0.05), whereas peak power relative to body mass was significantly lower at 27% of 1RM in addition to 42, 56, 71, and 85% of 1RM. Peak power in the S was maximized at 56% of 1RM; however, power was not significantly different across the loading spectrum. The optimal load in the PC occurred at 80% of 1RM. Relative peak power at 80% of 1RM was significantly different from the 30 and 40% of 1RM.\n\nThis investigation indicates that the optimal load for maximal power output occurs at various percentages of 1RM in the JS, S, and PC.",
      publicationTypes: [
        "Comparative Study",
        "Journal Article",
        "Research Support, Non-U.S. Gov't",
      ],
      meshTerms: [
        "Adult",
        "Exercise Test",
        "Humans",
        "Leg",
        "Male",
        "Prospective Studies",
        "Sports",
        "Weight Lifting",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "high",
      confidence: "high",
    },
    note: {
      entryNumber: 93,
      topic: "power_ballistic_weightlifting_derivatives",
      suppliedUse: "jump squat, squat and power clean loading.",
      studyDesignAndPopulation:
        "Randomized cross-sectional kinetic analysis in 12 Division I male athletes.",
      interventionAndComparator:
        "Comparison of power output across loading intensities of 0–85% 1RM (jump squat and squat) and 30–90% 1RM (power clean).",
      primaryOutcomes: "",
      directResults:
        "Optimal load for peak power was 0% 1RM for jump squat, 56% 1RM for squat (though not significantly different across loads), and 80% 1RM for power clean; jump squat power was significantly lower at loads ≥42% 1RM.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Elite male athlete population and cross-sectional design; results do not directly demonstrate long-term training adaptations or sport transfer.",
      evidenceTier: "high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "11708714",
      title:
        "The load that maximizes the average mechanical power output during jump squats in power-trained athletes.",
      authors: ["D Baker", "S Nance", "M Moore"],
      journal: "Journal of strength and conditioning research",
      year: "2001",
      volume: "15",
      issue: "1",
      pagesOrElocation: "92-7",
      doi: "",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/11708714/",
      pmcFullTextUrl: "",
      abstract:
        "Three studies that used rugby league players experienced in power training methods as subjects were performed to investigate the resistance (percentage of 1 repetition maximum [1RM]) that maximized the average mechanical power output (Pmax) during the jump squat exercise. Maximum strength was assessed via 1RM (studies 2 and 3) or 3RM (study 1) during the full-squat exercise. Pmax was assessed during barbell jump squats, using resistances of 40, 60, 80, and 100 kg within the Plyometric Power System. All studies found that power output was maximized by resistances averaging circa 85-95 kg, representing 55-59% of 1RM full-squat strength. However, loads in the range of 47-63% of 1RM were often similarly effective in maximizing power output. The results of this investigation suggest that athletes specifically trained via both maximal strength and power training methods may generate their maximal power outputs at higher percentages of 1RM than those previously reported for solely strength-trained athletes and that there would appear to be an effective range of resistances for maximizing power output.",
      publicationTypes: [
        "Clinical Trial",
        "Comparative Study",
        "Journal Article",
      ],
      meshTerms: [
        "Adolescent",
        "Adult",
        "Arm",
        "Biomechanical Phenomena",
        "Football",
        "Humans",
        "Leg",
        "Male",
        "Muscle, Skeletal",
        "Physical Education and Training",
        "Task Performance and Analysis",
        "Weight Lifting",
        "Weight-Bearing",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "high",
      confidence: "high",
    },
    note: {
      entryNumber: 94,
      topic: "power_ballistic_weightlifting_derivatives",
      suppliedUse: "jump-squat loading.",
      studyDesignAndPopulation:
        "Three cross-sectional studies in 73 male rugby league players (professional, semiprofessional, and college-aged) experienced in power training.",
      interventionAndComparator:
        "Barbell jump squats at 40, 60, 80, 100, and 120 kg versus 1RM (or 3RM) full-squat strength.",
      primaryOutcomes: "",
      directResults:
        "Average mechanical power was maximized at loads of 55-59% 1RM (approx. 85-95 kg); a broader range of 47-63% 1RM produced statistically similar power outputs.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Acute cross-sectional assessment in a specific athletic population; results may not generalize to untrained individuals or different exercises.",
      evidenceTier: "high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "32336212",
      title:
        "Mechanical power production assessment during weightlifting exercises. A systematic review.",
      authors: [
        "Marcos A Soriano",
        "Kristof Kipp",
        "Jason P Lake",
        "Timothy J Suchomel",
        "Pedro J Marín",
        "María P Sainz De Baranda",
        "Paul Comfort",
      ],
      journal: "Sports biomechanics",
      year: "2023",
      volume: "22",
      issue: "5",
      pagesOrElocation: "633-659",
      doi: "10.1080/14763141.2020.1747529",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/32336212/",
      pmcFullTextUrl: "",
      abstract:
        "The assessment of the mechanical power production is of great importance for researchers and practitioners. The purpose of this review was to compare the differences in ground reaction force (GRF), kinematic, and combined (bar velocity x GRF) methods to assess mechanical power production during weightlifting exercises. A search of electronic databases was conducted to identify all publications up to 31 May 2019. The peak power output (PPO) was selected as the key variable. The exercises included in this review were clean variations, which includes the hang power clean (HPC), power clean (PC) and clean. A total of 26 articles met the inclusion criteria with 53.9% using the GRF, 38.5% combined, and 30.8% the kinematic method. Articles were evaluated and descriptively analysed to enable comparison between methods. The three methods have inherent methodological differences in the data analysis and measurement systems, which suggests that these methods should not be used interchangeably to assess PPO in Watts during weightlifting exercises. In addition, this review provides evidence and rationale for the use of the GRF to assess power production applied to the system mass while the kinematic method may be more appropriate when looking to assess only the power applied to the barbell.",
      publicationTypes: ["Systematic Review", "Journal Article"],
      meshTerms: [
        "Humans",
        "Biomechanical Phenomena",
        "Muscle, Skeletal",
        "Weight Lifting",
        "Exercise",
        "Muscle Strength",
      ],
      keywords: [
        "Peak power output",
        "force platform",
        "kinematics",
        "kinetics",
        "power clean",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "review",
      confidence: "high",
    },
    note: {
      entryNumber: 95,
      topic: "power_ballistic_weightlifting_derivatives",
      suppliedUse: "Olympic lifting and derivatives.",
      studyDesignAndPopulation:
        "Systematic review of 26 studies published through May 2019 evaluating peak power output during clean variations.",
      interventionAndComparator:
        "Comparison of ground reaction force (GRF), kinematic (barbell velocity), and combined (barbell velocity x GRF) assessment methods.",
      primaryOutcomes: "",
      directResults:
        "Methodological differences in data analysis and measurement systems indicate that GRF, kinematic, and combined methods are not interchangeable for peak power output; GRF is suited for system mass power, while kinematics are appropriate for barbell-only power.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Methodological heterogeneity across reviewed studies; findings specific to clean variations (HPC, PC, clean).",
      evidenceTier: "review",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "25689955",
      title:
        "Weightlifting pulling derivatives: rationale for implementation and application.",
      authors: ["Timothy J Suchomel", "Paul Comfort", "Michael H Stone"],
      journal: "Sports medicine (Auckland, N.Z.)",
      year: "2015",
      volume: "45",
      issue: "6",
      pagesOrElocation: "823-39",
      doi: "10.1007/s40279-015-0314-y",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/25689955/",
      pmcFullTextUrl: "",
      abstract:
        "This review article examines previous weightlifting literature and provides a rationale for the use of weightlifting pulling derivatives that eliminate the catch phase for athletes who are not competitive weightlifters. Practitioners should emphasize the completion of the triple extension movement during the second pull phase that is characteristic of weightlifting movements as this is likely to have the greatest transference to athletic performance that is dependent on hip, knee, and ankle extension. The clean pull, snatch pull, hang high pull, jump shrug, and mid-thigh pull are weightlifting pulling derivatives that can be used in the teaching progression of the full weightlifting movements and are thus less complex with regard to exercise technique. Previous literature suggests that the clean pull, snatch pull, hang high pull, jump shrug, and mid-thigh pull may provide a training stimulus that is as good as, if not better than, weightlifting movements that include the catch phase. Weightlifting pulling derivatives can be implemented throughout the training year, but an emphasis and de-emphasis should be used in order to meet the goals of particular training phases. When implementing weightlifting pulling derivatives, athletes must make a maximum effort, understand that pulling derivatives can be used for both technique work and building strength-power characteristics, and be coached with proper exercise technique. Future research should consider examining the effect of various loads on kinetic and kinematic characteristics of weightlifting pulling derivatives, training with full weightlifting movements as compared to training with weightlifting pulling derivatives, and how kinetic and kinematic variables vary between derivatives of the snatch.",
      publicationTypes: ["Journal Article", "Review"],
      meshTerms: [
        "Athletic Performance",
        "Biomechanical Phenomena",
        "Humans",
        "Muscle Strength",
        "Muscle, Skeletal",
        "Resistance Training",
        "Weight Lifting",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "other",
      confidence: "high",
    },
    note: {
      entryNumber: 96,
      topic: "power_ballistic_weightlifting_derivatives",
      suppliedUse:
        "clean pull, snatch pull, high pull, jump shrug, mid-thigh pull.",
      studyDesignAndPopulation:
        "Narrative review examining weightlifting literature for athletes who are not competitive weightlifters.",
      interventionAndComparator:
        "Weightlifting pulling derivatives (clean pull, snatch pull, hang high pull, jump shrug, mid-thigh pull) versus full weightlifting movements with a catch phase.",
      primaryOutcomes: "",
      directResults:
        "Weightlifting pulling derivatives provide a training stimulus comparable or superior to catching derivatives; triple extension during the second pull phase is the primary mechanism for athletic transference; derivatives offer reduced technical complexity for non-weightlifters.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Narrative review based on existing literature; not a primary intervention study; requires further research on load-specific kinetics and kinematic differences.",
      evidenceTier: "other",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "28912659",
      title: "Power-Time Curve Comparison between Weightlifting Derivatives.",
      authors: ["Timothy J Suchomel", "Christopher J Sole"],
      journal: "Journal of sports science & medicine",
      year: "2017",
      volume: "16",
      issue: "3",
      pagesOrElocation: "407-413",
      doi: "",
      pmcid: "PMC5592293",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/28912659/",
      pmcFullTextUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5592293/",
      abstract:
        "This study examined the power production differences between weightlifting derivatives through a comparison of power-time (P-t) curves. Thirteen resistance-trained males performed hang power clean (HPC), jump shrug (JS), and hang high pull (HHP) repetitions at relative loads of 30%, 45%, 65%, and 80% of their one repetition maximum (1RM) HPC. Relative peak power (PPRel), work (WRel), and P-t curves were compared. The JS produced greater PPRel than the HPC (p < 0.001, d = 2.53) and the HHP (p < 0.001, d = 2.14). In addition, the HHP PPRel was statistically greater than the HPC (p = 0.008, d = 0.80). Similarly, the JS produced greater WRel compared to the HPC (p < 0.001, d = 1.89) and HHP (p < 0.001, d = 1.42). Furthermore, HHP WRel was statistically greater than the HPC (p = 0.003, d = 0.73). The P-t profiles of each exercise were similar during the first 80-85% of the movement; however, during the final 15-20% of the movement the P-t profile of the JS was found to be greater than the HPC and HHP. The JS produced greater PPRel and WRel compared to the HPC and HHP with large effect size differences. The HHP produced greater PPRel and WRel than the HPC with moderate effect size differences. The JS and HHP produced markedly different P-t profiles in the final 15-20% of the movement compared to the HPC. Thus, these exercises may be superior methods of training to enhance PPRel. The greatest differences in PPRel between the JS and HHP and the HPC occurred at lighter loads, suggesting that loads of 30-45% 1RM HPC may provide the best training stimulus when using the JS and HHP. In contrast, loads ranging 65-80% 1RM HPC may provide an optimal stimulus for power production during the HPC.",
      publicationTypes: ["Journal Article"],
      meshTerms: [],
      keywords: [
        "Hang power clean",
        "hang high pull",
        "jump shrug",
        "mechanical work",
        "time normalization",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "high",
      confidence: "high",
    },
    note: {
      entryNumber: 97,
      topic: "power_ballistic_weightlifting_derivatives",
      suppliedUse: "hang power clean, jump shrug and hang high pull.",
      studyDesignAndPopulation:
        "Repeated measures biomechanical study in 13 resistance-trained males.",
      interventionAndComparator:
        "Hang power clean (HPC), jump shrug (JS), and hang high pull (HHP) across four relative loads (30%, 45%, 65%, 80% 1RM HPC).",
      primaryOutcomes: "",
      directResults:
        "Jump shrug produced significantly greater relative peak power and work than both HPC and HHP across all loads; HHP was superior to HPC in power and work at lighter loads; JS and HHP maintained higher power outputs in the final 15-20% of the movement compared to HPC.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Acute biomechanical comparison in a small sample of trained males; use of HPC 1RM for JS and HHP loading; no longitudinal data or direct sport-transfer evidence.",
      evidenceTier: "high",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "27699699",
      title:
        "The Optimal Load for Maximal Power Production During Upper-Body Resistance Exercises: A Meta-Analysis.",
      authors: ["Marco Antonio Soriano", "Timothy J Suchomel", "Pedro J Marín"],
      journal: "Sports medicine (Auckland, N.Z.)",
      year: "2017",
      volume: "47",
      issue: "4",
      pagesOrElocation: "757-768",
      doi: "10.1007/s40279-016-0626-6",
      pmcid: "",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/27699699/",
      pmcFullTextUrl: "",
      abstract:
        "External mechanical power is considered to be one of the most important characteristics with regard to sport performance.\n\nThe purpose of this meta-analysis was to examine the effect of load on kinetic variables such as mean and peak power during bench press and bench press throw, thus integrating the findings of various studies to provide the strength and conditioning professional with more reliable evidence upon which to base their program design.\n\nA search of electronic databases (MEDLINE, PubMed, Google Scholar, and Web of Science) was conducted to identify all publications up to 31 October 2015. Hedges' g (95 % confidence interval) was estimated using a weighted random-effect model, due to the heterogeneity (I 2) of the studies. Egger's test was used to evaluate possible publication bias in the meta-analysis. A total of 11 studies with 434 subjects and 7680 effect sizes met the inclusion criterion and were included in the statistical analyses. Load in each study was labeled as one of three intensity zones: zone 1 represented an average intensity ranging from 0 to 30 % of one repetition maximum (1RM); zone 2 between 30 and 70 % of 1RM; and zone 3 ≥ 70 % of 1RM.\n\nThese results showed different optimal loads for each exercise examined. Moderate loads (from >30 to <70 % of 1RM) appear to provide the optimal load for peak power and mean power in the bench press exercise. Lighter loads (<30 % of 1RM) appear to provide the highest mean and highest peak power production in the bench press throw exercise. However, a substantial heterogeneity was detected I 2 > 75 %.\n\nThe current meta-analysis of published literature provides evidence for exercise-specific optimal power loading for upper body exercises.",
      publicationTypes: ["Journal Article", "Meta-Analysis", "Review"],
      meshTerms: [
        "Exercise",
        "Exercise Therapy",
        "Humans",
        "Muscle Strength",
        "Muscle, Skeletal",
        "Resistance Training",
        "Sports",
        "Weight Lifting",
      ],
      keywords: [],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "ABSTRACT_VERIFIED",
      evidenceTier: "review",
      confidence: "high",
    },
    note: {
      entryNumber: 98,
      topic: "power_ballistic_weightlifting_derivatives",
      suppliedUse: "upper-body ballistic loading.",
      studyDesignAndPopulation:
        "Meta-analysis of 11 studies involving 434 healthy athletic subjects (adolescents and adults >15 years).",
      interventionAndComparator:
        "Comparison of three intensity zones (0-30%, 30-70%, and ≥70% 1RM) for peak and mean power during bench press and bench press throw.",
      primaryOutcomes: "",
      directResults:
        "Optimal loads for peak and mean power were 30-70% 1RM for the bench press and <30% 1RM for the bench press throw; results indicate exercise-specific loading requirements for maximal power.",
      implementationImplication:
        "Use only as a bounded input to goal-specific exercise selection; do not convert this evidence into a universal exercise score.",
      limitations:
        "Substantial heterogeneity (I² > 75%) among included studies; findings restricted to Smith machine upper-body exercises in healthy athletic populations.",
      evidenceTier: "review",
      reviewStatus: "ABSTRACT_VERIFIED",
      confidence: "high",
      noteSource:
        "Original PubMed record and abstract verified; full text not preserved in this bundle",
    },
  },
  {
    study: {
      pmid: "37833510",
      title:
        "Effects of Upper-Body Plyometric Training on Physical Fitness in Healthy Youth and Young Adult Participants: A Systematic Review with Meta-Analysis.",
      authors: [
        "Exal Garcia-Carrillo",
        "Rodrigo Ramirez-Campillo",
        "Rohit K Thapa",
        "José Afonso",
        "Urs Granacher",
        "Mikel Izquierdo",
      ],
      journal: "Sports medicine - open",
      year: "2023",
      volume: "9",
      issue: "1",
      pagesOrElocation: "93",
      doi: "10.1186/s40798-023-00631-2",
      pmcid: "PMC10575843",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/37833510/",
      pmcFullTextUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10575843/",
      abstract:
        "Upper-body plyometric training (UBPT) is a commonly used training method, yet its effects on physical fitness are inconsistent and there is a lack of comprehensive reviews on the topic.\n\nTo examine the effects of UBPT on physical fitness in healthy youth and young adult participants compared to active, specific-active, and passive controls.\n\nThis systematic review followed PRISMA 2020 guidelines and utilized the PICOS framework. PubMed, WOS, and SCOPUS were searched. Studies were assessed for eligibility using the PICOS framework. The effects of UBPT on upper-body physical fitness were assessed, including maximal strength, medicine ball throw performance, sport-specific throwing performance, and upper limb muscle volume. The risk of bias was evaluated using the PEDro scale. Means and standard deviations were used to calculate effect sizes, and the I2 statistic was used to assess heterogeneity. Publication bias was assessed using the extended Egger's test. Certainty of evidence was rated using the GRADE scale. Additional analyses included sensitivity analyses and adverse effects.\n\nThirty-five studies were included in the systematic review and 30 studies in meta-analyses, involving 1412 male and female participants from various sport-fitness backgrounds. Training duration ranged from 4 to 16 weeks. Compared to controls, UBPT improved maximal strength (small ES = 0.39 95% CI = 0.15-0.63, p = 0.002, I2 = 29.7%), medicine ball throw performance (moderate ES = 0.64, 95% CI = 0.43-0.85, p < 0.001, I2 = 46.3%), sport-specific throwing performance (small ES = 0.55, 95% CI = 0.25-0.86, p < 0.001, I2 = 36.8%), and upper limbs muscle volume (moderate ES = 0.64, 95% CI = 0.20-1.08, p = 0.005, I2 = 0.0%). The GRADE analyses provided low or very low certainty for the recommendation of UBPT for improving physical fitness in healthy participants. One study reported one participant with an injury due to UBPT. The other 34 included studies provided no report measure for adverse effects linked to UBPT.\n\nUBPT interventions may enhance physical fitness in healthy youth and young adult individuals compared to control conditions. However, the certainty of evidence for these recommendations is low or very low. Further research is needed to establish the optimal dose of UBPT and to determine its effect on female participants and its transfer to other upper-body dominated sports.",
      publicationTypes: ["Systematic Review", "Journal Article"],
      meshTerms: [],
      keywords: [
        "Athletic performance",
        "Human physical conditioning",
        "Muscle strength",
        "Musculoskeletal physiological phenomena",
        "Plyometric exercise",
        "Resistance training",
        "Sports medicine",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "FULL_TEXT_VERIFIED",
      evidenceTier: "review",
      confidence: "high",
    },
    note: {
      entryNumber: 99,
      topic: "power_ballistic_weightlifting_derivatives",
      suppliedUse: "upper-body plyometrics.",
      studyDesignAndPopulation:
        "This systematic review and meta-analysis included 35 studies (30 in meta-analysis) involving 1,412 healthy male and female youth and young adult participants from various sport-fitness backgrounds.",
      interventionAndComparator:
        "The intervention consisted of upper-body plyometric training (UBPT) programs (4–16 weeks duration) compared against active, specific-active, or non-active control groups.",
      primaryOutcomes:
        "The primary outcomes measured were maximal strength, medicine ball throw performance, sport-specific throwing performance, and upper limb muscle volume.",
      directResults:
        "Upper-body plyometric training (UBPT) significantly improved maximal strength (small ES = 0.39, 95% CI = 0.15–0.63, p = 0.002), medicine ball throw performance (moderate ES = 0.64, 95% CI = 0.43–0.85, p < 0.001), sport-specific throwing performance (small ES = 0.55, 95% CI = 0.25–0.86, p < 0.001), and upper limb muscle volume (moderate ES = 0.64, 95% CI = 0.20–1.08, p = 0.005) compared to control conditions. Heterogeneity was low to moderate (I2 = 0.0% to 46.3%), and only one study reported a participant injury.",
      implementationImplication:
        "UBPT can be programmed 2–3 times per week for 4–12 weeks to enhance upper-body power and hypertrophy in healthy youth and young adults, but practitioners should monitor for individual tolerance given the low certainty of evidence.",
      limitations:
        "The evidence is limited by low to very low GRADE certainty, a relative lack of female participants, and the need for further research to establish optimal dosing and long-term transfer to diverse upper-body sports.",
      evidenceTier: "review",
      reviewStatus: "FULL_TEXT_VERIFIED",
      confidence: "high",
      noteSource: "PMC full-text sections retrieved through NCBI EFetch",
    },
  },
  {
    study: {
      pmid: "39520628",
      title:
        "The Effect of Specific Strength Training on Throwing Velocity in Overarm Throwing: A Systematic Review.",
      authors: ["Andrea Bao Fredriksen", "Roland van den Tillaar"],
      journal: "Sports medicine - open",
      year: "2024",
      volume: "10",
      issue: "1",
      pagesOrElocation: "122",
      doi: "10.1186/s40798-024-00785-7",
      pmcid: "PMC11550301",
      pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/39520628/",
      pmcFullTextUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11550301/",
      abstract:
        "Throwing velocity is an important research topic in sports science, and it is an essential performance variable for athletes in overarm-throwing sports like baseball, team handball, water polo, softball, and cricket. The aim of the present review was to investigate the effect of specific strength training on throwing velocity for overarm throws.\n\nThe literature was analysed using the Preferred Reporting Items for Systematic reviews and Meta-analyses, searching in SPORTDiscus and MEDLINE. Seventeen studies were included in this review, and the training studies were divided into four categories: (a) overweight and underweight balls, (b) forearm loading, (c) pulley device training, and (d) strength training with a resistance band.\n\nAll strength training studies with resistance band and the forearm loading categories increased the throwing velocity, varying from 3.7 to 26%. However, only half of these studies found that training was associated with a significantly higher increase versus the control group. Findings were inconsistent in other categories.\n\nBased on the findings of the present review, no clear conclusion can be made on which of the specific strength training methods is best for increasing throwing velocity. However, some recommendations can be offered. Firstly, the throwing training period should be long enough (≥ 6 weeks) with a high enough workload. Throwing training with a resistance band increases throwing velocity significantly for junior and less experienced overarm-throwing athletes. Furthermore, throwing with underweighted balls of similar size will ensure a positive effect on throwing velocity. Also, throwing training with combined over- and underweighted balls can be used if the overweighted balls are carefully selected to ensure there is no negative impact on throwing kinematics and injuries. For the other categories, the results were conflicting. Furthermore, due to the low number of studies in the pulley device and forearm loading categories, more studies should be conducted to investigate their effects on throwing velocity.",
      publicationTypes: ["Journal Article", "Review"],
      meshTerms: [],
      keywords: [
        "Overweighted Balls",
        "Pulley Device",
        "Underweighted Balls",
        "Wearable Resistance",
      ],
      sourceMetadataStatus: "PUBMED_VERIFIED",
      reviewStatus: "FULL_TEXT_VERIFIED",
      evidenceTier: "review",
      confidence: "high",
    },
    note: {
      entryNumber: 100,
      topic: "power_ballistic_weightlifting_derivatives",
      suppliedUse: "exercise-to-sport transfer for throwing.",
      studyDesignAndPopulation:
        "Systematic review of 17 controlled intervention studies (12 handball, 2 cricket, 2 baseball, 1 softball) involving experienced junior/senior players and novices, primarily male (4 studies included females).",
      interventionAndComparator:
        "Specific strength training via over/underweighted balls, forearm loading, pulley devices, or resistance bands compared to normal training or volume-matched standard ball throwing.",
      primaryOutcomes: "Throwing velocity in overarm throwing.",
      directResults:
        "Specific strength training categories (resistance bands, over/underweighted balls, forearm loading, pulley devices) showed throwing velocity increases ranging from 3.7% to 26.1%, but only 8 of 17 studies demonstrated significantly greater improvements than control groups. Resistance band interventions yielded significant gains of 3.7–26.1% in 3 of 5 studies, while training with underweighted balls (20% lighter) significantly increased velocity by up to 11.2% in novice handball players compared to controls. Overweight ball training (3-kg medicine ball) also reported significant velocity increases of 22–24% in elite handball players.",
      implementationImplication:
        "Incorporate specific strength training, particularly resistance bands or underweighted balls, for at least 6 weeks to enhance overarm throwing velocity while monitoring for kinematic disruptions.",
      limitations:
        "Inconsistency in significant findings relative to control groups across all categories and a lack of data on female athletes and long-term adaptation beyond 10 weeks.",
      evidenceTier: "review",
      reviewStatus: "FULL_TEXT_VERIFIED",
      confidence: "high",
      noteSource: "PMC full-text sections retrieved through NCBI EFetch",
    },
  },
] as const;

export const evidenceModelRules: readonly EvidenceModelRule[] = [
  {
    ruleKey: "activation_not_equivalent_to_adaptation",
    ruleText:
      "Muscle activation is not equivalent to muscle force, mechanical tension, longitudinal hypertrophy, or sport transfer.",
  },
  {
    ruleKey: "evidence_hierarchy",
    ruleText:
      "Prefer direct longitudinal structural/adaptation and performance interventions; then direct kinetics/muscle force; then validated modeling; then high-density EMG; then surface EMG; then anatomical inference.",
  },
  {
    ruleKey: "exercise_utility_rule",
    ruleText:
      "Exercise utility depends on goal-specific adaptation, evidence confidence, muscle or movement relevance, progression potential, athlete compatibility, fatigue, joint stress, technical cost, redundancy, equipment, time cost, and sport interference.",
  },
  {
    ruleKey: "fulltext_rule",
    ruleText:
      "Only notes marked FULL_TEXT_VERIFIED may be represented as findings reviewed from preserved original full text. ABSTRACT_VERIFIED notes are limited to the verified PubMed record and abstract.",
  },
  {
    ruleKey: "modality_rule",
    ruleText:
      "Do not automatically privilege free weights over machines; use the modality that best matches the target stimulus, skill, stability, systemic cost, coordination, loadability, and movement relevance.",
  },
  {
    ruleKey: "regional_hypertrophy_rule",
    ruleText:
      "Store anatomical regions or heads when supported, rather than treating all muscles as uniform.",
  },
  {
    ruleKey: "rom_context_rule",
    ruleText:
      "Store range-of-motion findings with exercise, muscle, joint, muscle-length region, training status, load, and outcome. Never encode full ROM or lengthened partials as universally superior.",
  },
  {
    ruleKey: "specificity_rule",
    ruleText:
      "Separate muscle targeting, strength specificity, and sport transfer.",
  },
] as const;
