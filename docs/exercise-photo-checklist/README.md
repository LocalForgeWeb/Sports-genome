# Photo checklist (October 12)

**Why.** 152 of the 400 catalog exercises and 56 of the 71 warm-up drills and stretches still show a placeholder instead of a photograph: 208 items. The open source the app's photos come from, the Free Exercise DB, has been searched exhaustively for every one of them (`../exercise-photo-rematch/`, `../drill-photos/`). It does not photograph them as the catalog defines them.

**No other source was reachable.** On October 12 the build environment could reach only raw.githubusercontent.com:
- Blocked: wger.de, commons.wikimedia.org, upload.wikimedia.org, jsDelivr, Openverse, Hugging Face, and the stock-photo sites.
- wger and Wikimedia Commons hold openly licensed exercise photos, usually CC BY-SA with an author credit per photo. Neither could be viewed or verified.
- The only new open set found, hitmanrepo/open-exercise-illustrations (CC0, 415 exercises), is AI-generated illustration, not photographs. Its README says the form was not checked by a coach, and AI images were ruled out for this app. It matches 33 of the 208 by name anyway.

So the remaining photographs have to be taken, licensed, or fetched once those hosts are allowed. The checklist tracks that work, one box per item.

## The checklist

A Claude artifact, private to its owner: **https://claude.ai/artifact/WTwvoKyELvv3KjyYFUHCTy**

Each of the 208 items is a box that can be ticked only once the item has a start photo and a finish photo in the same format as every other exercise.

**Format.** Each item needs:
- two photos, the start of the movement and the finish;
- landscape: the page refuses an upright photo and crops the rest to 3:2 at 850 × 567, the size of the Free Exercise DB frames;
- one person, with the whole body and the equipment in frame;
- exactly the variation named: the same implement and handle, stance, and arm or leg.

**What each photo must show.** Every item carries a spec of what the start and finish photos must show, and the near miss that would not count.
- The specs are in `specs.json`.
- They were written from the catalog definition and the curators' notes on the closest existing photos, then reviewed adversarially.
- Example, Bayesian Cable Curl: start "Facing away from low pulley, staggered stance, single handle, one straight arm angled behind body"; avoid "Not facing the pulley with the upper arm hanging at the side".

**States.**

| State | Meaning |
| --- | --- |
| Needs photos | No photo yet, or one of the two. |
| Ready to tick | Both photos added; the box unlocks. |
| Ticked | Someone confirmed both photos show this exercise. |
| In the app | The photos are live in the app, in the same format as the rest. Claude sets this after adding them. |

**Where things are kept.** The rows live in the artifact's own store, one document per item in `items/<key>`:
- `<key>` is `ex-<catalog id>` or `drill-<drill id>`.
- Each document holds the name, group, spec, the ids of the two uploaded photos (`photoStart`, `photoFinish`), `checked` and `live`.
- The photos themselves are in the artifact's asset store.

## Rebuilding the rows

`npx tsx scripts/exercise-photos/checklist.ts <out.json>` lists every exercise and drill without a photo and attaches its spec. It fails if an item has no spec, so a new exercise cannot join the list without one.

## Putting ticked photos into the app

For each item that is ticked and not yet live:
1. Read the item's row.
2. Download its two photos from the artifact's asset store.
3. Check them by eye against the spec.
4. Add them to the app as a photo set: same-origin frames, a 264-pixel thumbnail like `client/public/exercise-thumbs/`, and the photographer's credit.
5. Mark the row `live`.

The app today serves only the Free Exercise DB set. A same-origin source for these photos, with a credit per set, is added with the first batch.
