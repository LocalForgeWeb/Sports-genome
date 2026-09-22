# Musculoskeletal Capacity & Injury Resilience (v2) — interaction contract

Completion evidence for checklist item `resolve_philosophy_contract` (20, design).
Required output: a feature-level interaction contract with default, loading, empty,
insufficient-evidence, error and drill-down states.

Every blocking `feature_philosophy_links` record was read from the Philosophy project and resolved
against its currently adopted object. Nothing below is invented: rules marked **FIXED** are copied
constraints, rules marked *PARAMETERIZED* are explicitly left open by the adopted object and stay
configurable.

---

## 1. Blocking links and how each is discharged

| Object | Type | How this feature satisfies it |
| --- | --- | --- |
| `sport_optional_capacity_resilience_contract` | decision · governs | §2 modes, §3 two-stage capture, §4 synthesis, §5 states, §7 escalation |
| Three-layer product-DNA contract | decision · governs | §6 — resilience adds no tab and no new control grammar |
| Uncertainty-to-action posture contract | decision · constrains | §5 posture table; posture never edits the underlying estimate |
| Confidence Companion | pattern · governs | §5.3 — every plan item carries confidence + "what would improve this" |
| `sport-optional-context-not-fake-sport` | principle | §2 — three real modes, no synthetic sport, NULL is never silently "general" |
| `separate-capacity-targets-from-constraints` | principle | §3 — two objects, two questions, no inference between them |
| `compose-priorities-then-change-the-minimum` | principle | §4 — ordered layer resolution, smallest useful action |
| `capacity-guidance-without-diagnosis` | principle | §7 — proportional screening, four postures, no diagnosis |
| `response-closes-the-capacity-loop` | principle | §8 — check-ins, versioned rules, immutable observations |
| `trainable-gaps-not-athlete-identities` | principle | §9 copy rules |
| `trace-important-outputs-to-evidence-and-inputs` | principle | §10 drill-down grammar |
| `overview-first-detail-on-demand` | principle | §10 Scan → Explain → Inspect → Act |
| `semantic-accessibility-equivalence` | principle | §11 |
| `recognizable_dna_adaptive_expression` | principle | §6 |
| Onboarding, Workout Builder, Programs | surfaces · assignment | §12 |
| Insights | surface · informs | §12 |

Non-blocking links honoured where they cost nothing: Body Lab, Settings, Sport Profile, Workout
Session surface assignments, and the `state_reason_action` pattern (treated as a hypothesis, not a
standard).

---

## 2. Context mode — three real states

**FIXED.** The profile carries an explicit `sport_context_mode`:

| Mode | `primary_sport_id` | Sport-derived output |
| --- | --- | --- |
| `sport` | required | available |
| `general` | NULL | withheld, with a one-line reason |
| `undecided` | NULL | withheld, with a "choose a sport to unlock" affordance |

`general` and `undecided` are distinct rows, not a null check. Account and onboarding completion are
never blocked on choosing a sport. There is no General Fitness sport record, now or ever.

**Anti-patterns, explicitly forbidden:**
- `sportProfiles.find(...) || sportProfiles[0]` — the current `Home.tsx:330` fallback. A missing
  sport must render the general treatment, never sport #1.
- Showing sport percentiles, sport demand maps or transfer claims to a `general` user.
- Treating NULL `primary_sport_id` as `general` without the mode column agreeing.
- Labelling the surface "Athlete Profile" on the non-athlete pathway; it is "Profile".

## 3. Two-stage capture — targets are not constraints

**FIXED.** Two questions, in this order, never merged:

1. **"What do you want to improve?"** → `athlete_focus_areas`: target, optional laterality,
   priority. This is a positive goal. Selecting a region here means nothing about symptoms.
2. **"Should the plan account for anything there right now?"** → `athlete_training_constraints`:
   `proactive_none` | `symptomatic` | `recent_or_returning` | `prior_recurrent` |
   `clinician_restricted`.

Both objects are effective-dated with provenance and are user-editable and reversible. A constraint
that is never re-confirmed expires rather than governing the plan forever.

**Anti-patterns:** a single "I have a knee issue" flag; reading a selected region as an injury;
using symptom severity as goal priority; parsing free text into a diagnosis.

## 4. Synthesis — compose, then change the minimum

**FIXED resolution order.** Layers are resolved in this sequence and never flattened into one score:

1. Hard safety and clinician constraints
2. Validity and evidence route
3. Schedule and equipment
4. Existing compatible exposure already in the stack
5. Top-level goal weights
6. Optional sport demands (sport mode only)
7. Manual focus priority
8. Fatigue and recovery budget
9. Ranked reversible changes

Every returned item names its decisive drivers and exactly one action kind:
`add` | `replace` | `modify` | `monitor` | `measure` | `withhold`.

**FIXED credit rule.** Adequate compatible work already in the plan is credited before anything is
added. The same exposure must not be counted twice through muscle, movement and resilience mappings.
When coverage is adequate, the correct output is `monitor` — not another exercise.

*PARAMETERIZED:* layer weights, adequacy thresholds, and how many ranked changes are shown.

## 5. Required states

### 5.1 State table

| State | Trigger | What the user sees | Primary action |
| --- | --- | --- | --- |
| **Default** | Mode set, ≥1 focus area, plan resolved | Scan line: target, current coverage state, one decisive driver, confidence | The single highest-value change |
| **Loading** | Plan request in flight | Skeleton preserving the scan layout; last known plan stays visible and is labelled stale | none; never a spinner that replaces content |
| **Empty (no targets)** | Mode set, no focus areas | "Choose what you want to improve" with the optional-target explainer | Add a focus area |
| **Empty (no plan yet)** | Targets exist, no program | Target list with coverage "not yet assessed" | Build or import a plan |
| **Insufficient evidence** | No route passes its quality gate | Named target, the words "no reviewed route covers this yet", and what is missing | The smallest useful measurement or information request |
| **Partial evidence** | Route exists but population/presentation match is weak | Qualified recommendation with the mismatch stated inline | Reversible action + verify path |
| **Error** | Request failed | What failed, that nothing was changed, and a retry | Retry; never a silent fallback to a generic plan |
| **Stale** | Check-in overdue for the route's reassessment window | Last plan marked stale with its date | Check in |
| **Withheld** | High-consequence or out-of-domain state | Concise reason and escalation path, no diagnosis | Escalate / review with a professional |

**FIXED.** Insufficiency is a first-class result, not an error and not an empty list. Given the audit
finding that zero sport-agnostic routes currently exist, general mode will return this state for most
targets at launch; the copy must therefore be useful, not apologetic.

### 5.2 Posture mapping

| Confidence | Posture | Behaviour |
| --- | --- | --- |
| High | `ordinary_action` | Primary action preserved |
| Moderate | `qualified_action` | Reversible action + material caveat + verification path |
| Low | `measurement_first` | Default action becomes measure/verify/compare |
| Critical validity failure / out-of-domain | `withhold` | Consequential directional advice withheld, reason inspectable |

**FIXED.** Posture changes the *action*, never the underlying estimate. Friction is not added when
the uncertainty cannot change the decision. The exact answer that moved the posture is always
inspectable.

### 5.3 Confidence Companion

Every plan item shows: the estimate, a confidence cue, and one step that would improve certainty.
Confidence never reduces a score, and evidence quality stays distinguishable from data quantity.

## 6. Product DNA — no new tab, no new grammar

**FIXED.** Resilience is a cross-cutting lens, not a destination. Layer 1 (navigation destinations,
action verbs, score/confidence semantics, drill-down and undo rules) is unchanged. Layer 2 reuses the
existing evidence-boundary card, disclosure and grade treatments. Layer 3 allows each host surface
its own density.

## 7. Escalation without diagnosis

**FIXED.** Screening is proportional: an ordinary proactive capacity goal must not meet a maximal
warning gate. The `withhold` posture is reserved for severe or rapidly worsening reports, neurologic
or systemic signals, postoperative states, and clinician restrictions. When it fires, the UI states
that automated progression is withheld and why, and points to human evaluation — without naming a
condition, inferring tissue damage, or promising prevention.

User-reported restriction and system inference are stored and displayed separately.

## 8. Response loop

**FIXED.** Check-ins collect only what can change the next decision: completion, function or load
tolerance, relevant during/after response, next-session or next-day response, and confidence.
Function and load tolerance are recorded separately from symptoms and from adherence. Missingness is
explicit — silence is never read as success, and time passing is never a reason to progress.

Observations are immutable. A new decision writes a new row carrying the rule version that produced
it. Reassessment windows come from the evidence route, not one global timer. There is no single
universal pain threshold across regions and presentations.

## 9. Copy rules

**FIXED.** Name the capability and context before any negative state: "Shoulder external-rotation
capacity is below the range your current plan supports", never "Weak shoulders". No trait language,
no shame framing for ordinary gaps, no lone red badge without an object, comparison basis and a
controllable next step. Describe resilience, exposure preparation and modifiable factors — never
diagnosis, prevention promises, or population risk restated as personal certainty.

## 10. Drill-down grammar

**Scan** — target, coverage state, one decisive driver, confidence cue.
**Explain** — 2–4 decisive drivers, the evidence route (`general` / `presentation_matched` /
`sport_specific`), the material caveat.
**Inspect** — population, presentation, dose as reported, directness, limitations, source study, and
whether the value was observed, estimated or inferred.
**Act** — the smallest useful action, or a deliberate monitor/measure state.

**FIXED.** Collapsed affordances advertise their destination ("Why this target?", "Evidence route",
"What would raise confidence") — never a bare "More". A caveat that could reverse an action is never
hidden below the depth at which that action is taken. Drill-down preserves the selected target,
mode, filters and return context.

## 11. Accessibility equivalence

**FIXED.** Region selection has a named/search/list path with the same authority as any spatial tap;
no core action is gesture-only. Target, state, confidence, route and action are exposed as text and
grouped semantically, not by visual proximity alone. Posture is stated in words, never carried by
colour alone. Focus returns near the triggering object after adding a focus area, logging a check-in,
or dismissing an escalation notice. Withhold and escalation content never auto-dismisses. Layouts
survive 200% text resize without clipping consequential labels, values, confidence or provenance.

## 12. Surface assignments

| Surface | Blocking | Role |
| --- | --- | --- |
| Onboarding | yes | Mode choice; optional focus capture; both skippable and editable later |
| Workout Builder | yes | Consumes the plan; applies constraints at exercise, variant, ROM, load, dose and scheduling levels; preserves user edits and reversibility |
| Programs | yes | Scheduling, reassessment windows, progression state |
| Insights | yes (informs) | Surfaces findings contextually — never a permanent resilience tab |
| Body Lab, Sport Profile, Workout Session, Settings | no | Read the same canonical contract; no local scoring |

**FIXED.** All clients call one versioned server contract. No client recreates synthesis, scoring or
evidence-routing logic.

## 13. Open questions that stay parameters

Six linked open questions are still `open` and must remain configurable, never hard-coded:
weak-point action choice (training target vs measurement vs edit vs watchful waiting); Sport Profile
dimension ranking when importance, gap, confidence and trainability disagree; Body Lab selection vs
confidence cue ownership; redundant-cue combinations in dense anatomy; real-user CVD validation; and
stable region identity across anatomical granularities.

---

## 14. Implementation trace — sport-optional onboarding

Checklist item `build_sport_optional_onboarding`. Where each contract rule now lives.

| Contract rule | Implementation |
| --- | --- |
| Three real modes (§2) | `contextModes` in `AthleteBaselineQuiz.tsx`; `SportContextMode` shared type |
| Sport asked only in sport mode | `quizStepIds()` omits the `sport` and `sport-modifier` steps outside sport mode |
| Completion never blocked on a sport | The mode step continues on any of the three answers; `sportId` submits as `""` |
| No synthetic sport | Leaving sport mode clears `sportId`; no sport record is ever added |
| Two-stage capture (§3) | `focus` step, then `focus-state` — the second appears only once a target is chosen |
| Constraint never inferred | `constraint` is submitted only alongside a chosen focus area; default `proactive_none` |
| Proportional screening (§7) | High-consequence signals are asked only when the state is not `proactive_none` |
| Withhold posture | `resolveConstraintPosture` → the escalation notice, which names no condition |
| Insufficiency state (§5.1) | A target with `supportedRoutes: []` is selectable and says what is missing |
| Error / unavailable state | An unavailable catalog renders its boundary; onboarding continues unaffected |
| Sport-derived output gated | `hasSportContext` in `Home.tsx`; `SportContextGate` replaces the Atlas and sport recommendations |
| Edit later | `chooseSport` anywhere sets sport mode; About Me and the topbar selector still change it |

**What this removed.** `Home.tsx` previously resolved `sportProfiles.find(...) || sportProfiles[0]`
and presented that first sport as the athlete's own — in the topbar chips, the hero headline, and
as the seed for every smart draft. The fallback expression remains as the machinery's default, but
nothing presents or derives from it while `hasSportContext` is false.

**Still to come**, under `implement_vertical_slice` and `integrate_stack_and_program_builder`:
focus areas and constraints are captured and carried through onboarding, but are not yet persisted
to `athlete_focus_areas` / `athlete_training_constraints`, and Body Lab, Progress and the day
planner have not yet been walked for sport claims.

---

## 15. Implementation trace — reaching the feature at all

Onboarding asked the two questions and the profile card kept them editable, and that was the whole
of it: the answer was written to local storage and read by nothing, and the card itself could only
be reached by scrolling the profile to it. Neither §12's surface assignments nor §11's named path
were satisfied, which is the same thing an athlete means by "it isn't showing up".

| Contract rule | Implementation |
| --- | --- |
| Workout Builder consumes it (§12, blocking) | `DayCapacityNote` on the Training Day states the declared target and its posture; it reports and never scores — synthesis stays on the server contract per §12's FIXED single-contract rule |
| Body Lab exposes regional targets without implying diagnosis (§12, primary) | `.body-lab-capacity-step` on a selected region, from `capacityProposalFor` in `lib/capacityTargets.ts` |
| Targets are not constraints (§3) | The region tap sets a focus area only; `adoptCapacityTarget` writes `proactive_none` and the card asks the second question separately. A constraint already reported elsewhere is never overwritten by a body-map tap |
| Named/search/list path with the same authority as a spatial tap (§11) | The `profile#targeted-capacity` destination in `lib/universalSearch.ts`, found by the words athletes type — which live in `capacityTargetSearchTerms`, not in any label |
| No trait language (§9, `trainable-gaps-not-athlete-identities`) | "weak point", "injury" and "sore" are search **terms**; the result's label is "Something you want stronger". `capacityFindability.test.ts` holds the split |
| Focus returns near the triggering object (§11) | `revealWorkspaceAnchor` focuses `#targeted-capacity`; `navigateWorkspace(next, { keepScroll: true })` stops the workspace's own scroll-to-top from landing on top of it |
| No new tab (§6, FIXED) | Nothing above adds a `Workspace`. Every path lands on a screen that already existed |
| Insufficiency is a first-class result (§5.1) | Unchanged, and reached from these paths: adopting `groin_adductors` opens the card already saying no reviewed route covers it yet |

**What still blocks it in production**, and is a deployment setting rather than code:
`SUPABASE_SERVICE_ROLE_KEY` is unset on the Vercel project, so `resilience.targetCatalog` answers
`unavailable` and there is nothing selectable to find. The Body Lab offer is suppressed in that
state by design — an offer that opens an empty picker is worse than no offer — so the paths above
light up when the key is set. See `deployment_environment.md`.
