# Specialization atlas: nine regions (19 Oct 2026)

What will be built to take the atlas from the forearm to the other major muscle groups, and the decisions each part is held to. The owner's ask (19 Oct): "start using this system for the other major muscle groups". The forearm's binding design is `02-design.md`; everything there still holds unless this note replaces it. Production already holds schema v1 and seed v1 (18 Oct, 04-database.md §9); both files are history and are never edited again.

This is the final version of the note. A draft was attacked by three critics (counting and data model; database and release; the athlete on a phone and the size of the work); the appendix lists every issue and what was done with it. Code locations are cited as the scouts and critics gave them, tagged **M** (shared data model and calculator), **D** (database and seed pipeline), **P** (page, Home and logger) and **G** (drawing and content). Experiments behind this note are kept in `experiments/multi-region-2026-10-19/` (scripts as run, with the session's absolute scratch paths left in them; screenshots reduced to 256 colours): the draft's (`exp*.ts`, `schema_v2_prototype*.sql`), the critics' (`critic-counting/c1–c10`, `critic-db-exp.ts`, `critic-phone/`), and the architect's phone measurement of the chosen heading row (`arch-phone/candidate*.mjs`, `checks.json`, `checks2.json`, screenshots). Owner decisions are collected in §11; everything else is decided here.

## 0. What this note decides, in one list

1. **Nine production regions**: shoulders, chest, back, upper_arm, forearm, core, hips, thigh, lower_leg (§1). Feet stay out of scope, as the hand did for the forearm.
2. **A muscle is defined once and has one home region.** Other regions list it as an external member. The role is a property of the listing (`region_nodes`), never of the node. Every shipped forearm id and the frozen `upper_arm.biceps` / `upper_arm.brachialis` rows stay as they are; the upper arm is promoted from reference to production in place (§1.3).
3. **The home region speaks for its muscles.** A page credits an external member as the member's home region's current mapping version credits it, and classifies a bout by the page's **own** muscles only, so crediting an external never moves a bout into or out of the page's own totals (§4.2). New mapping versions map only their own region's muscles.
4. **Sides are region data**: `paired` (by arm or by leg) or `midline` (core). A set records the arm's side and the leg's side in **separate fields**. A mapping says whether its muscle is loaded on the same side as the recorded limb, the opposite side, or both, relative to the variant's **side anchor** ("front leg", "standing leg", "top leg"). One function resolves the side per node and mapping, and rows, region totals, goals and the ledger all read its result (§2).
5. **One variant per catalog exercise**, in one shared library every region reads. The forearm's 119 rows stay frozen. The **counting attributes** (`sided_by`, `leg_laterality`, `side_anchor`) are written explicitly, never defaulted at run time, and are frozen when a version that maps the variant is published; descriptive dimensions likewise (§3).
6. **Rule versions are published by the release that first uses their clauses**: `specialization_exposure_v2` with the upper arm, v3 with the shoulders, chest and back, v4 with the core, v5 with the legs. The forearm stays on v1 through wave 0 (§4.3).
7. **Database: one additive schema v2** (five new tables, widened checks, two restated functions, new guards) and **a full re-emitted seed per release** (seed v2 … v7), applied only after the wave's review, from the exact commit that is merged. Forward-only, with one tested undo valid before seed v3 (§5).
8. **The page picks the region from its heading**, the iOS title-menu pattern: the heading is the toggle, Back folds into the same row, the date fields put their labels inline. Measured in headless Chromium emulating an iPhone: every state that fits a 375 × 667 first screen today still fits, and the one that does not fit today (Back with Custom dates) now does (§6.1).
9. **One drawing generator with shared helpers**, one config folder per region, the forearm drawing byte-identical through the refactor; each region's views and layers are generated from §1.2 and held by contract tests (§7).
10. **Content recipe and evidence standard as the forearm's**, with the same plain statement about automated review, and a method note per version saying what a reviewed mapping does and does not claim (§8).
11. **Six releases, ordered by external dependency**: the platform with the forearm alone; the upper arm; the shoulders, chest and back together (they list one another's muscles); the core; the lower leg (proves the leg machinery on 73 decisions); the hips and thigh. Each has its counts stated, merges, deploys and is applied to production on its own (§9).

## 1. Regions and muscles

### 1.1 The regions

| id | label | heading | sort | sides | switch words | a side in a sentence | body-map keys | catalog keys (region work) | region-only tags |
|---|---|---|---|---|---|---|---|---|---|
| `shoulders` | Shoulders | Shoulder specialization | 2 | paired · arm | Left arm · Right arm | your right shoulder | frontDelts, sideDelts, rearDelts, rotatorCuff, shoulders | frontDelts, sideDelts, rearDelts, rotatorCuff, shoulders | primary |
| `chest` | Chest | Chest specialization | 4 | paired · arm | Left side · Right side | the right side of your chest | chest, serratusAnterior | chest, serratusAnterior | primary |
| `back` | Back | Back specialization | 6 | paired · arm | Left side · Right side | the right side of your back | lats, upperBack, rhomboids, traps, lowerBack | lats, upperBack, traps, lowerBack | primary |
| `upper_arm` | Upper arms | Upper-arm specialization | 8 | paired · arm | Left arm · Right arm | your right upper arm | biceps, brachialis, triceps | biceps, brachialis, triceps | primary |
| `forearm` | Forearms | Forearm specialization | 10 | paired · arm | Left arm · Right arm | your right forearm | forearms, brachioradialis | forearms | any (as shipped) |
| `core` | Core | Core specialization | 12 | midline | (none) | your core | abs, obliques | abs, obliques | primary |
| `hips` | Hips | Hip specialization | 14 | paired · leg | Left leg · Right leg | your right hip | glutes, abductors, tfl, hipFlexors, adductors | glutes, abductors, hipFlexors, adductors | primary |
| `thigh` | Thighs | Thigh specialization | 16 | paired · leg | Left leg · Right leg | your right thigh | quads, hamstrings | quads, hamstrings | primary |
| `lower_leg` | Lower legs | Lower-leg specialization | 18 | paired · leg | Left leg · Right leg | your right lower leg | calves, soleus, tibialis, peroneals | calves, tibialis | primary |

- **Switch words come from the limb the logger asks about**: "arm" for the shoulders, upper arm and forearm, "leg" for the hips, thigh and lower leg, "side" for the chest and back (on those two, a side is the side of the arm that worked; "How this is counted" says so in one line). Measured: "Left arm · Right arm", "Left side · Right side" and "Left leg · Right leg" sit beside "Completed · Planned" on one row at 375 and 390; "Left shoulder · Right shoulder" does not and costs a third control row (+52–54 px, `critic-phone/checks.json`, scene `side-words`).
- **A side in a sentence** is region wording, `wording.onSide(side)`, used by every sentence that names the region and a side ("12 distinct bouts touched your right thigh"); no template joins the label to a side noun any more ("the hips on the right hip"). The forearm's sentences take its wording from wave 0 ("touched your right forearm"); its numbers do not change (§11, decision 11).
- **Labels read after "the"** ("Muscles of the upper arms"), so `label.toLowerCase()` keeps working (P `SpecializationPanel.tsx:211`). A template test renders every page sentence that names a region or a side (P `SpecializationPanel.tsx:349-398, 497`; `model.ts:194, 245-246, 302-303`) for all nine regions and both sides (midline: none) and refuses a repeated noun, "{label} on the", and any limb word that is not the region's limb.
- **Sort orders leave gaps.** The published forearm row keeps 10; the grid in §6 reads them in body order.
- **Entry labels** are "Explore {heading's first word, lowercased} coverage": "Explore shoulder coverage", "Explore upper-arm coverage", "Explore lower-leg coverage". The forearm's stays "Explore forearm coverage".
- **External heading.** Each region carries the heading other pages put over its muscles: "Shoulder muscles credited here", "Chest muscles credited here", "Back muscles credited here", "Upper-arm muscles credited here", "Forearm muscles credited here", "Core muscles credited here", "Hip muscles credited here", "Thigh muscles credited here", "Lower-leg muscles credited here". A page groups its external rows by home region under these headings (M `types.ts:61-72`, `region.ts:13-18`). The forearm's own `wording.externalGroup` is kept as a fallback and equals the upper arm's heading.
- **Incidental word** (`wording.incidentalWork`): forearm "grip" (unchanged); back and core "bracing"; lower leg "balance"; every other region "steadying".
- **Catalog keys are explicit** (`SpecializationRegion.catalogKeys`), no longer derived from target nodes (M `exposure.ts:109-113`; D `schema.sql:127`). The forearm's list equals what `regionCatalogKeys` derives today, `{forearms}`, so its behaviour does not change.
- **Region-only tag scope.** The forearm keeps `any` (primary and secondary tags), as shipped. Every new region reads `primary` tags only: the core would otherwise put 189 secondary-only rows, the squat, bench, overhead press and deadlift among them, in its region-only bucket (M `exposure.ts:151-155`). What the narrower scope leaves out is not hidden: §8 "Said plainly" lists the sets the athlete did that tag the region as a secondary muscle and are not counted, each with its reason.
- **Keys with no region:** `feet` (9 secondary catalog rows), out of scope like the hand (§11, decision 5). Every other body-map key in `AnatomyMap.tsx:45-57` and every Review key in `weeklyVolume.ts:19-24` belongs to exactly one region (P `regionIndex.ts:31-34`). `rhomboids` is an alias of `upperBack`; both open the back.

**Muscles-map and Review entry** (`nodeForBodyMapKey`): a key that names one muscle opens the page with it selected; a key that names a group opens the region with nothing selected.

| Key | Opens |
|---|---|
| frontDelts, sideDelts, rearDelts | `shoulders.anterior_deltoid`, `shoulders.lateral_deltoid`, `shoulders.posterior_deltoid` |
| serratusAnterior | `chest.serratus_anterior` |
| lats, rhomboids, lowerBack | `back.latissimus_dorsi`, `back.rhomboids`, `back.erector_spinae` |
| biceps, brachialis | `upper_arm.biceps`, `upper_arm.brachialis` |
| brachioradialis | `forearm.br` (unchanged) |
| abs, obliques | `core.rectus_abdominis`, `core.external_oblique` |
| tfl, hipFlexors, abductors | `hips.tfl`, `hips.iliopsoas`, `hips.gluteus_medius` |
| calves, soleus, tibialis, peroneals | `lower_leg.gastrocnemius`, `lower_leg.soleus`, `lower_leg.tibialis_anterior`, `lower_leg.fibularis` |
| rotatorCuff, shoulders, chest, traps, upperBack, triceps, forearms, glutes, adductors, quads, hamstrings | the region, nothing selected |

A key opens its region only once the region is in production; before that it opens what it opens today.

### 1.2 The muscles

Ids are `<region>.<slug>`, flat (never nested: G `claims.ts:41`). Every id, **short name** and layer below is fixed by this note, so a region's anatomy, mapping and drawing lanes can work in parallel (§9). The anatomy lane fills aliases, location, what it does, shape note, caveats, visibility (including partial surface visibility) and `databaseMuscle` (§8); it may change a row here only through a recorded deviation that the adversarial review accepts, and it lands `nodes.ts` and `nodeActions.ts` as its first checkpoint, before the drawing and mapping lanes start.

- **Kind and role** follow `types.ts:18-30`; the role is the role **in the home region**.
- **Short names** are the drawing's path names and the map's labels: they match `[A-Za-z][A-Za-z0-9-]*`, are one per node (an external keeps its home's short name), and are unique lowercased within every drawing that includes the node, externals included (G `asset.mjs:29-34, 59-62`). Shipped short names (`BR`, `FCU`, `Biceps`, `Brachialis`, …) are unchanged.
- **Layer** is the layer on which the drawing shows the muscle's belly; a visible part on a layer above is an outcrop of that node (the forearm's rule, G `forearmDiagram.test.ts:141, 160, 169`). The draft's layers were corrected where they contradicted this (infraspinatus, teres minor, gluteus medius, the lateral views; appendix).
- **Parents** (any node that is another node's parent: the deltoid, rotator cuff, pectoralis major, trapezius, triceps, gluteals, adductor group, quadriceps, hamstrings, calf) are neither drawn nor selectable; their layer is "—". They exist for grouping and for body-map keys only (§7.3).

**Shoulders.** Region actions: `shoulder.flexion`, `shoulder.abduction`, `shoulder.extension`, `shoulder.horizontal_adduction`, `shoulder.horizontal_abduction`, `shoulder.external_rotation`, `shoulder.internal_rotation`, `scapula.upward_rotation`.

| id | name | short | kind | role | layer | node key | parent |
|---|---|---|---|---|---|---|---|
| `shoulders.deltoid` | Deltoid | Deltoid | muscle | group | — | shoulders | |
| `shoulders.anterior_deltoid` | Anterior deltoid | AntDelt | head | target | surface | frontDelts | deltoid |
| `shoulders.lateral_deltoid` | Lateral deltoid | LatDelt | head | target | surface | sideDelts | deltoid |
| `shoulders.posterior_deltoid` | Posterior deltoid | PostDelt | head | target | surface | rearDelts | deltoid |
| `shoulders.rotator_cuff` | Rotator cuff | RotCuff | group | group | — | rotatorCuff | |
| `shoulders.supraspinatus` | Supraspinatus | SSP | muscle | target | deep | rotatorCuff | rotator_cuff |
| `shoulders.infraspinatus` | Infraspinatus | ISP | muscle | target | deep (surface outcrop, back view) | rotatorCuff | rotator_cuff |
| `shoulders.teres_minor` | Teres minor | TMinor | muscle | target | deep (surface outcrop, back view) | rotatorCuff | rotator_cuff |
| `shoulders.subscapularis` | Subscapularis | SSC | muscle | target | deep | rotatorCuff | rotator_cuff |

External members: `chest.pec_major_clavicular`, `chest.pec_major_sternocostal`, `chest.serratus_anterior`, `back.upper_trapezius`, `back.latissimus_dorsi`, `back.teres_major`. All six homes ship in the same release as the shoulders (§9.1).

**Chest.** Region actions: `shoulder.horizontal_adduction`, `shoulder.flexion`, `shoulder.extension`, `shoulder.adduction`, `shoulder.internal_rotation`, `scapula.protraction`, `scapula.depression`, `scapula.upward_rotation`.

| id | name | short | kind | role | layer | node key | parent |
|---|---|---|---|---|---|---|---|
| `chest.pec_major` | Pectoralis major | PecMajor | muscle | group | — | chest | |
| `chest.pec_major_clavicular` | Pectoralis major, clavicular head | PecClav | head | target | surface | chest | pec_major |
| `chest.pec_major_sternocostal` | Pectoralis major, sternocostal head | PecStern | head | target | surface | chest | pec_major |
| `chest.pec_minor` | Pectoralis minor | PecMinor | muscle | target | deep | chest | |
| `chest.serratus_anterior` | Serratus anterior | SA | muscle | target | surface | serratusAnterior | |

External members: `shoulders.anterior_deltoid`. The two pectoral heads are split because their actions differ (the clavicular head flexes the shoulder; the sternocostal head brings a raised arm down), not to fill a chart (brief §3).

**Back.** Region actions: `shoulder.extension`, `shoulder.adduction`, `shoulder.horizontal_abduction`, `scapula.elevation`, `scapula.retraction`, `scapula.depression`, `scapula.upward_rotation`, `scapula.downward_rotation`, `spine.extension`, `spine.lateral_flexion`.

| id | name | short | kind | role | layer | node key | parent |
|---|---|---|---|---|---|---|---|
| `back.trapezius` | Trapezius | Trapezius | muscle | group | — | traps | |
| `back.upper_trapezius` | Upper trapezius | UpperTrap | head | target | surface | traps | trapezius |
| `back.middle_trapezius` | Middle trapezius | MidTrap | head | target | surface | upperBack | trapezius |
| `back.lower_trapezius` | Lower trapezius | LowerTrap | head | target | surface | traps | trapezius |
| `back.rhomboids` | Rhomboids | Rhomboids | muscle | target | intermediate | upperBack | |
| `back.levator_scapulae` | Levator scapulae | LevScap | muscle | adjacent | intermediate | | |
| `back.latissimus_dorsi` | Latissimus dorsi | Lat | muscle | target | surface | lats | |
| `back.teres_major` | Teres major | TMajor | muscle | target | surface | | |
| `back.erector_spinae` | Erector spinae | ES | muscle | target | deep (surface outcrop, lumbar window) | lowerBack | |
| `back.quadratus_lumborum` | Quadratus lumborum | QL | muscle | target | deep | | |

External members: `shoulders.posterior_deltoid`. Rhomboid major and minor are one node: they share their actions, and neither holds a 44 px tap square on its own (G `SpecializationDiagram.tsx:53`). The trapezius parts are split because their actions differ (elevation, retraction, depression and upward rotation).

**Upper arm** (promoted from reference, §1.3). Region actions: `elbow.flexion`, `elbow.extension`, `forearm.supination`, `shoulder.flexion`, `shoulder.extension`.

| id | name | short | kind | role | layer | node key | parent |
|---|---|---|---|---|---|---|---|
| `upper_arm.biceps` | Biceps brachii | Biceps | muscle | target | surface | biceps | (shipped id) |
| `upper_arm.brachialis` | Brachialis | Brachialis | muscle | target | deep (surface outcrop, front view) | brachialis | (shipped id) |
| `upper_arm.triceps` | Triceps brachii | Triceps | muscle | group | — | triceps | |
| `upper_arm.triceps_long` | Triceps, long head | TriLong | head | target | surface | triceps | triceps |
| `upper_arm.triceps_lateral` | Triceps, lateral head | TriLat | head | target | surface | triceps | triceps |
| `upper_arm.triceps_medial` | Triceps, medial head | TriMed | head | target | deep (surface outcrop, back view) | triceps | triceps |
| `upper_arm.coracobrachialis` | Coracobrachialis | CB | muscle | adjacent | deep | | |

External members: `forearm.br` (short name `BR`). The long head is split because it also crosses the shoulder. The lateral and medial heads share every action: their mappings are written with `allocation: "shared"`, as FDS and FDP were, so the page says the work cannot be split between them rather than inventing a difference. Regional-growth findings for the long head go in selectivity claims only, never into credit (brief §2). The biceps stays one node: its id is shipped and frozen, and its heads do not differ in action enough to split.

**Forearm** (unchanged): 19 targets, `forearm.anterior` and `forearm.posterior` (groups), `forearm.anconeus` (adjacent), and the external members `upper_arm.biceps` and `upper_arm.brachialis` (02-design.md §2). Its drawing, layers and short names are unchanged.

**Core** (midline). Region actions: `spine.flexion`, `spine.lateral_flexion`, `spine.rotation`, `abdomen.compression`.

| id | name | short | kind | role | layer | node key |
|---|---|---|---|---|---|---|
| `core.rectus_abdominis` | Rectus abdominis | RA | muscle | target | surface | abs |
| `core.external_oblique` | External oblique | EO | muscle | target | surface | obliques |
| `core.internal_oblique` | Internal oblique | IO | muscle | target | intermediate | obliques |
| `core.transversus_abdominis` | Transversus abdominis | TrA | muscle | target | deep | |

External members: `back.quadratus_lumborum` (listed and credited; drawn on the back's drawing, list-only on the core's, §7.2).

**Hips.** Region actions: `hip.extension`, `hip.flexion`, `hip.abduction`, `hip.adduction`, `hip.external_rotation`, `hip.internal_rotation`.

| id | name | short | kind | role | layer | node key | parent |
|---|---|---|---|---|---|---|---|
| `hips.gluteals` | Gluteal muscles | Gluteals | group | group | — | glutes | |
| `hips.gluteus_maximus` | Gluteus maximus | GMax | muscle | target | surface | glutes | gluteals |
| `hips.gluteus_medius` | Gluteus medius | GMed | muscle | target | intermediate (surface outcrop above GMax) | abductors | gluteals |
| `hips.gluteus_minimus` | Gluteus minimus | GMin | muscle | target | deep | abductors | gluteals |
| `hips.tfl` | Tensor fasciae latae | TFL | muscle | target | surface | tfl | |
| `hips.piriformis` | Piriformis | Piriformis | muscle | adjacent | deep | | |
| `hips.iliopsoas` | Iliopsoas | Iliopsoas | muscle | target | deep (surface outcrop, femoral triangle) | hipFlexors | |
| `hips.adductors` | Adductor group | Adductors | group | group | — | adductors | |
| `hips.adductor_magnus` | Adductor magnus | AddMag | muscle | target | intermediate (surface outcrop, back view) | adductors | adductors |
| `hips.adductor_longus` | Adductor longus | AddLong | muscle | target | surface | adductors | adductors |
| `hips.adductor_brevis` | Adductor brevis | AddBrev | muscle | target | deep | adductors | adductors |
| `hips.pectineus` | Pectineus | Pectineus | muscle | adjacent | surface | adductors | adductors |
| `hips.gracilis` | Gracilis | Gracilis | muscle | adjacent | surface | adductors | adductors |

External members: `thigh.rectus_femoris`, `thigh.biceps_femoris_long`, `thigh.semitendinosus`, `thigh.semimembranosus`.

**Thigh.** Region actions: `knee.extension`, `knee.flexion`, `hip.extension`, `hip.flexion`.

| id | name | short | kind | role | layer | node key | parent |
|---|---|---|---|---|---|---|---|
| `thigh.quadriceps` | Quadriceps | Quads | group | group | — | quads | |
| `thigh.rectus_femoris` | Rectus femoris | RF | muscle | target | surface | quads | quadriceps |
| `thigh.vastus_lateralis` | Vastus lateralis | VL | muscle | target | surface | quads | quadriceps |
| `thigh.vastus_medialis` | Vastus medialis | VM | muscle | target | surface | quads | quadriceps |
| `thigh.vastus_intermedius` | Vastus intermedius | VI | muscle | target | deep | quads | quadriceps |
| `thigh.hamstrings` | Hamstrings | Hamstrings | group | group | — | hamstrings | |
| `thigh.biceps_femoris_long` | Biceps femoris, long head | BFLong | head | target | surface | hamstrings | hamstrings |
| `thigh.biceps_femoris_short` | Biceps femoris, short head | BFShort | head | target | deep | hamstrings | hamstrings |
| `thigh.semitendinosus` | Semitendinosus | ST | muscle | target | surface | hamstrings | hamstrings |
| `thigh.semimembranosus` | Semimembranosus | SM | muscle | target | intermediate (surface outcrop beside ST) | hamstrings | hamstrings |
| `thigh.sartorius` | Sartorius | Sartorius | muscle | adjacent | surface | | |

External members: `hips.gluteus_maximus`, `hips.adductor_magnus`, `hips.iliopsoas`, `lower_leg.gastrocnemius`. The biceps femoris heads are split because the short head does not cross the hip.

**Lower leg.** Region actions: `ankle.plantar_flexion`, `ankle.dorsiflexion`, `foot.inversion`, `foot.eversion`.

| id | name | short | kind | role | layer | node key | parent |
|---|---|---|---|---|---|---|---|
| `lower_leg.triceps_surae` | Calf (triceps surae) | Calf | group | group | — | calves | |
| `lower_leg.gastrocnemius` | Gastrocnemius | Gastroc | muscle | target | surface | calves | triceps_surae |
| `lower_leg.soleus` | Soleus | Soleus | muscle | target | intermediate (surface outcrops, both sides of the calf) | soleus | triceps_surae |
| `lower_leg.tibialis_anterior` | Tibialis anterior | TibAnt | muscle | target | surface | tibialis | |
| `lower_leg.fibularis` | Fibularis longus and brevis | Fibularis | muscle | target | surface | peroneals | |
| `lower_leg.tibialis_posterior` | Tibialis posterior | TibPost | muscle | adjacent | deep | | |

No external members. The gastrocnemius heads are one node (the same actions); the soleus is its own because it does not cross the knee, which is what straight-knee and bent-knee calf raises differ in. The two fibularis muscles are one node, said so in its caveat.

**Contested muscles, settled.** Rear delts: shoulders (not upper back). Trapezius: back; the shoulders list the upper part. Rotator cuff: shoulders. Teres major: back. Serratus anterior: chest; the shoulders list it. Rectus femoris: thigh; the hips list it. Adductor magnus: hips; the thigh lists it. Quadratus lumborum: back; the core lists it. Biceps and brachialis: upper arm; the forearm lists them (frozen). Brachioradialis: forearm; the upper arm lists it.

**Externals are chosen by one rule:** a region lists another region's muscle when that muscle is a prime mover of one of the listing region's actions and the listing region's exercises load it, so the page's "also loaded" is true. Registry tests enforce, for every release's registry:
- a paired region never lists a midline region's muscle;
- an external's home region is paired by the same limb as the listing region, unless the listing region is midline (the same-credit promise of §4.2 depends on it);
- every member's home region is production or reference in the same release (so a seed never names a node or region it does not hold, D `emit-seed.ts:278-282`; the `region_nodes` and `diagram_paths` foreign keys).

### 1.3 One muscle, several regions

- **A node has one home region**, `nodes.region_id`, and is a target, adjacent or group node only there (M `exposure.ts:63, 86-88`: the home rule stays). A registry test fails if a node is a non-external member of two regions or a catalog key belongs to two regions.
- **Membership is data.** Each region lists its members, `{nodeId, sortOrder, caveats?}`; the role is derived: the node's home role in its home region, `external` everywhere else. The database stores the derived role in `region_nodes` for readers and checks it (§5.1). `AnatomyNode.role` means the role in the home region. The registry hands the page region-relative copies of the nodes (role resolved, `regionId` still the home), so the page's existing `role` and `regionId` reads keep working (P `SpecializationPanel.tsx:293-297`, `TargetsOverview.tsx:14,19`, `model.ts:278,327`; M `exposure.ts:111`, `recommendations.ts:521, 617`).
- **Region-relative words move to the membership.** The biceps' "It is an upper-arm muscle and does not add forearm size" and its "not a forearm target" caveat become caveats of the forearm's membership of it (G `nodes.ts:270-283`); the node keeps neutral anatomy text. Node descriptions are not frozen (04-database.md §4), so this is allowed.
- **The two frozen upper-arm nodes** keep their ids, region, catalog key and `nodes.role = 'external'` for good (D `schema.sql:864-898`; M `nodes.ts:266-283`). In TypeScript their record moves to `regions/upper_arm/` with role `target`, plus `storedRole: "external"`, the value the database column keeps; the emitter writes `storedRole ?? role`, and a test allows `storedRole` on exactly these two ids. Forking new ids was rejected: goals and history would split one muscle in two.
- **The upper arm is promoted in place.** Wave 0 keeps it a `reference` region, now expressible in TypeScript (`status` gains `"reference"`, M `types.ts:42`); wave A sets it to `production` with its label, heading and words. `referenceRegionLabels` goes (D `emit-seed.ts:70-72`). Seed v1 is never run again after v2: it would demote the upper arm without a refusal (D experiment D2).
- **Claims have an owner.** `Claim.ownerRegionId` is required, and the key is `${ownerRegionId}:${id}`, never derived from the file that lists the claim (D `emit-seed.ts:329-333`). New claim ids are the full node id plus the kind (`upper_arm.biceps.appearance`, key `upper_arm:upper_arm.biceps.appearance`); shipped ids keep their form (M `claims.ts:41`). The four shipped claims on the biceps and brachialis keep `ownerRegionId: "forearm"` and their keys forever (D `schema.sql:904-941`), though their records move to `regions/upper_arm/claims.ts` beside the nodes. The emitter's stale-claim delete is computed per owner over all claims, not per region file (D `emit-seed.ts:361-372`), so moving a record never looks like deleting it. An emitter test: every v1 claim key and node-action claim key comes out byte for byte.
- **A page shows**, for each member, the claims its region owns on it and the function claims behind the node actions it shows. The upper-arm page shows `forearm:biceps.function` (its elbow-flexion and supination node actions rest on it) and its own appearance claim, not the forearm's "does not add forearm size". `NodeAction` names its claim by full key (`claimKey: "forearm:biceps.function"`); the forearm's rows derive it as today.
- **Node actions are global**, one per node and action (D `schema.sql:176-186`). A region declares node actions only for its own nodes, plus the forearm's frozen rows for the biceps and brachialis; a test fails on a node action declared twice. A page shows an external member's node actions only for the page's own region actions, so the forearm page reads exactly as it does today.
- **Shared libraries** replace per-region copies of global records (M `ids.ts:53-74`, `emit-seed.ts:313`; G `ids.ts:1-82`):
  - `shared/specialization/actions/`: one definition per joint action. The forearm's 20 move there word for word; wave 0 adds every region action listed in §1.2; a region lane may add an action only in `actions/<region>.ts`.
  - `shared/specialization/sources/`: forearm keys `S1–S8`, `A1–A55`, `M1–M8` unchanged; new keys are stable slugs, `<publisher>.<topic>` (`statpearls.deltoid`, `kenhub.rotator_cuff`) or `pmid.<number>`. The key regex already allows them (`schema.sql:140`). A test refuses a key used twice and a URL under two keys (M `sources.ts:22`).
  - `shared/specialization/variants/` (§3).
  - `shared/specialization/regions/<region>/ids.ts` per region; `ids.ts` keeps only cross-region constants.

## 2. Sides

### 2.1 The model

`SpecializationRegion.sides` is one of:
- `{ model: "paired", limb: "arm" | "leg" }`: forearm, upper arm, shoulders, chest and back by arm; hips, thigh and lower leg by leg. The page's words come from the region's wording (§1.1).
- `{ model: "midline" }`: core.

**Types** (M `types.ts:390, 398, 427, 562, 595`): `BodySide = "left" | "right"`; `SummarySide = BodySide | "midline"`; `ArmSide` stays as an alias of `BodySide` until no code uses it. Summary, request, goal and measurement sides become `SummarySide`.

**A set records each limb's side in its own field.** `side` stays the arm's side, exactly as stored today (`left`, `right`, `both`, P `deviceWorkoutLog.ts:62-64, 98-101`). A new field, `legSide: "left" | "right" | "both"`, holds the leg's side. One field with a limb tag next to it was rejected: any reader that drops the tag (the production normalizer keeps only the fields it knows, `deviceWorkoutLog.ts:185-205`, and every save rewrites the whole history through it, `:316-318`) would turn a leg side into an arm side silently. With two fields, a reader that drops `legSide` leaves the set with no leg side, which is never counted. Wave 0, before any new shape can be written:
- `normalizeSet` keeps every field it does not understand, unchanged; the goal and measurement stores keep every stored entry they cannot parse and write it back untouched (P `stores.ts:58-67, 143-147, 196-203, 212-215`), so a midline goal or a girth measurement survives a save by this code's successors;
- `revision.ts` `SET_FIELDS` gains `legSide`; the swap code copies `legSide` with `side` (P `workoutSwap.ts:138-145`);
- tests: round trips of the new shapes through the wave-0 readers, and through the readers as shipped on 18 Oct (a fixture copy), which must leave no leg side read as an arm side.

A rollback to a deploy older than wave 0 would still drop `legSide` and delete midline goals and girth measurements on its next save; nothing new is written before wave A, so wave 0's own rollback is safe, and §9.4 never rolls back across wave 0 once wave A is live.

**A side is anchored.** The arm's side is the side of the hand holding the load, as shipped ("Arm", 07-logger.md, "The live set card"). The leg's side is named by the variant's `side_anchor` (§3): `working_leg`, `front_leg` (split stances and lunges), `stance_leg` (single-leg hinges), `top_leg`, `bottom_leg` (side-lying and Copenhagen work). On a split stance, a carry or side-lying work, "Left" otherwise has two readings (front foot or elevated rear foot; standing or free leg; top or bottom leg), and a side recorded under the wrong reading can never be corrected (§11, decision 3).

**A mapping says where its muscle is loaded**, relative to the anchor (M `types.ts:345, 373`): `VariantMapping.sideRelation` is `same` (default: every `forearm_mappings_v1` row reads unchanged), `opposite` (a suitcase carry in the left hand loads the right quadratus lumborum) or `both` (the erectors on a one-arm row).

**One function resolves the side, per node and mapping**, not once per bout (M `bouts.ts:87-93`). Bouts carry the raw recorded `armSide` and `legSide` and their sources. `nodeSideFor(region, variant, mapping, bout)` in `exposure.ts` returns the sides a contribution is counted on:

1. **Midline region:** counted once, `midline`, whatever was recorded, unknown included. Nothing is per side and nothing is "unknown side".
2. **`sideRelation: both`:** each side, also when no side was recorded.
3. **The region's limb is structurally bilateral for this variant** (`laterality` for an arm region, `leg_laterality` for a leg region, §3): each side, as today.
4. **The bout recorded a side of the region's limb:** that side (`same`) or the other (`opposite`); a recorded `both` is each side.
5. **The variant is `not_applicable` for the region's limb** (a leg press for an arm region, a hands-free back extension): no side comes from that limb. Such a mapping must be `both` (database rule 11, §5.1; a content test), so rule 2 has already answered.
6. **Anything else**, including a side recorded only for the other limb: unknown, kept apart and never counted, as today.

**Planned one-sided work is planned per side.** A planned set of a variant that is `unilateral` for its `sided_by` limb stands for one set per side ("3 × 12 is three sets for each arm", P `planBouts.ts:70-77`). `planBouts` therefore emits two bouts per planned set, `…/n#right` and `…/n#left`, each carrying its side on the `sided_by` limb with `sideSource: "plan_assumption"`, and rule 4 places them. An `either` variant stays one bout, recorded `both`, `plan_assumption`, as the tracker logs it as one row starting on Both. The forearm's planned numbers do not change (each arm still gets 3 for "3 × 12"); midline and other-limb pages now count the plan as the tracker logs it (critic experiment c8: 409 Suitcase Carry "3 × 30" was 3 planned against 6 logged on a midline page). The tracker lays a planned set of such a variant out as two rows, Right then Left on its limb, whenever the athlete has an active target in **any** production region that maps the exercise (§6.4), so "logged as built" equals planned on every page.

**What a bout puts where.** Each contribution carries `countedSide` (from `nodeSideFor`), `recordedSide` (the arm or leg side as stored) and the `sideRelation`; the ledger labels a row by `countedSide` and adds a note where they differ ("Left hand: opposite side", "Standing leg: left") (P `MuscleSheet.tsx:150`). Region totals: a bout counts in the region's distinct bouts on side S when any own node is credited with it on S, and in the region's unknown-side set only when no own node is credited with it on S (M `exposure.ts:419-425`; P `SpecializationPanel.tsx:390-398`), so "…and N more had no arm recorded" never counts a set that is already counted.

Consequences, each a test, on paired and midline pages, completed and planned:
- a back squat counts once on each leg; a Bulgarian split squat logged "Front leg: Right" counts on the right leg; a single-leg RDL logged "Standing leg: Left" credits the left hamstrings;
- a suitcase carry in the left hand credits the right quadratus lumborum on the back page (the ledger row reads "Right", noted "Left hand: opposite side") and the obliques once on the core page;
- a one-arm row logged Right credits the right lat and both erectors; logged with no side, it credits both erectors and is not in the back's unknown-side set (the lat's unknown contribution stays on the lat's row);
- a decline sit-up counts once on the core page, not once per arm; a side plank with no side recorded counts on the core page;
- planned equals logged-as-built on the core, the back and the forearm for 409 Suitcase Carry, 46, 173 Bulgarian Split Squat and 247 Side Plank;
- a goal's value equals its row's bucket in every scenario above (§2.2).

### 2.2 The page, the logger and goals

- **The page's switch** reads the region's words (§1.1). A midline region shows no switch, no side in any sentence, no other-side summary (so no side-difference finding and no trailing-side suggestions), no unknown-side lists, and never mirrors its drawing (P `SpecializationPanel.tsx:419-422, 120, 125, 158, 167, 210`; M `recommendations.ts:193-213, 484-487, 560`). One helper, `sideWordsFor(region)`, holds every side phrase the page uses ("Both legs", "one leg at a time", "counted for neither leg", `onSide`); no component writes "arm" or "leg" (§6.2). The unknown-side sentence names the limb the logger asked about ("3 sets had no arm recorded" on the chest page).
- **The address** keeps `limb`, written only for a paired region; the value stays in state across a core visit so the next paired region gets its side back (P `viewState.ts:16-35, 46, 86`).
- **The logger** asks `Arm`, the anchor's leg, or nothing (§6.4). The question appears when the variant is one-sided or either for its `sided_by` limb and a production region paired by that limb maps it (a side plank mapped only by the core asks nothing).
- **Goal progress reads the rows.** Goals are counted from the same per-node, per-side contributions the rows use, over the goal's own period (M `exposure.ts:472-506`): a muscle goal reads the node's bucket for its metric; a movement goal counts distinct bouts with an own-node contribution on this side whose part has the goal's action and category, seconds once per bout. `onArm(bout, goal.side)` goes. A test runs every §2.1 scenario and requires each goal's value to equal its row's bucket.
- **Targets only on a region's own target muscles.** From wave 0, the Targets editor appears only for a node whose role in the page's region is `target` (P `MuscleSheet.tsx:161`; the external group stays selectable for its rows, `SpecializationPanel.tsx:296`). An external's sheet says "Targets for this muscle are set on the upper-arms page" with "Open the upper-arms page" once its home is in production. `validateGoal` refuses a new muscle goal on anything but a target of the goal's region, and a side that does not fit the region (M `goals.ts:56-82`).
- **Targets already on the device** (critic experiment c7: today's page accepts targets on the biceps, brachialis and anconeus):
  - a muscle goal on an external node keeps counting as today until the node's home region is in production; from then it is **re-homed on read** to the home region, keeping its id, and written so on its next save. The biceps' and brachialis' targets move to the upper-arm page at wave A, and their progress is read through the upper arm's version from then (stated in the wave A release);
  - a goal on an adjacent node (the anconeus) stays where it is, counted from the node's bucket, shown read-only with "Targets are for this region's target muscles. You can end or remove this one.": `validateGoal` lets it be ended or removed, nothing else;
  - `sameGoalTarget` ignores `regionId` for muscle goals (a muscle has one home), so a re-homed goal and a new one can never be two active targets for the same muscle, side, metric and period (M `goals.ts:47-49`). In the database, a muscle goal must name a listed target member of its region (§5.1), which fixes its region to the node's home, so the existing exclusion constraint over region, node, side, metric, period and dates is in effect keyed by node;
  - tests with these stored goals: the external one before and after its home's promotion, the adjacent one, and a clash with a re-homed one.
- **Goal words** take the region's side words: "Choose the left or the right leg. A target for both legs is saved as two."; the clash message says "a right-leg target" (M `goals.ts:62, 78`). A paired region's goal has a side, and "Both legs" saves two goals, as "Both arms" does (02-design.md §5). A midline region's goal has side `midline` and the Targets editor shows no side control (P `TargetsEditor.tsx`). `midline` is a value, not null, so the overlap exclusion still compares it (D `schema.sql:338-368`). The device stores accept `midline` (P `stores.ts:66,145`).
- **Measurements** that go around the trunk have side `midline` even in a paired region (§4.4).

## 3. Variants

- **One variant per catalog exercise, `cat-<id>`, shared by every region.** The library is `shared/specialization/variants/`, keyed by catalog id; regions reference variants by id and never declare their own (M `ids.ts:82`, `emit-seed.ts:323`; G `emit-seed.ts:202-212`). One resolver, `variantFor(catalogId)`, is used by exposure, bouts, planBouts, progressSeries, the logging table and the hold list, so the logger and the calculator can never read an exercise two ways. The measure-agreement problem goes away by construction (M `holdCatalogIds.test.ts:16-29`).
- **One current variant per catalog id.** The library may hold a replaced variant only behind a `replaces` link; the resolver returns the current one. A test requires every current mapping version's mapped variant ids to be the ids the resolver returns for their catalog ids (M `exposure.ts:89-103`; P `bouts.ts:266-277`). So a variant can be replaced (`cat-<id>.v2`, `replaces: "cat-<id>"`) only in a release that also publishes a new mapping version for **every** region whose current version maps the old key; the old versions stay published and unread. None is planned; a wrong frozen column that only one region reads differently is handled by an attribute instead (below).
- **The forearm's 119 records move into the library word for word** and stay frozen (D `schema.sql:791-822`; all 119 are `cat-<id>` ids: 85 bilateral, 8 either, 26 unilateral). Nothing updates them.
- **`laterality` (the arms) gains `not_applicable`**, for exercises where the hands do no work (leg presses, extensions and curls, back extensions, the seated calf raise, the belt squat: 169–172, 194–196, 200, 201, 222, 351, 367, 368, critic c9; the variants lane confirms each). The TypeScript type and the database check (schema v2, §5.1) widen; no frozen row changes.
- **Counting attributes**, stored as variant attributes of dimension kind `counting` (§5.1) so a frozen row is never written, and **always written explicitly: there is no run-time default** (a default would let an addition change a published version's counting with no new version):
  - `sided_by`: `arm | leg | none`, the limb whose side the logger records, and the limb `planBouts` splits on. Required for every variant a production region maps. Where both limbs are one-sided (for example 224 Single-Leg Calf Raise with one dumbbell, 356 Cable Single-Leg Deadlift, 357 and 358 cable step-ups, 371–373 cable lunges, 188, 264; the variants lane lists them all), it is chosen once, by the first wave that maps the variant in a new version, looking at every region in §1.2 that will map it (the list is fixed, so this is knowable), and recorded with its reason in `docs/specialization-atlas/regions/variants.md`; the emitter refuses such a variant without it.
  - `leg_laterality`: `bilateral | unilateral | either | not_applicable`, the legs' counterpart of `laterality`. Set by review from the exercise, never from the catalog's `unilateral` quality, which sits on 70 leg rows including the back squat and leg press. Required for every variant a leg-paired region maps and for every variant with `sided_by: leg`.
  - `side_anchor`: required with `leg_laterality` `unilateral` or `either` on a variant a leg region maps, and with `sided_by: leg` (§2.1). The arm's anchor is fixed (the loaded hand) and is not stored.
  - Tests: every variant a leg-paired production region maps with `leg_laterality` `unilateral` or `either` has `sided_by: leg`, and every variant an arm-paired production region maps with `laterality` `unilateral` or `either` has `sided_by: arm`, except the both-limb variants listed in `variants.md` with their decision; every listed both-limb variant has an explicit `sided_by`.
- **Freezing.** An attribute present when a version that maps its variant is published is frozen from that publish: `guard_mapping_version` stamps `variant_attributes.frozen_at` (§5.1). An attribute added later is free until the next version that maps the variant is published; rule 11 makes that version's counting attributes present, so "absent" is never what a version rests on. Forearm v1 was published before attributes existed, so its variants' `sided_by` values (written at wave 0: `arm` where `laterality` is not bilateral, `none` otherwise, which is today's behaviour) are pinned by a content test instead, and may change only through the listed exceptions 188 and 264 (below).
- **Descriptive dimensions**, from a vocabulary held as rows (`variant_dimensions` of kind `descriptive`): `knee` (straight, bent, changing), `hip` (flexed, neutral, extended, changing), `torso` (upright, inclined, horizontal, supine, prone, changing), `bench` (flat, incline, decline, none), `plane` (vertical, horizontal, diagonal, changing), `grip_width` (narrow, shoulder, wide), `stance` (bilateral, split, single_leg, staggered), `range` (full, lengthened_partial, shortened_partial). The variants lane may add values and dimensions through the seed, never through the schema. Angles are categorical; a defined angle is said in the notes. No published rule reads a descriptive dimension; mapping rationales cite them (the gastrocnemius-or-soleus split rests on `knee`). They freeze at publish like the counting ones.
- **Each wave writes only the attributes its regions read.** Leg-only attributes (`leg_laterality`, `side_anchor`, `stance`, `knee`) are written in the legs' waves and reviewed with the leg mappings, so no earlier publish freezes them before a leg lane has looked; attributes are add-only, so deferring them costs nothing. The exception is `sided_by` on a both-limb variant, which the first wave that maps it must decide.
- **New variants** fill the forearm columns honestly: `not_applicable` where the hands do nothing, a real grip where one is held (a back squat holds a bar overhand). `not_applicable` is also added to `ForearmOrientation` and `WristPosition` and to their checks (D `schema.sql:259-274`).
- **Frozen rows that another region reads differently.** The single-leg RDL (188) and its twin (264) are `either` for the arms (frozen) and get `sided_by: leg`, `leg_laterality: unilateral` and `side_anchor: stance_leg` in the first release that publishes a new version mapping them, so the logger asks "Standing leg" from then. From then the forearm reads those sets' grip as "no arm recorded" (rule 6), because the side recorded is the leg (§11, decision 9). These are the only listed exceptions to the pinned forearm `sided_by` values.
- **Holds.** The logger measures in seconds exactly the variants a production region maps with `measure: "seconds"`. The generated `holdCatalogIds` (§6.4) includes a core hold only when the core ships, and only after the owner's decision on the six planks and holds now logged in reps (§11, decision 2; M `holdCatalogIds.ts:16-19`).
- **Catalog fixes** (wrong tags such as 249 Pallof Press tagged primary `chest`) are made by the wave's variants lane, listed in its note and the pull request, as the forearm's 139–145 and 232 fixes were (05-mappings.md).
- **Tagged but deliberately unmapped** rows move into region data: `SpecializationRegionData.unmappedTagged: {catalogId, reason}[]` (M `variants.ts:207-252`). One generic test: every catalog row with a **primary** tag in a region's `catalogKeys` has a reviewed or draft mapping in that region, or a listed reason; a **secondary**-tagged row is mapped where the region is really loaded, or listed. The page shows the listed rows the athlete did (§8).
- **A variants lane in every wave** (§9.2) owns the library during that wave: new records for the wave's rows (wave A 121, B 59, C 93, D 19, E 5; 297 in all; 395 catalog rows carry a region key, 98 of them already have a forearm variant), the attributes the wave's regions read, catalog fixes, and every missing-variant request from the wave's mapping lanes.

## 4. Mappings, the rule and measures

### 4.1 Versions

- One version per region: `shoulders_mappings_v1`, `chest_mappings_v1`, `back_mappings_v1`, `upper_arm_mappings_v1`, `core_mappings_v1`, `hips_mappings_v1`, `thigh_mappings_v1`, `lower_leg_mappings_v1`. The forearm stays on `forearm_mappings_v1` (418 rows, 413 reviewed, 5 draft; 53 of them on the biceps and brachialis; no forearm variant is mapped only to those two).
- Mapping ids stay `cat-<id>:<nodeId>` within a version; anything that holds mappings of two regions (the composed page data, the ledger, also-loads) keys them by `versionKey/id` (M `mappings.ts:94-97`).
- A version maps only muscles whose home is its region (database rule 12, a publish-time rule, §5.1). `requiresNoStraps` is `false` outside grip mappings (G `rules.ts:27`).
- Every version carries `methodNotes` (the forearm's are in `regions/forearm/mappings.ts:339-342`), required by a content test, saying what §8 requires.

### 4.2 Externals are credited by their home region

On region R's page, an own muscle is credited by R's current version; an external member is credited by its **home region's** current version, restricted to R's members. On a page paired by the same limb as the home (§1.2 makes that the only paired case), one muscle and one set therefore show the same row on every page; on a midline page an external's row is the same distinct bouts counted once. The one exception is history: where the home region has no published version, the listing region's own rows are read. That is only the forearm's 53 rows on the biceps and brachialis, read until `upper_arm_mappings_v1` is published (wave A); from then the forearm page credits them as the upper arm does, and the 53 rows stay in `forearm_mappings_v1`, published and frozen, unread by the page. The wave A release says so.

- **Composition.** `SpecializationRegionData` gains `externalMappingVersions`; `indexRegion` keeps, per node, exactly one version's mappings (the brief's "no double counting" holds per node, M `exposure.ts:97`), and keeps each mapping's `versionKey`.
- **Classification by own muscles.** A bout's effects are split into own effects (on R's own members) and external effects (M `exposure.ts:54-57, 130-155, 387-395`):
  - **mapped:** some own member has a mapping for the variant (reviewed or draft). As today; external effects are credited too.
  - **region-only:** no own member is mapped, and the catalog tags carry R's catalog keys within R's tag scope. Counted in `regionUnclassified` and `boutsRegionOnly`, never fanned out to own nodes, **and** its external effects are credited to the external rows.
  - **external-only:** no own member is mapped and the tags do not match, but an external member is mapped. Its external effects are credited to the external rows; it is not in the region's totals, the region-only bucket or completeness.
  - **unrelated:** nothing above.
  - `boutsWithReviewedMapping` and `boutsPendingReview` count own effects only. Tests: on every page, an external's row equals its home page's row for the same bouts and side (same limb), or the home's distinct bouts (midline page); the forearm's `regionDistinctBouts`, `regionUnclassified`, `boutsRegionOnly` and completeness at wave A equal wave 0's for the release-gate histories and for critic c3's rows (24, 63-65, 279, 280, 345 tagged forearms and biceps; 318, 326, 329, 330, 333 not tagged forearms).
- **Shared partners stay within one version.** `sharedWithOf` groups reviewed `shared` mappings of the same variant and category only where `mapping.versionKey === credited.versionKey` (M `exposure.ts:187-194`), so the page never says work "cannot be split" between muscles of two regions whose versions made no such claim. A fixture with two versions both marking `shared` rows on one variant tests it.
- **Also loads** (the add and swap sheets, the suggestions' overlap): the page's own and external members by node, then one line naming the other regions that map the exercise ("Also loads muscles of: Chest, Upper arms"), from the generated logging table (§6.4), so the page never needs every region's mappings (M `recommendations.ts:173-176, 315, 419-420, 509-524`).

### 4.3 Rule versions

The categories and `categoryFor` are unchanged (02-design.md §3). The rule's text is published in the release whose regions first use a clause, and each version is a superset of the one before; later clauses wait in TypeScript as unpublished drafts and are not emitted until their release. A published rule cannot change (D schema v1:750-769), so no clause is frozen before a production region rests on it. `summary.ruleVersion` comes from the rule passed in, not a constant (M `exposure.ts:440`); every page reads the current published rule.

| Rule | Published with | Adds |
|---|---|---|
| `specialization_exposure_v1` | (18 Oct) | the forearm, as shipped; the only rule through wave 0 |
| `…_v2` | wave A, the upper arm | region-neutral wording; catalog keys and their tag scope named per region; a bout is classified by the page's own muscles (§4.2); "a muscle of another region is credited as its home region's current mapping version credits it; where that region has no published version, the listing region's own reviewed rows credit it"; straps: "a grip mapping that needs a bare hand does not credit a set logged with straps", shown only on a region that has such a mapping (P `SpecializationPanel.tsx:574-583`) |
| `…_v3` | wave B, shoulders, chest, back | side relations: a mapping's muscle is loaded on the recorded side, the opposite side, or both; on the chest and back a side is the working arm's side |
| `…_v4` | wave C, the core | midline: a midline region counts every bout once and has no sides |
| `…_v5` | wave D, the lower leg | the leg limb: a leg's side is the anchor leg's; a limb the exercise does not use gives no side; planned one-sided sets count once per side on that limb |

A test maps every branch of `nodeSideFor` and of `indexRegion`'s version choice to a clause of the current rule, and refuses production data that reaches a branch whose clause is not yet published (no midline production region before v4, no leg one before v5). The ledger's category label for incidental work takes the region's word, "Incidental bracing / stabilization" (M `rules.ts:77`; P `model.ts:161-163`); the strapped finding's words move into the rule's data (P `model.ts:310-320`).

**The forearm's golden test runs at every release** (0, A, B, C, D, E), not only at wave 0: it computes the release-gate histories (`scripts/specialization/release-gates/`), completed and planned, with the shipped code and the release's code and requires identical summaries except an explicit, reviewed list of allowed differences that the release notes repeat:
- wave 0: planned bout ids of one-sided variants (`…/n#right`, `…/n#left`); the new `countedSide`, `recordedSide` and `sideRelation` fields (`same` on every forearm row); the new §8 fields `completeness.boutsListedUnmapped` and `listedUnmappedRows`, which on the forearm hold only the sets of 296–298 (sled push, drag and sprint: the grip quality, no forearm muscle tagged; listed unmapped, in no total); nothing else (the rule stays v1);
- wave A: the rule version; the biceps' and brachialis' rows (credited by the upper arm, §4.2);
- every release: region-only bouts of forearm-tagged exercises whose variant arrives in that release and is two-handed move from "no arm recorded" to both arms (critic c10: three sets of 190 Good Morning, unknown side 3 → 0); the list is generated and printed in the release (§11, decision 11);
- the release that writes `sided_by: leg` on 188 and 264: those exercises' sets logged after it.

### 4.4 Measures per region

| Region | `measurementMetrics` | Default protocol | Progress subtitle |
|---|---|---|---|
| shoulders | girth_cm | around both shoulders at the widest point, standing relaxed | "Shoulder girth" |
| chest | girth_cm | around the chest under the arms, standing relaxed | "Chest girth" |
| back | — | | "Performance from your logged sets" |
| upper_arm | circumference_cm | mid upper arm; relaxed hanging, or flexed | "Arm circumference, by arm" |
| forearm | circumference_cm, grip_force_n (unchanged) | as shipped | "Circumference and grip, by arm" |
| core | — | | "Performance from your logged sets" |
| hips | girth_cm | around the hips at the widest point of the buttocks, standing relaxed | "Hip girth" |
| thigh | circumference_cm | mid-thigh, standing relaxed | "Thigh circumference, by leg" |
| lower_leg | circumference_cm | widest point of the calf, standing relaxed | "Calf circumference, by leg" |

- A new metric `girth_cm` is a girth around the trunk: always side `midline`. `circumference_cm` stays a limb measure, always per side. So no per-region "sided" flag is needed (P `MeasurementsPanel.tsx`).
- New postures: `arm_flexed`, `standing_relaxed` (M `types.ts:410, 416`).
- Each region's default landmark and posture per metric become region data, `measurementDefaults`, instead of forearm text in the panel (P `MeasurementsPanel.tsx:22-27, 38-41, 463`).
- No girth for the back or the core, and no waist: waist girth mostly follows fat, not the muscles the page is about (§11, decision 8). "No inference from circumference to a single muscle" stays (02-design.md §5).

## 5. The database

### 5.1 Schema v2: `supabase/migrations/…_specialization_atlas_schema_v2.sql` (version `20261019120000`)

Additive and idempotent; no transaction control; runs directly and as one DO block. Built from the tested prototype (`experiments/multi-region-2026-10-19/schema_v2_prototype.assembled.sql`), with the changes marked *new* (several come from the critiques, appendix).

**New tables**

| Table | Key | Columns and constraints |
|---|---|---|
| `region_nodes` | `(region_id, node_id)` | `region_id` → regions, `node_id` → nodes, `role` in (target, adjacent, external, group), `sort_order`, `caveats text[] not null default '{}'`, *new* `listed boolean not null default true`. Index on `node_id`. Backfilled from the published versions. Consistency trigger: `role = 'external'` exactly when `nodes.region_id <> region_nodes.region_id`, checked on insert and update, and on `nodes.region_id` updates. Guard: the role, the membership and `listed` are frozen while a non-draft version of that region maps the node; `sort_order` and `caveats` stay free; **no row is ever deleted by the seed** (below). Truncate trigger. |
| `region_actions` | `(region_id, action_id)` | `region_id` → regions, `action_id` → actions, `sort_order`, *new* `listed boolean not null default true`. Backfilled for the forearm with its 20 actions in v1 order. Never deleted by the seed. |
| `variant_dimensions` | `id` (`^[a-z][a-z0-9_]*$`) | `label` non-blank, `sort_order`, *new* `kind` in (counting, descriptive). Seeded with `sided_by`, `leg_laterality`, `side_anchor` (counting) and the §3 descriptive set. |
| `variant_dimension_values` | `(dimension_id, value)` | `value` `^[a-z0-9][a-z0-9_]*$`, `label` non-blank, `sort_order`. |
| `variant_attributes` | `(variant_key, dimension_id)` | `variant_key` → exercise_variants, `(dimension_id, value)` → values, `notes`, *new* `frozen_at timestamptz` (null until frozen; not among the seed's upsert columns, so a re-apply never touches it). Guard (*new*, replaces the prototype's): refuses update or delete of a row whose `frozen_at` is set; the only update allowed on an unfrozen row besides content is `frozen_at` going from null to a time with every other column equal, which `guard_mapping_version` makes. A new attribute may be added to any variant. Truncate trigger. |

**Changed tables** (constraint replacement validates rows without writing them, D experiment 2)
- `regions` gains `side_model` (paired, midline), `side_limb` (arm, leg), `side_word`, `side_word_plural`, `catalog_keys text[]`, `region_only_tag_scope` (any, primary; default any), `external_heading`, `measurement_defaults jsonb` (object). Schema v2 writes the forearm row's values (paired, arm, "arm", "arms", `{forearms}`, any, "Forearm muscles credited here", its defaults) before adding `regions_sides_shape` (production and fixture rows need a complete side model; reference rows need none). `measurement_metrics` check widened with `girth_cm`. Guard: a region with a non-draft version keeps `status = 'production'`, its side model and limb, its catalog keys and its tag scope, which decide what counts.
- `exercise_variants`: the `laterality`, `forearm_orientation` and `wrist_position` checks gain `not_applicable` (*new* for `laterality`; D `schema.sql:259-274`, `:267`).
- `variant_mappings`: `side_relation text not null default 'same' check (side_relation in ('same', 'opposite', 'both'))`. Adding a column with a constant default writes no row and fires no trigger; the seed then writes `same` for every v1 row, which changes nothing. Tested.
- `goals`: side check `('left', 'right', 'midline')`; foreign keys `(region_id, node_id)` → `region_nodes` and `(region_id, action_id)` → `region_actions`; trigger: side `midline` exactly in a midline region; a new muscle goal names a **listed `target`** member, a new movement goal a **listed** region action; an existing goal on a member that is not a listed target may only be ended (`ends_on`, `updated_at`) or deleted. Both tables are empty in production; a future goals sync sends re-homed goals only (§2.2).
- `measurements`: side check `('left', 'right', 'midline')`, metric check with `girth_cm`, `measurements_side_metric`: side `midline` exactly when the metric is `girth_cm`; `measurements_protocol_shape` restated with the postures `arm_flexed` and `standing_relaxed`.
- `nodes.role` and `nodes.sort_order`, `actions.sort_order`: commented as legacy (v1 values); readers use `region_nodes` and `region_actions`.

**Restated functions** (in full; `create or replace` keeps the ACL, verified)
- `mapping_version_problems`: rules 1–9 as in v1; **10** every mapped node is a member of the version's region (forearm v1 passes it); and two **publish-time rules, evaluated only while the version is still a draft** (`join specialization.mapping_versions v on v.id = p_version_id and v.state = 'draft'`; `guard_mapping_version` calls the function from its BEFORE UPDATE trigger, while the stored row is still a draft):
  - **11** every mapped variant has the counting attributes its region's side model reads: `sided_by` always; `leg_laterality` for a leg-paired region or where `sided_by = 'leg'`; `side_anchor` where a leg-paired region maps a `unilateral` or `either` leg variant, or `sided_by = 'leg'`; and a mapping on a variant that is `not_applicable` for the region's limb has `side_relation = 'both'`;
  - **12** every mapped node's home is the version's region.
  
  So `mapping_version_problems(forearm_mappings_v1)` stays null after the apply (§5.3; `server/specializationSchema.test.ts:880-883` keeps passing), and publishing a draft that maps another region's muscle is refused with "mapped muscles whose home is another region: …" (critic experiment 1b on PGlite: v1 null; a forearm draft mapping `upper_arm.biceps` refused). Refusal tests for 11 and 12.
- `guard_mapping_version`, at the draft-to-non-draft change, before `mapping_version_problems`: `perform 1 from specialization.regions r where r.id = new.region_id for share;` (*new*), then `FOR SHARE` on the version's `region_nodes` rows and on the mapped variants' `variant_attributes`, then v1's locks; after the checks, `update specialization.variant_attributes set frozen_at = now() where frozen_at is null and variant_key in (the version's mapped variants)` (*new*). Publishing locks everything it rests on, as v1's principle says (D `schema.sql:566-650, 597-631`).

**RLS, grants, functions** (D `schema.sql:1072-1086, 1134-1164, 1239-1259`: v1's loops do not cover new objects, so every one is named)
- RLS enabled on all five tables. Policies, `to authenticated`, select only: `region_nodes` where the node is reviewed and the region is production or reference (unlisted rows included, so a goal's key always resolves; readers filter on `listed`); `region_actions` where the region is production or reference; dimensions, values and attributes `using (true)`, like `exercise_variants`.
- Each new table: revoke all from `public, anon, authenticated, service_role`; grant `select` to `authenticated`; `select, insert, update, delete` to `service_role` (never TRUNCATE, TRIGGER or REFERENCES). No default privileges are written.
- Each new function: `set search_path = ''`, not SECURITY DEFINER, revoke all from `public, anon, authenticated, service_role` (trigger functions need no grant). The schema test's `pg_proc` walk keeps the allow-list empty.
- Truncate triggers on `region_nodes` and `variant_attributes` reuse the generic `refuse_truncate_while_published`.
- Locks while applying: none outside `specialization` (prototype measured: ACCESS EXCLUSIVE on `exercise_variants` and `goals`, SHARE ROW EXCLUSIVE on `nodes` and `regions`; nothing in the app reads them). 5 s lock timeout as for v1.

### 5.2 Seeds: one full re-emit per release

- **Applied files are pinned before anything else changes.** A wave-0 prologue commit, alone and first (§9.2), adds a history test that pins the full SHA-256 of every applied migration file: schema v1 `b67a9cd7a90383c205686e17b029a55ffd5a59ee4d928189d3a7d16296da542d`, seed v1 `a267fdc4997699401822c2f4166a97b427fe28d8081bebcba037f963a35189f8`, and each later file once production records it. The same commit points `CURRENT_SEED_MIGRATION_PATH` at `…_seed_v2.sql` (the emitter writes it; `--check` and the drift guard read it; D `emit-seed.ts:63, 724-743`), and the drift guard's message names that file. Without this, lane 0a's first change would turn the drift guard red and its own message ("Run: npx tsx scripts/specialization/emit-seed.ts", `specializationSeed.test.ts:96-104`) would rewrite the applied seed v1 unnoticed. The "regenerate the database seed" notes in `design/specialization/forearm/emit.mjs:7, 28` and `diagram.generated.ts:6` name the command, not the file, so they stay correct and are not rewritten: line 28 generates `diagram.generated.ts`'s header, and the forearm drawing stays byte-identical (§7.1).
- **Each release gets the next seed file**, a full idempotent re-emit of every production and reference region (forearm included): `…_seed_v2.sql` at wave 0, `_v3` at A, `_v4` at B, `_v5` at C, `_v6` at D, `_v7` at E. A seed file is history from the moment production records it; until then it may be regenerated (§9.4 says when that moment is).
- **Emitter changes** (D `emit-seed.ts`):
  - References are checked against the merged sets of every region in the seed (nodes, claims, sources, variants), not per region (D `:258-302`).
  - Nodes, actions, sources, variants and claims are each defined once (shared libraries, §1.3), so `mergeByKey` only ever sees one record.
  - Claim keys from `ownerRegionId`; the stale-claim delete per owner (§1.3).
  - Each region's members go to `region_nodes`, its actions to `region_actions`. A member or action the content drops is set `listed = false` (refused when frozen); **memberships and region actions are never deleted**, because goals reference them and a delete would fail on another user's row (critic experiment 3: `violates foreign key constraint "goals_node_in_region"`) or, with a cascade, delete athletes' goals.
  - `nodes.role` is written as `storedRole ?? role`; `nodes.sort_order` and `actions.sort_order` are written as the v1 value for every v1 row (a pinned table, tested against seed v1) and `region sort × 1000 + member index` for new rows, so no region sorting before `forearm` rewrites forearm rows (D experiment 3).
  - New claims are written as drafts, then their sources, then set reviewed with their date, so a reviewed claim on a mapped muscle can get its first source (D `schema.sql:945-1003`).
  - Variant attributes, dimensions and their values get their own sections, written **before** the versions section, so a version published by the same seed freezes the attributes it rests on. Mappings write `side_relation`; regions write the new columns; the rule section writes v1 and every published version, never a draft.
  - The header names schema v2, with no version digits (D `specializationSeed.test.ts:133`), and replaces "Rollback: the schema's (drop schema if exists specialization cascade)" (D `emit-seed.ts:715`) with "Forward-only: a correction is a new key in the next seed (schema v2 has one undo, valid only before seed v3)".
- **What a seed may change in existing rows, and nothing else** (the no-op test lists exactly these): the upper arm's region row at its promotion; node descriptions that moved to memberships (biceps and brachialis, wave A); region rows' new columns; `listed` going false on a dropped member or action; an unfrozen attribute's value (the variants lane's corrections before a publish); `catalog_exercises.supabase_exercise_id` links that `public.exercises` has gained (D `emit-seed.ts:564-576`). Applied a second time, a seed touches no row (xmin and ctid compared on every table).
- **Harness** (D `specializationPg.ts:28-30, 178-185`): an ordered list of migrations replayed in production order (schema v1, seed v1, schema v2, then each applied seed, then the current one), each schema file applied twice. The `public.muscles` stub holds the canonical names the content uses, read from production read-only at the start of each wave; a `databaseMuscle` with no production row is `null` (D `schema.sql:128`).
- **Tests** extend to the five tables (structure, grants, RLS as anon, user A, user B and service role; frozen tables; truncate), every new constraint and guard (each refusal of D experiment 2 as a case, plus: an attribute frozen by a publish refuses change and delete; an attribute added after a publish stays free; `frozen_at` survives a re-apply; a dropped member is unlisted, not deleted, with another user's goal on it; the region row's `FOR SHARE` lock is present in the function body, since a race cannot be run on PGlite's single connection, 04-database.md §8), rules 10–12, DO-block equivalence and locks for every file, hard-coded counts derived from the merged content (D `specializationSchema.test.ts:36-42, 45-50, 61, 236-272, 406-455, 1138-1287`; `specializationSeed.test.ts:95-261`). The deltoid fixture stops colliding with production: its external becomes `fixture_arm.triceps` in a fixture region `fixture_arm`, its variants `fx-<catalogId>`, and it reuses the library's actions (D `deltoidRegion.ts:58-73, 108`).

### 5.3 The apply path (what worked on 18 Oct)

- `scripts/specialization/release/make-apply-sql.mjs <sha> <outDir> <file…>` takes the files as arguments, no longer a hard-coded pair, and no longer writes `drop-http.sql` (D `make-apply-sql.mjs:29, 62`). Each file becomes one DO block: `set_config('lock_timeout', '5000', true)`; `create extension if not exists http`; fetch the file at the pushed commit from raw.githubusercontent.com with a 30 s timeout; refuse unless HTTP 200 and the SHA-256 match; refuse unless every earlier specialization migration is recorded in `supabase_migrations.schema_migrations` and this one is not; execute; insert its history row under the file's own version and name. One transaction per file.
- Run with the Supabase MCP `execute_sql`, one file per call: schema v2 (wave 0 only), verify, then the seed. Never `apply_migration` (it hung on `DROP EXTENSION http`) and never drop `http` (04-database.md §9).
- Read-only first: `schema_migrations`; whether `http` is still installed (§11, decision 7); the `public.muscles` canonical names.
- Verify read-only after: counts per region and per table; `region_nodes` for the biceps (forearm/external and, from wave A, upper_arm/target); every version published and `mapping_version_problems()` null for every published version, `forearm_mappings_v1` included (rules 11–12 are publish-time, §5.1); every attribute of a published version's variants frozen; RLS on all 24 tables; grants; no client-executable function; PGRST106 for the schema; security and performance advisors.

### 5.4 Rollback

- **Forward-only** for every seed and for schema v2 after seed v3: a correction is a new key or a new version in the next seed. The v1 line "drop schema if exists specialization cascade" is not carried into any later file: after wave 0 it would destroy `forearm_mappings_v1`'s published history and any synced goals, and leave `schema_migrations` rows for files no longer in the database, which the apply refusal of §5.3 would then refuse to re-apply.
- **One undo, for schema v2 only, valid only before seed v3** (`…_schema_v2_undo.sql`, kept in `scripts/specialization/release/`, not in `supabase/migrations`): in one transaction, refuse unless seed v3 is not recorded; drop the five tables, the new columns, constraints and triggers; restore v1's `mapping_version_problems` and `guard_mapping_version` bodies and v1's checks (possible only while no `not_applicable` variant exists, i.e. before seed v3); delete the `schema_migrations` rows of schema v2 and seed v2. The rollback test (`server/specializationSchema.test.ts:1138-1170`) extends to: apply v1, seed v1, schema v2, seed v2, undo; the database equals the v1-applied state (catalog compared table by table); re-applying schema v2 and seed v2 then succeeds; the undo after seed v3 refuses.

## 6. The page and Home

### 6.1 Choosing a region on a phone

Inline, at the top of the page; no sheet, no landing page (CLAUDE.md: routine choices inline).

- **The heading is the toggle** (the iOS title-menu pattern): one 44 px row holding `[‹ Muscles]` when another screen opened the page, then the `h1`, whose content is a bordered button with the region's label and a chevron, "LOWER LEGS ⌄", visible at rest, `aria-expanded`, `aria-controls="spz-regions"`, described as "Choose a body region". The toggle renders only when more than one production region exists; with one (wave 0) the `h1` is plain text and the row is exactly today's heading. `heading` stays the document title and the search label.
- **Back, in the same row**, with a short origin name of 9 characters or fewer: Home, About me, Progress, Strength, Plan, Review, Workout, Matches, Movements, Muscles, Catalog (`workspaceShortTitles`, beside `workspaceTitles`, P `Home.tsx:249-262, 2553`). Measured: the row stays one line, 44 px, with no horizontal overflow, for "Upper arms", "Lower legs" and "Shoulders" against every short name up to "Movements", at 320, 375 and 390 (`arch-phone/checks.json`, scene `head-row`). At 320 nothing overflows; if a future label wraps, the `h1` wraps inside the button and the row grows, nothing is cut. A phone render test holds this for the longest label against the longest short name.
- **The date fields' labels sit inline** ("From [date] To [date]", one 44 px row instead of 67 px, two equal columns at 375 and wider, stacked at 320), with 16 px inputs (no zoom on focus).
- **The grid**, under the row when open: `role="group"`, `aria-label="Body region"`, the **production regions only**, in body order (Shoulders · Chest · Back / Upper arms · Forearms · Core / Hips · Thighs · Lower legs), in 3 columns that reflow, with no disabled or "coming soon" cells. Each button: min-height 2.75rem, min-width 0 (not `.spz-chip`'s 6.5rem, which overflows at 320, P `specialization.css:248`), a 16 px label that may wrap at 320, a 12 px second line "2 targets" when the athlete has active targets there, `aria-pressed` on the current region. Open is a **choosing state**: only the row and the grid must be on the first screen, and they are: measured with Back at 320 × 568 (grid 175–360 against the dock at 498), 375 × 667 (180–344 against 597) and 390 × 844 (180–344 against 774).
- **Picking** calls `onStateChange(withRegion(state, id))`: replaceState, so Back and its label still return to the origin; node and view reset, layer to surface; mode, window, dates, plan week, map and limb kept (P `viewState.ts`, `SpecializationPanel.tsx:191-201`). The grid closes, focus stays on the toggle, and the live region announces "Thighs: 12 distinct bouts touched your right thigh". Tapping the current region, the toggle, or Escape closes it.
- `SpecializationPage` is keyed by region, so sheets, findings and open disclosures never carry over (P `SpecializationPanel.tsx:84,87`).
- **First open:** the address; else the last region this account opened on this device (`scopedKey("sports-genome-specialization-region-v1")`, every read and write in try/catch); else the forearm with the grid open once (P `Home.tsx:560, 1244-1245`). Entry points must name a region (the type stops being optional, P `Home.tsx:1269-1272`).
- **Data loads per region**: `loadRegionData(id)` imports the region's content and drawing, and the content (not the drawings) of its external members' home regions. The page shows a loading line, never zeros, while it loads. `regionIndex.ts` stays light and lists all nine (P `registry.ts:8`, `SpecializationPanel.tsx:79`). Gate: the forearm page's download stays within 10 % of 361,507 B raw; each region's is measured and reported.

**First screen, measured.** Headless Chromium emulating an iPhone (viewport, `isMobile`, `hasTouch`, device scale 3), production build, the forearm seeded as `docs/specialization-atlas/evidence/page-final-2026-10-17/capture.mjs` seeds it, FCU selected, the chosen row mocked in the DOM (`arch-phone/candidate2.mjs`). Pixels of the drawing on the first screen (dock top minus drawing top); in every "chosen" cell the selected-muscle strip is whole above the dock. Not an iPhone, not Safari.

| State | 375 × 667 today | 375 chosen | 390 × 844 today | 390 chosen | 430 × 932 today | 430 chosen |
|---|---|---|---|---|---|---|
| FCU | 73 | 52 | 233 | 213 | 319 | 301 |
| FCU, a target | 48 | 27 | 208 | 188 | 294 | 276 |
| FCU, Custom dates | 25 | 27 | 183 | 186 | 269 | 274 |
| FCU, Custom, a target | 0 | 2 | 158 | 161 | 244 | 249 |
| FCU, Back | 29 | 52 | 189 | 213 | 275 | 301 |
| FCU, Back, a target | 4 | 27 | 164 | 188 | 250 | 276 |
| FCU, Back, Custom, a target | −44 (strip cut) | 2 | 114 | 161 | 200 | 249 |

The toggle costs 21 px over today's 23 px heading; folding Back in saves 23–24 px when Back shows; inline date labels save 23 px with Custom dates. The draft's row (a separate "Regions" button, stacked dates) measured −21 at 375 with Custom and a target, turning a passing state into a failing one (`critic-phone/checks.json`); the chosen row passes every state at 375, 390 and 430. At 320 × 568 the drawing is below the first screen today in every state and stays so; 320 is held to no horizontal overflow only, as 09-page.md does. Two things remain for lane 0d's first checkpoint, re-measured in the real build at 375, 390 and 320: the inline date fields show the whole date (in Chromium's en-US format the year is cut by a few pixels at 375: `arch-phone/candidate2-375-back-custom-target.png`; iOS formats dates differently, and only an iPhone shows it; the remedy is the label column's width and the input's padding, not a smaller font), and the toggle's border meets the on-dark control contrast token. If the inline dates cannot show the full date, they stay stacked and "Custom, a target" at 375 joins Back-with-Custom as the documented state that needs a small scroll (−21 px); that is a recorded deviation, not a silent one. Each later wave re-measures its new regions' first screens with the same script.

### 6.2 Entries, search and wording

- **Tab title:** `workspaceTitles.specialization` becomes "Specialize"; the document title and the search-return label read the shown region's heading (P `Home.tsx:261, 2160, 2237`).
- **Search:** one destination per production region from `regionIndex` (id `specialization#<regionId>`, label its heading, context "Body Lab · Specialize", terms from its label, keys and muscle names), plus one generic "Specialize" (P `universalSearch.ts:204-206`). Home validates `<regionId>` and opens that region with no Back, as search does today (P `Home.tsx:2119-2123`).
- **Muscles map and Review** need data only: each region's `bodyMapKeys` and `entryLabel`, with the key-uniqueness test (P `Home.tsx:1282-1288, 2479, 2521`; `WeekReviewBoard.tsx:31-34`).
- **An external muscle's sheet** offers "Open the upper-arms page" (its home's label) when its home is in production, as a `withRegion` change; it carries no Targets editor (§2.2).
- **Side words** come from `sideWordsFor(region)` and `wording.onSide` (§1.1, §2.2), with the template test of §1.1.
- **Every region word is data.** The region-word scan builds its pattern from the registry (region ids and labels, node names, short names and aliases of 4 characters or more, view labels, label texts, wording) plus `\barms?\b|\blegs?\b`, so no component can hard-code "chest", "quad" or "arm" again (M `regionAgnostic.test.ts:112, 115-125`).

### 6.3 Measures on the page

Progress offers the region's `measurementMetrics` (§4.4) with its defaults; a girth has no side control and no side filter; the empty state covers the back and the core (P `MeasurementsPanel.tsx:433`). Performance series accept side `midline` (P `progressSeries.ts:191,236,269-271,369`).

### 6.4 The logger

- **One generated logging table** replaces the logger's import of every region's variants and mappings (P `loggingRegions.ts:52`, `loggingPolicy.ts:49-59,76,86`): `scripts/specialization/emit-logging-table.ts` writes `shared/specialization/loggingTable.generated.ts`, per catalog id: measure, `laterality`, `leg_laterality`, `sided_by`, `side_anchor`, whether a production region paired by the `sided_by` limb maps it, the regions that map it with any straps-sensitive mapping, and the regions that map it at all. It also writes the hold list the first screens import (`holdCatalogIds`). It replaces `regions/forearm/logging.ts`. A drift test keeps both equal to the registry, and the light-import test globs every region (M `loggingRegions.test.ts:58-66, 74-80`).
- **Policy** (`loggingPolicy.ts`, read from the table): `askSide` when the variant is `unilateral` or `either` for its `sided_by` limb and a production region paired by that limb maps it; `sideLimb` from `sided_by`; `oneSide` (laterality `unilateral` for that limb) replaces `oneArm` (alias kept); defaults and alternation unchanged (P `DeviceWorkoutTracker.tsx:136-145, 173-181`). A variant with no `sided_by`, or `none`, asks nothing.
- **Words.** The arm keeps "Arm · Left · Right · Both". A leg question's group label comes from the anchor: "Working leg", "Front leg", "Standing leg", "Top leg", "Bottom leg" ("Front leg · Left · Right · Both"), and the aria label follows ("Front leg for set 2 of Bulgarian Split Squat"); "· each leg", "one leg at a time", "done once with each leg" in the tracker and the swap sheet (P `DeviceWorkoutTracker.tsx:90, 750, 772, 1055, 1140-1141, 1372-1377`; `ExerciseSwapSheet.tsx:121-231`). The set stores the answer in `side` (arm) or `legSide` (leg) (§2.1).
- **Gating per exercise** (P `Home.tsx:569-570, 2307`): the straps question only when the athlete has an active target in a region whose straps-sensitive mappings include the exercise; per-side rows (a planned set as two rows, Right then Left, each with its side preset on the `sided_by` limb) when the variant is `oneSide` and the athlete has an active target in **any** production region that maps the exercise, so planned equals logged-as-built on paired and midline pages alike (§2.1). `loggerGatesFor(goals)` in `client/src/lib/specialization/loggerGates.ts` returns both per catalog id; Home passes it to the tracker. Per-side rows carry their side even where the question is not shown.
- The side question itself stays ungated, as it is for the forearm today, until the owner says otherwise (§11, decision 3).
- Each wave that adds a leg variant screenshots the set card for 173 Bulgarian Split Squat and 217 Copenhagen Plank at 375 and 390.

## 7. The drawing

### 7.1 One generator, a folder per region

- **Shared code** in `design/specialization/shared/`: geometry (today's helpers, plus `clipBy` on any side, `clipToPolygon` for window outcrops, `columnsShape`, `rotate`, `fan`, `edgeAt`, `insetPolygon`, and the per-view helpers `C`, `INSET`, `ghostOf`, `labels`), `buildAsset(config, views)`, `renderModule(config)` with a CLI `emit <region> [--check]`, `check` (reads the viewBox, not 760), `preview` (grid from the canvas), `render-evidence` (a region argument; 375 × 667 and 390 × 844, device scale 3; output under `evidence/<region>/`), `evidence-entry.tsx` (the region from the page), `render-page` (driven by config), and one Playwright resolver (G `asset.mjs:11-34, 60, 73`; `emit.mjs`; `geometry.mjs:168-214`; `check.mjs:76`; `preview.mjs`; `render-evidence.mjs`; `render-page.mjs`).
- **Per region**, `design/specialization/<region>/`: `config.mjs` (region id, `ASSET_KEY` `<region>_schematic`, version 1, canvas width **360** and its own height, crops, view order with labels of 10 characters or fewer, side policy, licence note, structure words), `silhouettes.mjs`, `views/*.mjs`, `evidence.mjs` (selected muscle per layer, captions, the page's seed, the muscle to tap, view and side button words). Output: `shared/specialization/regions/<region>/diagram.generated.ts`, exporting `<region>Diagram` and `<region>DiagramOutcrops`.
- **The path-name table is derived** from the region's drawable members by the short names fixed in §1.2, externals included; a duplicate lowercased short name within one drawing fails the build (G `asset.mjs:29-34, 60`).
- **Golden rule of the refactor:** the forearm's `diagram.generated.ts` stays byte-identical; `design/specialization/forearm/emit.mjs` stays as a thin wrapper, its header lines unchanged, so `forearmDiagram.test.ts:10` keeps importing `renderModule`.

### 7.2 Views and layers

Width 360 everywhere, so labels, pills and tap squares stay the size they are on the forearm (G `SpecializationDiagram.tsx:47, 54, 282-283`). Layer ids stay surface, intermediate (Middle) and deep. A view draws a layer only when a node of that layer is drawn in it. "One side" drawings show the subject's right and are mirrored for the left; the core's is drawn whole. The plan below is generated from §1.2 (each node's layer and the views its visibility names) by the integration lane at the wave's start and checked by the contract tests; each region's diagram note gives a written reason for every view.

| Region | Canvas | Views (button words) and layers | Side policy | Watch |
|---|---|---|---|---|
| shoulders | 360 × 560 | Front: surface, deep · Side: surface · Back: surface, deep | one side | infraspinatus and teres minor drawn whole on Back-deep, outcrops on Back-surface; teres minor may be list-only if it cannot hold a 44 px square |
| chest | 360 × 560 | Front: surface, deep · Side: surface | one side (half torso, midline at the canvas edge) | serratus digitations as one belly |
| back | 360 × 760 | Back: surface, middle, deep · Side: surface | one side (spine at the canvas edge) | erector outcrop in the lumbar window |
| upper_arm | 360 × 760 | Front: surface, deep · Back: surface, deep | one side; the elbow lines up with the forearm drawing | brachialis outcrop beside the distal biceps on Front-surface; medial-head outcrop on Back-surface |
| core | 360 × 600 | Front: surface, middle, deep | both sides, never mirrored; labels "Your right", "Your left" | rectus abdominis as one node drawn in segments; quadratus lumborum list-only here (drawn on the back) |
| hips | 360 × 640 | Back: surface, middle, deep · Side: surface, middle, deep · Front: surface, deep | one side | gluteus medius whole on middle, outcrop above GMax; crowded front surface: measure tap squares first |
| thigh | 360 × 760 | Front: surface, deep · Back: surface, middle, deep | one side | semimembranosus whole on Back-middle, outcrop beside semitendinosus |
| lower_leg | 360 × 760 | Back: surface, middle, deep · Outer side: surface, middle · Front: surface | one side | soleus whole on middle, outcrops on both surfaces; calcaneal tendon drawn as structure |

Dropped from the draft, each adding no node a kept view lacks: shoulders Side-deep (only the supraspinatus, which Back-deep shows), the core's Side view (it repeated Front's three layers, showed one flank of a drawing that is never mirrored, and added only the quadratus lumborum, which the back draws), the upper arm's Outer side (its brachialis outcrop had no deep layer in that view; the Front shows the same outcrop), and lower-leg Outer side-deep (no node). Added, because a node's own layer must exist where it is drawn whole: thigh Back-middle (semimembranosus), hips Side-middle (gluteus medius), lower-leg Outer side-middle (soleus). 41 view-layers became 38.

Shared tendons and sheets (calcaneal tendon, quadriceps tendon, iliotibial band, thoracolumbar fascia) are drawn as structure (`outline`, no node), and each region's diagram note says so (G `types.ts:290`). A muscle too thin to hold a 44 px exclusive square is drawn as structure or merged where the anatomy allows, and stays reachable from the list (G `SpecializationDiagram.tsx:53`). An external member is drawn where the region's views show it, otherwise it is list-only.

### 7.3 The renderer contract

02-design.md §12 stands, with these additions. `DiagramAsset.sides` is `one_side` or `both_sides`; the page passes `mirrored` only for a `one_side` drawing and the left side (P `SpecializationPanel.tsx:491`; M `types.ts:309-312`; G `SpecializationDiagram.tsx:15-16, 161, 177`). Kinds `muscle` and `head` are drawable, `group` and `compartment` are not (G `forearmDiagram.test.ts:106-115`), and **a node that is any node's parent is neither drawable nor selectable**, whatever its kind (the deltoid, pectoralis major, trapezius and triceps are kind `muscle`; drawn they would overlap their heads, selected they would read "Mapping not reviewed"; P `model.ts:126-127`). An outcrop is a node drawn on a layer above its own, cut from its own-layer outline in the same view (G `forearmDiagram.test.ts:141-197`). Label and tap anchors also try vertical slices (G `diagramGeometry.ts:120-130`). Action glyphs gain scapular glide and elevation kinds with the shared action list (G `ActionGlyph.tsx:10-16`).

Tests: one `diagramContract.test.ts` over every registered asset: manifest, numbering, node ties, kinds, the parent rule, path grammar, one skin first; every drawable target has a belly on its own layer in at least one view; a view holding an outcrop has the outcrop node's own layer; no layer is drawn without a node; no overlap, inside the skin, labels and anchors on canvas, every tendon with a drawn belly, squares non-overlapping and on canvas, cover bounds per region; plus each region's orientation and landmark test; and a Chromium gate: every layer's smallest exclusive square at least 44 px at both 375 and 390 (G `render-evidence.mjs:84`, `hit-targets.json`: the forearm's 47 px at 390 is about 44.5 at 375).

## 8. Content recipe and evidence standard

**Per region, in this order** (the forearm's recipe):
1. Ids and short names (fixed by §1.2) and the region record.
2. Anatomy, checkpoint 1: `nodes.ts` (layer, visibility, short name) and `nodeActions.ts`, merged before the drawing and mapping lanes start. Then each node's aliases, location, what it does, shape note, caveats, `databaseMuscle`; members and their caveats; claims (function, appearance, selectivity, variation) with sources, locators, qualifications, review date and note; sources in the shared library.
3. Variants: the wave's new records and counting attributes, checkpoint 1 before mapping review (§3).
4. Mappings, by exercise family: one per variant and muscle, with action, relationship, mode, basis, allocation, side relation, rationale, status and sources with locator and limitation; drafts with their reason; tagged rows left unmapped with theirs (`unmappedTagged`); the version's `methodNotes`.
5. The drawing, its tests and its note.
6. Notes: `docs/specialization-atlas/regions/<region>/{anatomy-evidence,mappings,diagram}.md`.

**Evidence standard, for every region** (03-anatomy-evidence.md; 05-mappings.md):
- Search order: NCBI Bookshelf (StatPearls), peer-reviewed papers, university anatomy pages, Kenhub, Elsevier Complete Anatomy, Radiopaedia, IMAIOS; Wikipedia read, never cited.
- Each source's note says what the search result showed and what could not be confirmed. Every citation has a locator; limits (abstract only, acute EMG, pilot study) go in the qualification or limitation.
- A claim is reviewed only if the excerpts support every sentence; otherwise the content is left out. Appearance claims are always anatomical inference. Selectivity claims are EMG or clinical findings, never growth and never a credit weight. Function claims rest on two sources where possible, and a single-source one is named in the region's note. A node is reviewed only when all its function claims are.
- A mapping is reviewed only with a rationale, a source with a locator and a limitation, and a basis of anatomy, inference or EMG; otherwise it stays draft with its reason.
- Copy: anatomical directions (inner and outer, front and back, toward the hip or the knee), never screen left or right; on the unmirrored core drawing, "your left" and "your right". No growth promise, no vendor name, no "table" (G `forearmAnatomy.test.ts:266-289`). Each region's anatomy test checks its own direction words; the shared checks are common.
- **The limits are the forearm's, re-checked on 19 Oct:** page fetches are refused (proxy CONNECT 403 for ncbi, pmc, kenhub, ttuhscep, radiopaedia and elsevier; WebFetch ENOTFOUND), and web search returns model-written summaries, which can misquote (G `03-anatomy-evidence.md:9-26`).

**Said plainly, on every region's "How this is counted" and in its notes:**
> "Reviewed" means an automated agent checked each sentence against web-search excerpts and generated summaries of the cited sources on the date shown. It was not checked against the full texts, and not by a clinician or anatomist. A second automated review, with the same tools and limits, looked for errors; it is not peer review. The drawings are original schematics checked against these notes, not reviewed by an anatomist.

And, from each version's `methodNotes` (a content test requires them):
> A reviewed mapping says the muscle does that joint action in that exercise, from anatomy references and, where cited, muscle-activity studies. It does not say how much the exercise loads the muscle. "Incidental bracing", "balance" and "steadying" credit means the muscle holds a position while other muscles move the load; it is counted apart and never as direct work.

**What is not counted is shown.** Completeness gains `boutsListedUnmapped` and its rows: the sets in the window whose exercise tags the region (as a secondary muscle outside the region's tag scope, or as a listed unmapped row) and is not counted here. "How this is counted" opens the list: "9 sets tag the core as a secondary muscle and are not counted here", each exercise with its listed reason (M `exposure.ts:152-155`; P `SpecializationPanel.tsx:552`). An athlete who squats and deadlifts every week is never told only "No exercise logged in this window loads a mapped muscle of the core" without that list beside it.

Publishing freezes reviewed claims, mapped muscles and the attributes a version rests on, so a human or full-text review is worth having before each region's version is published, not after (§11, decision 4).

## 9. Work plan

### 9.1 Waves

Ordered by external dependency: a region ships in the same release as, or after, every home region its externals name (the registry test of §1.2 enforces it). Counts are (catalog row, region) decisions the coverage test demands (a mapping or a listed reason) and estimated mapping rows, from `critic-phone/size.ts`; the forearm was 137 decisions and 418 rows.

| Wave | Content | Decisions | Mapping rows (est.) | New variants | Visible to athletes | Production |
|---|---|---|---|---|---|---|
| 0 Platform | §1.3–§7 with the forearm the only production region; the upper arm still reference; the variants library with the forearm's 119 and their `sided_by` | — | — | 0 | Back in the heading row with a short name; date labels inline; "your right forearm" sentences; no targets offered on external or adjacent muscles (existing ones read-only, said last in Coverage to review as ones to end or remove, and "cannot be counted yet" where no exercise is mapped); the strapped finding in the published rule's words; How this is counted adds the statement about automated review and the drawings, and the sets of 296–298 (sled push, drag, sprint) it lists as not counted, with their reasons; search adds Specialize, and Forearm specialization's context reads "Body Lab · Specialize"; Progress's date and time in two equal columns; numbers unchanged (golden test). The full list: 09-page.md, "What wave 0 changes on the forearm page" | schema v2, seed v2 (memberships, dimensions, attributes; rule stays v1) |
| A Upper arm | upper_arm (promotion) | 194 | 258–444 | 121 | The picker (two regions); the upper-arm page; the forearm's biceps and brachialis credited by the upper arm, their targets moved there; rule v2 | seed v3 |
| B Shoulders, chest, back | shoulders, chest, back (they list one another's muscles, so none can ship first) | 429 | 756–984 | 59 | Three pages; side relations; rule v3 | seed v4 |
| C Core | core (lists the back's quadratus lumborum) | 237 | 267–343 | 93 | The midline page; holds in seconds if the owner agrees; rule v4 | seed v5 |
| D Lower leg | lower_leg (no externals) | 73 | 93–145 | 19 | The leg question in the logger; the first leg page; rule v5 | seed v6 |
| E Hips and thigh | hips, thigh (they list each other; the thigh lists the gastrocnemius) | 292 | 609–951 | 5 | Two leg pages; the Copenhagen plank in seconds if the owner agrees | seed v7 |

Each new machine is proved on one region alone first: membership, the promotion, claim ownership and home-region credit on the upper arm (194 decisions); midline on the core (237, most of them listed secondary-tag rows); the leg limb, `legSide`, side anchors and the leg question on the lower leg (73). Wave B is the largest release and carries no new machine except side relations; it ships as one release because its three regions' drawings and memberships name one another's muscles, and shipping one without the others would mean a drawing redrawn as asset version 2 in the next release. Every wave can ship without the next.

### 9.2 Lanes and the files each owns

**Wave 0.** Order: the prologue alone first; then 0a; then 0b, 0c, 0e and 0f in parallel, and 0d once 0a's types are merged; 0d's Home hunk that wires `loggerGatesFor` lands after 0c's API is merged.

| Lane | Files |
|---|---|
| P Prologue | the history test pinning both applied files (`server/specializationHistory.test.ts`), `CURRENT_SEED_MIGRATION_PATH` in `scripts/specialization/emit-seed.ts`, the drift guard's message in `server/specializationSeed.test.ts` (§5.2) |
| 0a Model | `shared/specialization/{types,ids,registry,regionIndex}.ts`, new `shared/specialization/{actions,sources,variants}/`, `shared/specialization/compose.ts` (membership, claims with owners, node actions, externals), `shared/specialization/regions/forearm/*` except `logging.ts` (moved records), `shared/specialization/regions/upper_arm/*` (reference region: the two nodes and four claims), the deltoid fixture, `client/src/lib/specialization/regionContent.test.ts` (generic content tests over every region, the registry tests of §1.2), forearm content tests |
| 0b Calculator | `shared/specialization/{exposure,goals,rules}.ts`; `client/src/lib/specialization/{bouts,planBouts,recommendations,stores,progressSeries,useSpecializationSummary,planChange}.ts` and their tests; `regionAgnostic.test.ts`, `brief11.test.ts`, the golden test, the side-scenario and goal-equals-row tests |
| 0c Logger | `client/src/lib/deviceWorkoutLog.ts`, `setEntryFields.ts`, `client/src/lib/workoutSwap.ts`, `client/src/lib/specialization/revision.ts`, `client/src/components/DeviceWorkoutTracker.tsx`, `ExerciseSwapSheet.tsx`, `scripts/specialization/emit-logging-table.ts`, `shared/specialization/{loggingPolicy,loggingTable.generated,holdCatalogIds,loggingRegions}.ts`, `shared/specialization/regions/forearm/logging.ts` (replaced), `client/src/lib/specialization/loggerGates.ts` (exports `loggerGatesFor`), logger tests and the old-reader round trips |
| 0d Page | `client/src/components/specialization/*` except `SpecializationDiagram.tsx`, `diagramGeometry.ts`, `specialization-diagram.css` and `ActionGlyph.tsx`; `client/src/lib/specialization/viewState.ts` (`withRegion`, region memory, limb); `client/src/pages/Home.tsx` (including the hunk wiring 0c's `loggerGatesFor`, and `workspaceShortTitles`); `client/src/lib/universalSearch.ts`; `client/src/components/weekReview/WeekReviewBoard.tsx`; `client/src/lib/specialization/loadRegion.ts`; page, Home and template tests; the phone measurements of §6.1 |
| 0e Database | `supabase/migrations/20261019120000_…_schema_v2.sql`, `…_seed_v2.sql` (generated), `scripts/specialization/emit-seed.ts` (after P), `scripts/specialization/release/{make-apply-sql.mjs,schema_v2_undo.sql}`, `server/fixtures/specializationPg.ts`, `server/specialization*.test.ts`, `docs/specialization-atlas/04-database.md` |
| 0f Drawing platform | `design/specialization/shared/**`, `design/specialization/forearm/**`, `client/src/components/specialization/{SpecializationDiagram.tsx,diagramGeometry.ts,specialization-diagram.css,ActionGlyph.tsx}`, `diagramContract.test.ts`, `forearmDiagram.test.ts`, `SpecializationDiagram.render.test.ts`, `docs/specialization-atlas/08-diagram.md` |
| Integration | this note, `README.md`, `02-design.md` cross-references, screenshots, the release |

**Waves A–E**, per region, with disjoint files, plus one variants lane and one integration lane per wave:

| Lane | Files | Starts |
|---|---|---|
| Integration | `shared/specialization/regions/<r>/{ids,index}.ts` (ids and short names written at the wave's start from §1.2), the generated view/layer plan (§7.2), `registry.ts`, `regionIndex.ts`, the generated logging table and seed, de-duplication of sources two lanes both added (moved to `sources/shared.ts`), `README.md`, the release | first |
| Variants | `shared/specialization/variants/**` (the wave's new records; the attributes the wave's regions read; both-limb `sided_by` decisions), catalog fixes in `client/src/lib/exerciseCatalog*.ts`, `variants.test.ts`, `docs/specialization-atlas/regions/variants.md`; takes every missing-variant request | with integration; checkpoint 1 (records and counting attributes) before mapping review |
| Anatomy `<r>` | `shared/specialization/regions/<r>/{region,nodes,members,nodeActions,claims}.ts`, `shared/specialization/sources/<r>.ts`, `shared/specialization/actions/<r>.ts` (new actions only), `client/src/lib/specialization/<r>Anatomy.test.ts`, `docs/specialization-atlas/regions/<r>/anatomy-evidence.md` | first; checkpoint 1 = `nodes.ts` and `nodeActions.ts` |
| Mappings `<r>`/`<family>` | `shared/specialization/regions/<r>/mappings/<family>.ts` and `sources/<r>-<family>.ts`, one lane per family (presses and pushes; pulls and rows; squats, hinges and lunges; isolation; carries and holds), each about 250 rows or fewer; plus one lane for `regions/<r>/{mappingSources,unmapped,methodNotes}.ts`, `client/src/lib/specialization/<r>Mappings.test.ts`, `docs/specialization-atlas/regions/<r>/mappings.md` | after anatomy checkpoint 1 |
| Drawing `<r>` | `design/specialization/<r>/**`, `shared/specialization/regions/<r>/diagram.generated.ts`, `client/src/lib/specialization/<r>Diagram.test.ts`, `docs/specialization-atlas/regions/<r>/diagram.md`, `docs/specialization-atlas/evidence/<r>/**` | after anatomy checkpoint 1 |

The upper arm's anatomy lane also owns `shared/specialization/regions/upper_arm/*`, including the two moved nodes' neutral text and the forearm membership caveats.

### 9.3 Adversarial review

A separate agent, given the diff, this note and the evidence standard, reviews each lane before it merges. Budget: one fix round per anatomy lane and per mapping family (each review about 250 rows or fewer), **two per drawing lane** (the forearm drawing needed two), one for the variants lane, plus the wave review and its fix round.
- **Anatomy:** re-search a sample of claims independently; every sentence against its excerpt; single-source function claims named; direction words; appearance claims inference only; nothing promises growth; layers and short names against §1.2.
- **Variants:** counting attributes present and explicit; both-limb `sided_by` decisions and their reasons; anchors against the exercise definition; `not_applicable` used honestly; catalog fixes listed.
- **Mappings:** exercise families against the catalog's definitions and photos; relationship against mode; shared allocation where work cannot be split; no fan-out; the coverage test; side relations against the anchor; method notes.
- **Drawing:** orientation against the labels; layers against the nodes; outcrops cut from the own-layer outline; ends at the same height across views; landmarks over bone; the 44 px squares at 375 and 390; the left/right (or whole) screenshots looked at.
- **Platform:** the database (every refusal, the no-op, RLS and grants, the undo), the calculator (golden forearm equivalence, the side scenarios and goal-equals-row of §2.1), the page and logger (phone screenshots, §6.1's table re-measured).
- **Wave review**: the whole diff, the release gates, the golden test's allowed differences, and screenshots at 390 × 844 and 375 × 667 (also 430 × 932 and 320 for the picker), taken in headless Chromium emulating an iPhone (viewport, `isMobile`, `hasTouch`, device scale 3) as `scripts/perf/measure-client.cjs` does, reported as emulation, not as an iPhone or Safari: the heading row with and without Back, the grid as it is at that wave (production regions only) at 375, 390 and 430, each new region's first screen and selected muscle, a leg page's switch, the core page with no side control and its Targets and Progress, the set cards for 173 and 217, the 44 px touch sweep, no horizontal overflow at 320.

### 9.4 How each wave ships

The production apply is the point of no return: once production records seed vN, vN is history and its published versions, reviewed claims, mapped muscles and attributes are frozen. So it comes last, from the exact commit that is merged.

1. Every lane merged into the wave branch; full suite (`npx vitest run`), `npx tsc --noEmit -p .`, the seed's, the drawings' and the logging table's `--check`, all clean.
2. The wave review and its fix round finished; nothing open.
3. `main` merged into the wave branch; no specialization change merges to `main` from here until step 6 (branch protection "require branches to be up to date"); pull request, CI "Typecheck, test and build" green on that head SHA, the Vercel preview built.
4. Production apply from that exact SHA (§5.3): read-only checks, the wave's files one per `execute_sql` call, read-only verification. The app does not read the database, so a failed apply blocks the merge but breaks nothing; a failed apply is fixed by a new commit and steps 1–4 again. Only a failure at the wave's first file leaves nothing recorded. A file production has recorded is history at once, even when a later file of the wave then fails: the fix commit pins it in the history test, never edits it, and puts any correction in a new file; the later file's apply refuses a commit whose earlier files differ from the text production recorded.
5. Squash merge with no further commits on the branch; the history test's pin list gains the applied files in the next commit to `main`. Any change found after step 4 goes into the next seed file, never into vN.
6. The production deploy READY; `/api/health` reports the merge commit; `/?workspace=specialization&region=<id>` serves the page for each new region.
7. The report (README's release section and the regions' notes), with counts read from the code, as the forearm's was (#97), and the golden test's allowed differences.

Rolling back the app: to the previous wave's deploy only (every deploy from wave 0 on keeps fields and entries it does not understand, §2.1). The database is never rolled back after seed v3 (§5.4).

## 10. What does not change

- Every forearm id, the forearm's 24 nodes, 20 actions, 38 node actions, 60 claims, 71 source keys, 119 variants and 418 mappings, and their meaning; its drawing, byte for byte.
- `upper_arm.biceps` and `upper_arm.brachialis`: ids, region, catalog key and `nodes.role = 'external'`; the four `forearm:` claims on them, keys included.
- Schema v1 and seed v1, byte for byte, pinned by SHA-256 before any other change.
- Stored workout records, plans and measurements on the device: no history migration. Sets keep `side` as the arm's side. The one stored change is a legacy target on an external muscle, re-homed (same id) on its next save once its home is in production (§2.2).
- The counting categories, intervals, the no-ledger decision and the device-first architecture (01-reconciliation.md).

## 11. Owner decisions

Each with the recommendation the plan follows unless the owner says otherwise.

1. **Core sides.** Recommended: **midline**, every core muscle counted once with no left or right. The alternative, a paired trunk, would need the direction of every rotation logged (rotating right uses the left external oblique and the right internal oblique), which the logger does not record; per-side oblique credit would rest on assumptions.
2. **Core and hip holds in seconds.** 217 Copenhagen Plank, 235 L-Sit, 245 Hollow-Body Hold, 246 RKC Plank, 247 Side Plank and 248 Weighted Plank are logged in reps today. Recommended: **measure them in seconds** from the release that maps them (C for the core holds, E for the Copenhagen plank). The Plan and the tracker then show Seconds for every athlete; sets already logged in reps stay reps and read "time not recorded" (README, Limitations).
3. **The side question everywhere.** With nine regions the logger asks Arm or a leg on every one-sided exercise a production region maps, as it does for the forearm's today. Recommended: **keep asking, ungated**: one tap, and a side not recorded can never be recovered. The alternative asks only athletes with an active target.
4. **Review before publishing.** Recommended: **publish each wave after the automated review and the second automated review**, said plainly (§8), as the forearm was, with a human anatomy review of each region welcome at any time; a correction then becomes a new claim and a new mapping version. The alternative is to hold each region's publication until a clinician or anatomist has reviewed it, since publishing freezes it.
5. **Feet.** Recommended: **out of scope**, like the hand for the forearm; the `feet` key opens no page.
6. **Catalog tag fixes** the variants lanes find (249 Pallof Press tagged primary chest, and any others): recommended **fix them**, listed in each pull request. They change what Review and the Muscles map show for those exercises.
7. **The `http` extension.** If the owner has removed it since 18 Oct, the apply re-creates it (and cannot drop it again). Recommended: **allow it**, and remove it in the dashboard after the last wave.
8. **Measures.** Recommended: **girth for shoulders, chest and hips; limb circumference for upper arms, thighs and calves; none for back and core; no waist** (§4.4).
9. **Single-leg RDL (188, 264): which limb the logger asks, and from when.** Recommended: **the standing leg, from the first release that publishes a new version mapping them** (wave B if the back maps their erectors, at the latest wave E). The leg decides the hamstring and glute credit; the choice cannot wait for the leg pages, because `sided_by` freezes at that first publish (§3). From then the forearm reads those sets' grip as "no arm recorded", and the leg sides recorded before the leg pages ship are already there when they do. The alternative keeps asking Arm for good, and the hips and thigh read those sets as "no leg recorded".
10. **Release plan.** Recommended: **six releases in dependency order**: platform; upper arm; shoulders, chest and back; core; lower leg; hips and thigh (§9.1), each one region's worth of new machinery, reviewed with stated counts. The alternative, four larger releases (arms and chest together, trunk, legs), cannot be built as drafted (the shoulders name back muscles that would not exist yet) and puts more than twice the forearm's review load in each.
11. **Changes to the shipped forearm page**, each stated in its release. Recommended: **accept all three**. (a) Wave 0: Back moves into the heading row with a short name, the date labels go inline, sentences read "touched your right forearm", and targets are no longer offered on the biceps, brachialis or anconeus (existing ones stay, read-only, and can be ended; Coverage to review names them last as targets saved earlier, never as targets behind); the strapped finding takes the published rule's words; How this is counted says what "reviewed" means and lists the sets of 296–298 it does not count; search adds Specialize; numbers do not change. Every line that changes is in 09-page.md's list, which `pageText.render.test.ts` holds sheet by sheet against 3986178. (b) Wave A: the biceps and brachialis are credited by the upper arm's mappings and their targets move to the upper-arm page. (c) From wave A on, as each release adds a two-handed variant for a forearm-tagged exercise the forearm does not map (190 Good Morning, for one), that exercise's region-only sets count on both arms instead of "no arm recorded"; the golden test prints the list. The alternative for (c) takes structural sides of region-only sets only from variants the forearm's own version maps, which keeps today's numbers and keeps reading a two-handed lift as "no arm recorded".

## Appendix: Critique resolution

Every issue the three critics raised, with the verdict and what changed. Experiments were re-run before deciding: c5, c7, c8 and c10 (counting) and `critic-db-exp.ts` (database) reproduce as reported; the phone critic's numbers were re-measured for the chosen design (`arch-phone/`).

### Counting and data model

| # | Issue | Verdict | What was done |
|---|---|---|---|
| C1 (high) | §4.2: an external credited by its home vs "external-only is region-only work" cannot both hold; at wave A forearm completeness moves (c5: Dumbbell Pullover leaves region-only) | Accepted | §4.2: classification by own members only; region-only bouts also credit their external effects; new external-only class outside totals and completeness; `boutsWithReviewedMapping` counts own effects. Tests: external row equals its home's; forearm totals, region-only and completeness at A equal wave 0's (including c3's rows). Checked: no forearm variant is mapped only to externals, so wave 0 is unaffected. |
| C2 (high) | Planned one-sided set is one bilateral bout; midline pages count half of logged (c8) | Accepted, extended | §2.1: `planBouts` splits sets of variants `unilateral` for their `sided_by` limb into `…/n#right` and `…/n#left`; `either` stays one bout. §6.4: per-side tracker rows when the athlete has a target in *any* production region mapping the exercise, so logged-as-built equals planned on midline pages too (the draft's "region paired by that limb" gate would have broken the equality). Planned-equals-logged test for 409, 46, 173, 247; golden test allows only planned bout ids to differ. |
| C3 (high) | Goal progress still filters by `onArm`; diverges from rows under per-mapping sides | Accepted | §2.2: goal progress from the same per-node, per-side contributions; `onArm` removed; goal-equals-row test over every §2.1 scenario, paired and midline, completed and planned. |
| C4 (medium) | A bout can be on a side for one own node and unknown for another, counted twice; ledger prints the recorded side | Accepted | §2.1: unknown-side set only when no own node is credited on this side; `countedSide`, `recordedSide`, relation on contributions; ledger labels by `countedSide` with a note. §1.2: registry test that an external's home is paired by the same limb unless the listing page is midline. |
| C5 (medium) | Rule 12 in `mapping_version_problems` flags forearm v1, contradicting §5.3 and `specializationSchema.test.ts:880-883` | Accepted (DB critic's tested form) | §5.1: rules 11 and 12 are publish-time, evaluated only while the version is a draft (critic experiment 1b: v1 null; a draft mapping the biceps refused). Refusal tests added. Same outcome as the proposed guard-only check, with one function to read. |
| C6 (medium) | Device goals already on external/adjacent nodes: unsyncable, duplicable at wave A, silently re-read (c7) | Accepted; exclusion change accepted in effect | §2.2: from wave 0 no Targets editor on non-target members; external goals re-homed on read (same id) once the home is production, stated in the release; adjacent goals read-only, endable; `sameGoalTarget` ignores `regionId` for muscle goals; side words in `validateGoal`; tests with the stored goals. No new DB exclusion: §5.1's trigger makes a muscle goal name a listed target of its region, which fixes the region to the node's home, so the existing exclusion is keyed by node already. |
| C7 (medium) | No honest `laterality` for hands-free exercises; `sidedBy` default gives 170 the arm; both-limb cases default to arm | Accepted | §3: `not_applicable` added to `laterality` (TS and DB check) and `leg_laterality`; no run-time `sided_by` default; explicit `sided_by` required, decided once for both-limb variants, emitter refuses without; §2.1 rule 5 and DB rule 11: a `not_applicable` limb gives no side and such mappings must be `both`; limb tests with listed both-limb exceptions. |
| C8 (medium) | A side without `sideLimb` read as arm: any field-dropping path turns a leg side into an arm side; stores delete unknown entries | Accepted | §2.1: `legSide` in its own field, `side` stays the arm; wave 0 makes `normalizeSet` keep unknown fields and both stores keep unparseable entries; `legSide` in `SET_FIELDS` and the swap copy; round-trip tests through wave-0 and 18 Oct readers; §9.4 limits app rollback to the previous wave's deploy. |
| C9 (medium) | Wave 1 library changes forearm sides (c10); "visible: nothing" false; golden test only at wave 0 | Accepted; chose "state the change" | §4.3: golden test at every release with an explicit allowed-differences list printed in the release; §11 decision 11(c) puts the choice to the owner with the recommendation to count two-handed region-only sets on both arms (a fact about the exercise) and the alternative described. The separate "wave 1" is gone: variants ship per wave (P8). |
| C10 (low) | `sharedWithOf` groups across versions | Accepted | §4.2: shared partners only within one `versionKey`; two-version fixture test. |
| C11 (low) | `.v2` replacement key never read by a global resolver; breaks other regions' rows | Accepted | §3: one current variant per catalog id behind `replaces`; a replacement ships new versions for every region mapping the old key in the same release; test that every current version maps the resolver's ids. |
| C12 (low) | `legLaterality`/`sidedBy` as attributes plus a default let later additions change a published version's counting | Accepted, in the form of D1 | §3: counting attributes explicit, no default; required at publish by rule 11 (so absence is never what a new version rests on) and frozen at publish via `frozen_at`; forearm v1's `sided_by` values pinned by a content test with 188 and 264 the only listed exceptions. |
| C13 (low) | Shoulders' back externals at wave A cannot exist | Accepted | §9.1: waves reordered by external dependency; shoulders, chest and back ship together (B); registry test that every member's home is production or reference in the same release. |

### Database and release

| # | Issue | Verdict | What was done |
|---|---|---|---|
| D1 (high) | Attribute guard freezes any attribute on a variant forearm v1 maps the moment it is inserted (critic experiment 2: cat-205) | Accepted | §5.1: `variant_attributes.frozen_at`, stamped by `guard_mapping_version` at publish for the attributes then present; the guard refuses change only where frozen; not in the seed's upsert columns. §5.2: attributes emitted before the versions section. §3: each wave writes only the attributes its regions read; leg-only attributes in the leg waves. |
| D2 (high) | Wave A (shoulders) names back nodes and a back region that do not exist (FK failure, experiment 4) | Accepted, by reordering | §9.1: shoulders, chest and back in one release (B). The critic's alternative (add the memberships a wave later) was rejected because the shoulder drawing draws its externals (as the forearm's draws the biceps and brachialis, `asset.mjs:33`) and would need asset version 2. Registry test added. |
| D3 (medium) | Rule 12 makes §5.3's verification fail | Accepted | As C5, the tested form; §5.3 expects null for every published version and says why. |
| D4 (medium) | Nothing pins the applied seed v1 before lane 0a changes the emitter's output; the drift guard's advice rewrites history | Accepted, one part rejected | §5.2, §9.2: prologue commit P pins both SHA-256s, points `CURRENT_SEED_MIGRATION_PATH` at seed v2 and names the file in the drift guard's message, before any lane. Rejected: rewriting the "regenerate the seed" notes; they name the command, which then writes the current file, and `emit.mjs:28` generates the header of the forearm's `diagram.generated.ts`, which must stay byte-identical. |
| D5 (medium) | The apply is not ordered after the review and after main is merged | Accepted | §9.4 rewritten: review and fix round finished, main merged and CI green on that SHA with no specialization merges in between, apply from that SHA, squash merge with no further commits; later changes go to the next seed. |
| D6 (medium) | Goals FK to memberships the seed deletes; a delete fails on another user's goal (experiment 3) or cascades | Accepted | §5.1, §5.2: `listed` on `region_nodes` and `region_actions`; the seed never deletes them, it unlists (refused when frozen); the goals trigger accepts only listed rows for new goals; RLS shows unlisted rows so keys resolve. Test with another user's goal. |
| D7 (medium) | Rule v2 published at wave 0 contradicts the wave-0 fallback and freezes unused clauses | Accepted, extended | §4.3: forearm stays on v1 through wave 0; v2 (with the fallback clause) at A, v3 at B, v4 at C, v5 at D, each published when first used, drafts never emitted; test mapping every calculator branch to a published clause. |
| D8 (medium) | No rollback; the emitter's drop-schema line would destroy published history | Accepted | §5.4: forward-only; one tested undo for schema v2 valid before seed v3, deleting its own `schema_migrations` rows; emitter header replaced; rollback test extended. |
| D9 (low) | Moving the four forearm claims would re-key them and the stale delete would fail seed v2 | Accepted | §1.3: required `ownerRegionId`, key from the owner, stale delete per owner, byte-for-byte key test. |
| D10 (low) | Publish does not lock the region row rule 11 reads | Accepted | §5.1: `regions` row `FOR SHARE` first in `guard_mapping_version`; tested by reading the function body, the race itself reasoned (PGlite is a single connection, 04-database.md §8). |

### The athlete on a phone, and the size of the work

| # | Issue | Verdict | What was done |
|---|---|---|---|
| P1 (high) | First-screen claims untested and false: the 44 px row costs 20 px without Back; grid-open guarantee fails; "change the drawing height" cannot work | Accepted; redesigned and measured | §6.1: the heading itself is the toggle (iOS title-menu pattern), Back folded with a ≤9-character name, date labels inline; measured table at 375, 390, 430 (every state passes at 375, including Back with Custom, which fails today); grid-open is a choosing state, measured whole at 320, 375, 390; the drawing-height sentence deleted; the date-field clip and its fallback recorded as lane 0d's first checkpoint. |
| P2 (high) | "Left shoulder · Right shoulder" does not fit at 375; mixed nouns; templates produce "the hips on the right hip" | Accepted | §1.1: switch words from the logger's limb (arm, leg, side), all measured to fit; `wording.onSide` for sentences; template test over nine regions and both sides refusing repeated nouns and mismatched limb words. |
| P3 (high) | "Leg · Left" is ambiguous on split stances, single-leg hinges, side-lying and Copenhagen work | Accepted | §2.1, §3, §6.4: `side_anchor` (working, front, standing, top, bottom leg) per variant, required where a leg region maps a one-sided leg variant; relations stated relative to it; group label from it; set-card screenshots for 173 and 217. |
| P4 (high) | Wave A depends on back (wave B) | Accepted | §9.1: A upper arm alone; B shoulders, chest, back; C core; D lower leg; E hips and thigh. Lower leg split from hips and thigh because it has no externals and proves the leg machinery on 73 decisions. |
| P5 (high) | Work several times the forearm's, less review budgeted, no counts | Accepted | §9.1 counts per wave (1,225 decisions, about 1,983–2,867 rows in all); §9.2 mapping lanes per family, about 250 rows per review; §9.3 two fix rounds per drawing lane; one region per release until the trio, which the externals force together. |
| P6 (medium) | Views and layers contradict §1.2 and the outcrop rule; parents drawable and selectable | Accepted | §1.2: layer defined as the belly's layer; infraspinatus, teres minor deep with outcrops; gluteus medius intermediate; parents' layer "—". §7.2: thigh Back gets middle; upper-arm Outer side dropped (brachialis outcrop on Front); lower-leg Outer side surface and middle; hips Side gets middle. §7.3: parent rule; contract tests (own-layer belly, outcrop view has the own layer, no empty layer). |
| P7 (medium) | Some views add nothing | Accepted | §7.2: shoulders Side-deep, core Side view, lower-leg Outer side-deep dropped (and the upper-arm Outer side, P6); three middle layers added where P6's own-layer rule needs them; 41 view-layers to 38; a written reason per view in each diagram note. |
| P8 (medium) | Variants lane only in wave 1, while attributes freeze before leg review | Accepted | §3, §9.2: a variants lane every wave, owning only the attributes that wave's regions read and every missing-variant request; leg attributes in the leg waves. |
| P9 (medium) | Lane ownership mismatches; short names not fixed | Accepted | §9.2: `loggingPolicy.ts` and `regions/forearm/logging.ts` to 0c; 0c exports `loggerGatesFor`, 0d wires it in Home after 0c merges; `viewState.ts` to 0d; `ActionGlyph.tsx` to 0f. §1.2: every short name fixed; anatomy checkpoint 1 (`nodes.ts`, `nodeActions.ts`) before drawing and mapping lanes. |
| P10 (medium) | Secondary-tagged unmapped rows vanish; what a mapping rests on is not said | Accepted | §8: `boutsListedUnmapped` and its list under "How this is counted"; required `methodNotes` per version with the stated wording, including incidental credit. |
| P11 (low) | Grid contents per wave unspecified | Accepted | §6.1: production regions only, body order, 3 reflowing columns, no disabled cells; §9.3 screenshots the grid at each wave at 375, 390, 430. |
| P12 (low) | "Short origin name" undefined; long names wrap the heading | Accepted, measured | §6.1: `workspaceShortTitles` (≤9 characters); measured one line at 320, 375 and 390 with the longest labels; phone render test; behaviour at 320 stated. |

## Appendix: amendments made while building wave 0 (20 Oct 2026)

What the wave 0 lanes and their reviews changed from the text above. Each was found by a lane or a reviewer, decided in review, and is tested; where this list and a section above disagree, this list holds.

- **§2.1, the order of the side rules.** `nodeSideFor` reads rule 4 (the bout recorded a side of the region's limb) before rule 3 (the limb is structurally bilateral), so a recorded side wins, as the forearm has always counted it (`bouts.ts` before wave 0). The rules are otherwise as written.
- **§5.1, schema v2 gains:**
  - `regions.on_side_template`, the sentence form of §1.1 ("your {side} forearm"), checked with the side model: a paired region's template holds `{side}` exactly once, a midline region's none;
  - `diagram_assets.sides` (`one_side` | `both_sides`; null reads as `one_side`, which is the forearm's);
  - publishing by state alone: `guard_mapping_version` refuses a draft → published change that also changes the version's id, key, region or method notes, since rules 10–12 read the stored draft;
  - goals: a reference region takes no target (the upper arm until its promotion in wave A), and a goal on anything no longer offered may only have its end set, kept or brought forward, never moved later or cleared, as `onlyEnds` in `goals.ts` allows.
- **§5.2, attributes are owned by the seed.** Each seeded variant's attributes are a set the content owns: one the content drops is deleted while unfrozen, and refused (the whole seed with it) once a publish has frozen it.
- **§5.3, the upper arm's rows from wave 0.** Seed v2 already writes the reference upper arm's two memberships (biceps and brachialis as targets) and its five region actions, from `resolveMembers`; they take no goal until the promotion. The forearm row's new columns are written by schema v2 itself, so seed v2 does not touch it; seed v2 changes one existing row, the upper arm's region row, in schema v2's columns only (its side model, limb, words, side sentence, catalog keys, tag scope, external heading and measure default; its schema v1 columns stay as seed v1 wrote them), given `public.exercises` as on 18 Oct: a catalog row `public.exercises` has gained a match for since then changes in `supabase_exercise_id` too, as §5.2 allows (04-database.md §11).
- **§5.1, rule 13.** A publish-time rule beside 11 and 12: the version's region has a page (`production`, or `fixture` in tests). Publishing freezes a region's status, so a version published in a reference region (an `upper_arm_mappings_v1` published by hand to try rule 12, say) would block its promotion for good. Seed v3 writes the promotion before it publishes, so wave A is unaffected.
- **§5.1, only a publish freezes an attribute.** The attribute guard refuses `frozen_at` written by any UPDATE but `guard_mapping_version`'s own (it runs the guard one trigger deep) and an attribute inserted frozen, for every role, the owner included.
- **§5.3, a recorded file is history at once.** The apply of each file refuses unless every earlier specialization migration is recorded with the text the commit holds (the SHA-256 of its recorded statement), so a seed never runs over a schema v2 that the fix commit edited after production recorded it; §9.4 step 4 says so.
- **§5.4, the undo refuses more.** Besides seed v3 and `not_applicable`, it refuses while a version other than `forearm_mappings_v1` is published or retired, while any attribute is frozen, and while a goal names a membership or region action only the seed wrote.
- **§6.1, the page-size gate** counts the page chunk together with the chunks it loads: the logger lane folded the shared `variants` chunk into the page's.
- **§6.1, data loads with the page** (the release review). Home starts the region's data as it renders the page and the page's lazy import waits for it, so the region's chunk downloads beside the page's: loaded from the page's effect, it waited for a first commit React holds back about 300 ms, and opening took that much longer than at 3986178 (09-page.md, "Opening the page"). A region's chunk carries its homes' content only: each region folder keeps its content in `content.ts` (`RegionHomeContent`, no drawing) and its drawing in `index.ts`, and `composeRegionData` takes the homes' content (a test walks the import closure).
- **§2.2, targets no longer offered** are said last in Coverage to review, once per muscle, as targets saved earlier to end or remove, never as targets behind with exercises for them; a muscle target nothing can count (no reviewed mapping) reads "cannot be counted yet", never "0 of your 3".
- **§4.2, what credits a node** is read in one place on the page (`creditedMappingsFor`, exposure.ts): the missing-action line and the add sheet's overlap read it, so an external member is judged by its home's rows once its home publishes. The movement sheet counts a bout as the movement's target does (a bout one own muscle counts on the side is the side's).
- **§9.1 and §11 decision 11(a)** list every visible wave-0 change (the strapped finding's words, the automated-review statement, the 296–298 list, search's Specialize), and §4.3's wave-0 golden differences add `sideRelation` and the 296–298 §8 rows; 09-page.md holds the full list.
- **§6.4, the tracker's gates.** `DeviceWorkoutTracker` takes one `loggerGates` prop (`loggerGatesFor(goals)`) in place of `askStraps` and `perArmSets`; a set field the code does not know is kept through every save.
- **§7.1, the generator's signatures.** `buildAsset(config, views, members)` and `renderModule(config, views, members)` take the members explicitly, read from `regions/<region>/members.ts`, never from the region's page data; every new region's config must set `SIDES`; each drawn region's `evidence/<region>/hit-targets.json` records the SHA-256 of the drawing it measured, and the contract test requires it.

## Appendix: Both sides as one (owner, 20 Oct 2026)

On 20 Oct 2026 the owner decided, for the forearm on `main` (d8d95f4): "there's no reason for a left and right arm". The reconciliation of `main` (4dac1ae: the 3D forearm model, both arms as one, the numbered chip row) into wave 0, on 21 Oct 2026, extends the decision to every region. Where this appendix and anything above disagree, the earlier appendix included, this appendix holds.

**The decision, for every region:**
- A paired region's page reads one summary, side `both`: each set counts once per muscle whichever side or sides did it, and a set with no side recorded counts like any other. A midline region reads `midline`, as before.
- Nothing on the page names a side: no switch, no side in a heading, caption, sentence, announcement or ledger row, no list of sets kept apart for want of a side, no side-difference finding, and the drawing (or the 3D model) is never mirrored.
- Targets and measurements have no side. A target is saved once and a reading is one of one series; the stored record keeps a side field, written `right` on a paired region (as `main` writes it) and `midline` on a midline region or for a girth. A pair saved once per side before reads as one target.
- The logger asks no side of any limb, and a planned one-sided set is one bout and one row per planned set, so the logged week equals the planned week.

**What changes, section by section.**
- **§0 item 4 and §1.1.** The "switch words" column is not read: there is no switch. Nor is "a side in a sentence" (`wording.onSideTemplate`, `regions.on_side_template`), which stays as data. The region's line names the region by its label, as `main`'s forearm page does ("12 distinct bouts touched the thighs."; planned, "… are planned for the thighs"), and a region picked from the heading is announced the same way ("Thighs: 12 distinct bouts touched the thighs."). The page's one sentence about sides is `sideWordsFor(region).countedTogether`, under How this is counted, built from the region's side word and limb: "Both arms count together: a set counts once, whichever arm or arms did it, and a set with no arm recorded counts like any other." (`main`'s sentence, word for word, on the forearm); "Both sides count together: … no arm recorded …" on the chest and back; "Both legs …" on the leg regions; "Each set counts once for the core, which has no left or right." on the core. The 3D model's panel says the same without the last clause (`countedOnce`, `main`'s words there). The template test now refuses any left or right on every region, a limb word that is not the region's, and anything kept apart, besides its earlier rules.
- **§2.1.** The model (side models, `armSide` and `legSide`, side anchors, side relations, `nodeSideFor`, `countedSide`, `recordedSide`) stays in the calculator, dormant for the page and tested: a summary asked for `left` or `right` is still computed as §2.1 says (`golden.test.ts` holds it against 6738eeb), and the page asks for `both`, on which every reading counts (`countsOn`), so nothing is kept apart and the unknown-side buckets stay empty (`golden.both.test.ts` holds the `both` summaries against `main`'s calculator at 4dac1ae). "Planned one-sided work is planned per side" is withdrawn: `planBouts` writes one bout per planned set, `…/n`, recorded `both` by plan assumption, as at 6738eeb, and the tracker never lays a set out per side. The rule branch is `plan.<limb>.one_bout`.
- **§2.2.** No switch, on any region. The address keeps no `limb`; an old address's is dropped, and `withRegion` has no side to carry. Goal progress reads every goal of the region on `both`, an old pair as one; `validateGoal`'s messages name no side, and the Targets editor has no side control on any region (`goalsForBothSides` stays, unused by the page). Measurements: one series per measure, no side control or filter.
- **§6.1, the heading row and its controls.** The rows under the heading hold Completed · Planned and the time window; there is no side switch row. A pick keeps the mode, window, dates, plan week, colouring and the figure (3D model or Drawing). The measured first-screen states (§6.1's table) did not count a side switch row, so they stand; the phone evidence of the reconciliation is in `evidence/reconcile-2026-10-21/`.
- **§6.4, the logger.** The logging table keeps its columns (measure, `laterality`, `legLaterality`, `sidedBy`, `sideAnchor`, `sideCounted`, `strapsBy`, `mappedBy`). The policy asks no side: `askSide` and `oneArm` are always false (kept, as `main` keeps them), `sideLimb` stays for reading rows that hold a side, and `sideDefault` stays as the variant's data; `oneSide`, the policy's `sideAnchor` and `sideQuestionLabel` are gone. The set card's side control and its words ("Arm", "Front leg", "· each leg", "one leg at a time", "done once with each leg") are gone, and so are the rows per side: the gates are straps only (`perSideRows` is gone). Decision 3 (the side question everywhere) is superseded. Rows that a workout left open from before 20 Oct holds per side keep their sides and are logged as stored.
- **§9.1, wave 0's visible changes.** "Sentences read 'your right forearm'" is withdrawn: the forearm page is `main`'s page for both arms, and wave 0's changes to it are the rest of the list (Back in the heading row, the inline dates, no new targets on external or adjacent muscles and those saved earlier said last, the strapped finding in the rule's words, How this is counted's statements and its 296–298 list, search's Specialize, Progress's date and time columns), plus one: the lede no longer says a set counts "once per arm" (`main`'s still did). The numbers are `main`'s (`pageNumbers.render.test.ts` against 4dac1ae), the one difference being a target saved earlier said last, with no number; the words are `main`'s apart from the stated list (`pageText.render.test.ts` against 4dac1ae). 09-page.md has the list.
- **§11.** Decision 3 is superseded (no side is asked). Decision 9 changes nothing the athlete sees while both sides are one: which limb a set records decides no count; `sided_by` stays data, frozen as §3 says. Decision 11(a) loses "sentences read 'touched your right forearm'"; 11(c) is moot on the page, where a set with no arm recorded already counts.

**What stays dormant**, tested and never shown:
- In the calculator: `nodeSideFor` and per-side summaries (`left`, `right`); a bout's `armSide` and `legSide`; a row's `countedSide`, `recordedSide` and `sideRelation`; the unknown-side buckets (`unknownSide`, `regionUnknownSideBouts`, `regionUnknownSideRows`), always empty on `both`.
- Data types the design needs: `BodySide`, `StoredSide` (a stored goal's or measurement's side, as the database's checks allow: left, right, midline), `SummarySide` (adds `both`, which nothing stores), `ArmSide`, the variant's `sidedBy`, `legLaterality` and `sideAnchor`, a mapping's `sideRelation`, a region's `sides` and its side words and sentence (schema v2's columns), `diagram_assets.sides`, a set's `side` and `legSide`, an exercise's `perArm`.
- Libraries: `goalsForBothSides` (and `goalsForBothArms`), the swap's `perArm` option and `perArmRowSides` (for rows already built per side), the drawing renderer's `mirrored` prop and the 3D canvas's mirroring (both `main`'s, always off).
- The published rule v1's `sides` and `regionTotal` sentences speak per arm; the page says `countedTogether` and a side-free region-total sentence in their place, as `main` does. Rule v2 should publish the both-sides wording.

**Removed**, because the decision leaves nothing to use it: the side switch; side words in headings, captions, sentences, announcements and the address; the unknown-side lists and findings and the side-difference finding; the ledger's side labels and notes (`rowSideLabel`, `recordedSideNote`, `rowSideTextFor`); `drawingMirrored`; saving a target for both sides as two; the side controls of the Targets editor and of Progress; the logger's side question (`defaultSideFor`, `chooseSide`, `withSideFrom`, `sideQuestionLabel`, the policy's `oneSide` and `sideAnchor`, the side control's styles) and its rows per side (`perArmRows`, the gates' `perSideRows`); `planBouts`' bouts per side.
