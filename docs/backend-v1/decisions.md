# Backend V1 decisions

Each decision names what was chosen, what else was possible, the evidence, and which requirements it touches. Scientific assumptions are recorded here rather than left in code comments alone (brief §1, B068, B101).

## D-001 — Payments deferred by owner (27 September 2026)

**Decision.** Section 12 (B196–B220), Gate C (B276–B279), B189 and the payment portions of B184, B185, B194, B238, B239, B240 and B283 are out of this assignment, recorded as `deferred (owner)`.

**Why.** Owner instruction. They are neither incomplete work nor launch blockers *for this assignment*; `status_tool.py` refuses to reopen them without the owner.

**Consequence carried forward.** No entitlement model exists or is designed here. Server endpoints are not gated by paid access. When payments return, B184/B185 must be revisited so premium access comes from verified provider evidence and never from profile metadata or a client flag.

## D-002 — Age adjusts the comparison, only when the athlete gives a birth year (27 September 2026, PR #67)

**Decision.** When a birth year is known, every Strength Level-sourced placement is made at the athlete's age *on the day of the lift*, using the database's `strengthlevel_age_factor_v1` (published Strength Level age table, ages 15–90, factor 1.0 from 25 to 40, linear interpolation between anchors). The lift is compared as `lift / factor` on the same curve; the recorded lift is unchanged. Outside 15–90 nothing is extrapolated and the interface says so. Without a birth year no age weighting is applied.

**Alternatives.** (a) No age weighting at all — the recorded `strength_beta_v1` contract; rejected because the owner explicitly wants age relevance (brief §5.3). (b) Age-specific norms — not available for these exercises. (c) Extrapolating below 15 from the 15-year factor — rejected (B070: no silent extrapolation).

**Stage (B069).** The adjustment is applied to the observed metric's comparison value (divide the e1RM by the factor) before curve placement — equivalent to multiplying the reference by the factor. It is applied exactly once; the curves themselves are all-ages community data with no age adjustment of their own (B067 — audit to confirm under Strength work).

**Evidence.** Live database traces for a 180 lb bench at 145 lb body weight, male: 48.97 with no age; 74.44 at 15, 69.60 at 16, 60.67 at 18, 52.64 at 20, 48.97 at 30, 67.95 at 50. Tests: `server/strengthPercentile.age.test.ts` (engine pinned to the database outputs), `server/supabaseStrengthProfile.age.test.ts`, `client/src/lib/ageAtLift.scoring.test.ts`. Record: `docs/strength-percentile/live-contract-audit.md` § Age.

**Touches.** B031, B067–B070, B247, B250.

## D-003 — iOS integration status (B002)

**Finding.** `main` contains no native shell: no `capacitor.config.*`, no `ios/`, no Capacitor dependency. The iOS work — Capacitor shell with native auth, CORS and safe-area handling; an offline workout outbox (`client/src/lib/offlineQueue.ts`, `offlineSession.ts`, `hooks/useWorkoutOutbox.ts`); a native share sheet; cloud iOS CI (`.github/workflows/ios.yml`); App Store submission files (`IOS_SETUP.md`, `ios-assets/`) — exists only on `origin/claude/ios-app-conversion-snuz36`, 86 commits from 18–22 August 2026, with **no common history with `main`** (`git merge-base` finds none). Its `Home.tsx` is 582 lines; `main`'s is 1,726.

**Decision for this assignment.** Do not merge or port the shell inside the backend work: it is an app-packaging change with its own verification path, and the branch predates a month of product work. Treat it as the source to port from, not a branch to merge. Its offline outbox is prior art for B168/B170: any durable offline queue built here must be reconciled with it rather than become a second, competing design (B003, B197 spirit).

**Consequence.** Anything that needs an actual iOS build (B283's iOS portion, B226 installed-client compatibility, B261 app termination on device) is `blocked` on the shell being ported to `main`. The 10 October iOS release depends on that port; it is named as a release risk in the gate report.

## D-004 — No competitor rank for a gym lift (27 September 2026, batch 1) — intentional behavior change

**Decision.** The Strength Genome panel no longer ranks an ordinary gym lift against the van den Hoek 2024 powerlifting population. That card appeared whenever the athlete had a sex on file, for any squat, bench or deadlift, and replaced the community percentile. Competitors are a selected, trained, tested population; a gym lift does not match their protocol or selection (B065). The competition comparison still appears, labelled "Compared to that competition group", only when the entry *is* an exact competition-context match (the existing `powerliftingReference` route). The default placement is the community `strength_beta_v1` percentile, whose card names its group ("among men who lift") in the same line as the number.

**What replaces the gate.** Where a comparison needs something the athlete has not given, the panel asks for it with neutral options ("Women who lift", "Men who lift", "Prefer not to say") and an optional birth-year prompt; declining leaves progress tracking intact.

**Not a regression.** Tests that pinned the old card (`StrengthGenomePanel.rankGate.test.ts`, `…registryReference.render.test.ts`, `StrengthGenomePanel.test.ts`, `strengthGenomeDefinitions.test.ts`) were rewritten to pin its absence. V2 should not restore it (B290).

**Touches.** B065, B066, B290.
