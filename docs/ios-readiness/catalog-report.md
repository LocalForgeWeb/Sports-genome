# Catalog reconciliation report (A06)

Run 2 Nov 2026 against the runtime catalog (`client/src/lib/exerciseCatalog.ts`), the exercise photo index (`client/src/data/exercisePhotos.json`), the logging policy (`shared/specialization/loggingPolicy`) and the production Supabase reference tables (read-only queries). **No exercise was added, renamed or re-identified in this pass.**

## Headline

- **The runtime catalog has 420 exercises, IDs 1–420, contiguous.** Base and expansion are 1–400; the forearm block is 401–420.
- **The approved handoff list was not found.** It is neither in this repository nor in Supabase's governance tables (`agent_work_directives`, `product_features`, `feature_requirements`, searched for Zercher/neck/Spoto). Without it, "requested" below means the names the audit gives, not an approved manifest. **Blocked on the owner supplying that manifest.**
- **Forearm entries 401–420 have no approved reference mapping in production.** `app_exercise_source_mappings` has 400 approved rows, covering local IDs 1–400, and 0 rows for 401–420. So, today:
  - lifts logged on those 20 exercises are never uploaded (they wait as unmappable; `strengthSyncQueue.ts`);
  - they have no cloud-backed reference.

  This is the most concrete gap the audit asked about.
- **23 Supabase exercises are `needs_review` and unmapped.** These include four neck isometrics: Neck Extension Isometric, Neck Flexion Isometric, Neck Lateral Flexion Isometric, and Four-Way Isometric Neck Strengthening. They exist as reference rows, not in the app.

## Matrix

**Columns:**
- *Media*: a photo set in `exercisePhotos.json`.
- *Logging*: the logger's measure (reps or seconds; seconds never produce an estimated max).
- *Reference*: `app_exercise_source_mappings.mapping_status` for that local ID.

| Requested | Runtime ID | In the app | Media | Logging | Reference mapping | Status |
|---|---|---|---|---|---|---|
| Zercher Squat | 164 | yes | yes | reps | approved | **available** |
| Zercher Carry | 300 | yes | **no** | seconds (hold; no estimated max) | approved | available; media missing |
| Zercher Deadlift | — | no | — | — | — | **missing**; needs approved definition (pattern, roles, load convention) |
| Spoto Press | — | no | — | — | — | **missing**; a paused-above-chest bench variant; needs approval as a variant of Barbell Bench Press (1) or its own entry |
| Neck flexion / extension / lateral flexion isometrics, four-way neck | — | no | — | — | Supabase rows exist, `needs_review`, unmapped | **missing in app**; reference rows exist; needs approved entries, timed-hold logging, and no percentile (no defensible standard) |
| Barbell Bench Press | 1 | yes | yes | reps | approved | available |
| Incline Barbell Bench Press | 2 | yes | yes | reps | approved | available |
| Decline Barbell Bench Press | 3 | yes | yes | reps | approved | available |
| Dumbbell Bench Press | 4 | yes | yes | reps | approved | available |
| Incline Dumbbell Bench Press | 5 | yes | yes | reps | approved | available |
| Decline Dumbbell Bench Press | 6 | yes | yes | reps | approved | available |
| Dumbbell Floor Press | 7 | yes | yes | reps | approved | available |
| Alternating Dumbbell Bench Press | 9 | yes | **no** | reps | approved | available; media missing |
| Single-Arm Dumbbell Bench Press | 10 | yes | yes | reps | approved | available |
| Machine Chest Press | 11 | yes | yes | reps | approved | available |
| Incline Machine Chest Press | 12 | yes | yes | reps | approved | available |
| Plate-Loaded Chest Press | 13 | yes | yes | reps | approved | available |
| Smith Machine Bench Press | 14 | yes | yes | reps | approved | available |
| Cable Chest Press | 16 | yes | yes | reps | approved | available |
| Single-Arm Cable Chest Press | 17 | yes | **no** | reps | approved | available; media missing |
| Close-Grip Bench Press | 146 | yes | yes | reps | approved | available |
| Split-Stance Cable Chest Press | 302 | yes | yes | reps | approved | available |
| Half-Kneeling Cable Chest Press | 303 | yes | **no** | reps | approved | available; media missing |
| Neutral-Grip Cable Chest Press | 307 | yes | yes | reps | approved | available |
| Single-Arm Cable Floor Press | 308 | yes | **no** | reps | approved | available; media missing |
| Forearm block (20 exercises) | 401–420 | yes | 5 of 20 | per atlas policy | **none** | **reference mapping missing** |

## What closing A06 needs

1. **The owner supplies the approved addition manifest:** Zercher Deadlift, Spoto Press, neck work, and anything else promised. Each entry needs:
   - canonical name and aliases;
   - equipment and movement pattern;
   - muscle roles;
   - unilateral or bilateral;
   - measure (reps, or seconds for the neck isometrics);
   - load convention;
   - instructions;
   - source and confidence.
2. **Add each approved entry once, at the next free ID (421 onward).** Never reuse or repurpose an ID. Then add the reference mapping with an idempotent import.
3. **Approve the 20 forearm mappings (401–420)** in `app_exercise_source_mappings`. That is a data change in production, owned by whoever reviews mappings. After it, queued forearm lifts upload on their own; no device data changes.
4. **No percentile standards for neck or uncommon Zercher variants.** Those entries stay unranked, with the existing "no reference" explanation.
5. **Media.** Add photos for 9, 17, 300, 303, 308 and the 15 forearm entries without them, or keep the existing honest fallback. Never attach another exercise's photo.

The iOS shell does not depend on any of this. This report is why the promised additions should not be called complete.
