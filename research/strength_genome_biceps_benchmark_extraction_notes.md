# Strength Genome one-test benchmark extraction notes

Reviewed source: Piper T, Furman S, Smith T, Waller M. *Establishing Normative Data for 10RM Strength Scores in College-Aged Males.* International Journal of Strength and Conditioning. 2021;1(1). DOI: 10.47206/ijsc.v1i1.40.

## Findings preserved before deeper table extraction

- The study is a **college-aged male** sample only, ages **18–25**.
- The abstract reports **1,095 subjects** tested in one facility under NSCA-guided procedures.
- Exercises include **biceps curl** among several others.
- The study reports **bodyweight-category percentile break points**, which means any app benchmark from this source must stay narrow to an exact matched protocol.
- This source does **not** support a universal curl percentile for all users, all ages, both sexes, all equipment choices, or all repetition schemes.
- Next extraction task: capture the exact **biceps-curl 10RM bodyweight bands and percentile cut points** from the PDF tables, then decide whether the app currently collects enough athlete fields to expose a benchmark only for strict matches.

## Extracted adult curl table

Table 11 of the source provides **pre-training preacher-curl 10RM** percentile cut points in pounds for men aged 18–25. The protocol is a seated preacher-curl station with a 40-degree arm pad and a standard 22-pound EZ curl bar; it is **not** a standing straight-bar curl, dumbbell curl, generic multi-repetition curl, or estimated 1RM. The source bodyweight bands are below 135 lb, 135–150 lb, 150–165 lb, 165–190 lb, 190–210 lb, 210–240 lb, 240–270 lb, and above 270 lb. The extracted pre-training 50th-percentile loads are respectively 50, 55, 60, 65, 70, 70, 70, and 70 lb.

The source also reports percentile cut points by bodyweight band, but an app benchmark must require: male sex, age 18–25, the standardized preacher-curl station, the specified EZ-bar protocol, a directly observed 10RM, and a bodyweight-band match. The current Strength Genome entry fields do not yet enforce all of those source conditions. Therefore the table is retained for research only, and no generic curl rating is enabled from it.

## Publisher full-text verification — 2026-08-28

Publisher full text: <https://journal.iusca.org/index.php/Journal/article/view/40/102>. Downloadable text: <https://journal.iusca.org/index.php/Journal/article/download/40/101/293>.

The publisher text confirms that the eligible source population is **1,095 male college students aged 18–25**, with pre-training bodyweight categories of **≤135 lb**, **135.1–150 lb**, **150.1–165 lb**, **165.1–190 lb**, **190.1–210 lb**, **210.1–240 lb**, **240.1–270 lb**, and **≥270.1 lb**. Its 10RM definition is the highest load completed for 10 repetitions with good technique; test sets were directly observed, with no spotter assistance accepted. Subjects rested about three minutes between attempts and continued for at least five and no more than eight sets until the test was validated.

For the specific **pre-training preacher curl** test, the source requires the Body Masters BE 207 seated station with a 40° arm pad, a 22 lb York Olympic EZ curl bar (model 32042) and York plates; both feet and buttocks remain in contact, upper arms are flat on the pad, the grip is supinated, the downward phase ends at approximately 5–10° elbow flexion, and forward/backward trunk movement is prohibited. This is a source-specific protocol declaration, not a general preacher-curl label.

Table 11 pre-training percentile cut points, in pounds, were independently verified as follows:

| Percentile | ≤135 | 135.1–150 | 150.1–165 | 165.1–190 | 190.1–210 | 210.1–240 | 240.1–270 | ≥270.1 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 5th | 30.00 | 40.00 | 40.00 | 40.00 | 45.00 | 41.50 | 40.00 | 41.75 |
| 10th | 40.00 | 40.00 | 40.00 | 45.00 | 50.00 | 50.00 | 50.00 | 45.00 |
| 20th | 40.00 | 45.00 | 50.00 | 50.00 | 60.00 | 60.00 | 60.00 | 60.00 |
| 30th | 41.50 | 50.00 | 55.00 | 60.00 | 62.50 | 60.00 | 64.50 | 70.00 |
| 40th | 50.00 | 50.00 | 60.00 | 60.00 | 70.00 | 65.00 | 70.00 | 70.00 |
| 50th | 50.00 | 55.00 | 60.00 | 65.00 | 70.00 | 70.00 | 70.00 | 70.00 |
| 60th | 50.00 | 60.00 | 65.00 | 70.00 | 75.00 | 70.00 | 74.00 | 75.00 |
| 70th | 58.50 | 60.00 | 70.00 | 70.00 | 75.00 | 75.00 | 75.00 | 79.50 |
| 80th | 64.00 | 70.00 | 70.00 | 75.00 | 80.00 | 80.00 | 85.00 | 90.00 |
| 90th | 70.00 | 70.00 | 75.00 | 85.00 | 90.00 | 90.00 | 95.00 | 110.00 |
| 95th | 70.00 | 74.50 | 80.00 | 90.00 | 96.25 | 103.50 | 103.50 | 110.00 |

**Implementation boundary remains unchanged:** no number from this table may display unless stored user data confirms the exact male 18–25 college-student reference scope, a pre-training state, a direct 10RM, the source’s bodyweight band, and the named station/bar/technique protocol. The app must label any future output only as a comparison to this source sample—not generic biceps strength, regional force, health, or sport ability.
