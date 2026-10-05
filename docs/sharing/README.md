# Sharing workouts — Oct 4 brief: what was built and how it was checked

The ask: make sure people can easily copy and paste a workout out of Sports Genome and into their plan, with the complete sharing flow from the brief around it.

## The copy-and-paste path (the user's emphasis)

**Before.** "Copy workout summary" wrote each exercise across three lines: name, dose, then muscles. Pasting that back into Import plan:
- replaced every prescription with "3 × 8–12";
- turned each muscle line into a day of its own;
- replaced whatever day it landed on;
- gave every row "RPE 7 · 90 sec" whether or not the copy said so.

**Now.** Copy as text writes one line per exercise, with that exercise's whole prescription:

```
Push · Week 1
Shared from Sports Genome · 6 exercises
By Coach Sam
Short rests. Same weights as last week.

Day 1 · Push
1. Cable Standing Punch — 4 × 3–5 · RPE 7 · Rest 90 sec
2. Cable Press-Out — 4 × 3–5 · RPE 7 · Rest 90 sec
...
Open it or save a copy: https://…/s/<token>
```

Where it's available: the composer (as a visible button, not tucked under "Other ways") and the shared page.

How it reads it back:
- Import plan recognises this format and reads it line for line: days, order, sets × reps, RPE, rest and note. Copies made in the old format are still read correctly.
- If someone copies only the numbered lines, the general reader still matches them.
- Message-app damage (CRLF line endings, non-breaking spaces, extra blank lines) is tolerated.

How it saves:
- Pasting and "Save a copy" from a link both open the same Save to your plan dialog. It names the week and day, and adds after the day's own exercises by default.
- Replace is a choice, and it asks again, naming the day and how many exercises will go.
- An exercise the catalog doesn't hold stays visible by name and prescription until the person picks a match or leaves it out.
- Nothing is filled in that the copy didn't say. A line with no sets has no prescription, and it is never given an invented one.

## Journeys implemented

| Journey | Where |
|---|---|
| Share a workout or a week: Content / Preview / Share, Create link, system share sheet, Copy link, Copy as text, PDF | `client/src/components/WorkoutShareSheet.tsx` |
| Recipient page `/s/<token>`, no account needed: workout first, Save a copy, Copy as text, Print / Save PDF, every failure state | `client/src/pages/SharedWorkoutPage.tsx`, `client/src/components/SharedWorkoutView.tsx` |
| Save to your plan (week, day, add or replace, unresolved exercises, already saved) | `client/src/components/SaveToPlanDialog.tsx`, `client/src/lib/planImport.ts`, `Home.tsx` (`saveIncomingDays`) |
| Paste-ready text and its reader | `shared/workoutShareFormat.ts`, `client/src/lib/sharedWorkoutText.ts`, `StackImportPanel.tsx` |
| Shared by you: status, View, Copy link, Publish updated version, Turn off link | `client/src/components/SharedLinksManager.tsx`; in the composer and in Profile → Shared links |
| Server: snapshot store, create / get / disable / mine | `server/workoutShares.ts`, `server/routers.ts` (`shares`), `supabase/migrations/20261004_workout_shares.sql` |
| Link previews (title, description, image, noindex) rendered on the server | `server/sharePage.ts`, `vercel.json` rewrite `/s/:token`, `server/_core/serverless.ts`, `server/_core/index.ts` |

## The model chosen

**Snapshots.**
- A share is a copy made when the link is created, validated against a versioned schema (`shared/workoutShare.ts`, schema 1). The schema is checked on the server before storing, and again in the browser before anything is shown or saved.
- What it carries:
  - the title, plus an optional note and display name;
  - the days, in explicit order;
  - each exercise's catalog id, name, prescription, RPE, rest;
  - notes, only if the sender ticks "Include exercise notes".
- What it never carries: an account, an email, logged sets, history or body measures.
- Editing the plan afterwards changes nothing a recipient sees.

**Storage.**
- Supabase table `public.workout_shares`. RLS is on, there are no policies, and the anon and authenticated roles are revoked; only the server's service key reaches it. This has been applied to production.
- The token is 16 random bytes in base64url. It is not a record id.

**Ownership.** Production runs without accounts, so the device that creates a link holds a secret for it.
- The server stores only the secret's SHA-256 and compares in constant time.
- Only that device can turn the link off or publish an update.
- The Shared by you list says so; it doesn't pretend links are private.

**Retries.**
- Every create carries a request key, so a retried or double-sent create returns the same link.
- A changed title or note counts as a new request.

**Versions.**
- "Publish updated version" creates version N+1 at a new link.
- The old link keeps its content and shows "The sender has shared a newer version".

**Turning a link off.** It is enforced where the server reads the share. A turned-off link serves nothing of the workout, and its preview falls back to generic text.

**Saved copies.** A saved copy is the recipient's own: editing it touches nothing else.

## Tests run (executed, not inspected)

- `npx tsc --noEmit` passes.
- `npx vitest run`: 2907 passed. The 5 that fail are the same `server/supabase*` tests that can't reach Supabase from this sandbox, before and after this change.
- New test files, all passing:
  - `server/workoutShares.test.ts` (13)
  - `server/sharePage.test.ts` (5)
  - `client/src/lib/shareRoundTrip.test.ts` (12: copy → paste → plan, exact)
  - `SaveToPlanDialog.test.ts` (11)
  - `SharedWorkoutPage.test.ts` (11)
  - `SharedLinksManager.test.ts` (7)
  - `WorkoutShareSheet.test.ts` (13, rewritten for the composer)
- End to end, `probes/sharing-e2e.mjs` (26/26) and `probes/sharing-e2e-week.mjs` (12/12):
  - **Setup.** Two separate Chromium profiles, a sender and a recipient, each with its own storage, against the real server (`node dist/index.js`, production mode, in-memory share store). Only images are served locally. Results are in `evidence/*.json`.
  - **Sender.** The composer and preview; Create link (one tap makes one link); Copy link; Copy as text.
  - **Link preview.** The head carries the title and description and is noindex.
  - **Recipient page.** Order matches; no launch intro; print layout.
  - **Save a copy.** Appended after the recipient's own exercises, with the shared prescriptions; "already saved" on a second visit.
  - **Paste.** The copied text goes into Import plan, then Replace with confirmation; the day holds exactly the pasted workout.
  - **Week share.** Days stay in order.
  - **Lost response.** The server made the link but the answer was dropped; Try again returned the same token (`reused: true`).
  - **Edits and versions.** Editing the plan after sharing leaves the link unchanged; Publish updated version → the old link points to version 2.
  - **Another device.** It can't turn the link off (HTTP 403) or read its status.
  - **Public answer.** It holds only approved fields.
  - **Turned off.** The recipient sees "no longer available", and the preview is generic.
  - **Missing link.** It says so.
  - **Layout.** 320 / 375 / 390 / 430 px and 150% text: no sideways scroll.
- These are headless Chromium with phone-sized viewports, not phones or people.

## Production check (after deploy `dpl_Eqwjtn6uWHtpCt2rYjmfMWRK4LEZ`, READY)

Checked with server fetches against `sports-genome-local-b96d.vercel.app`, not a phone:

- **Setup.** A test share, `ProdCheckToken20261004x`, was written into `public.workout_shares`.
- **Link head.** `GET /s/<token>` returned 200 with `Cache-Control: no-store` and `X-Robots-Tag: noindex, nofollow`. The head carried the share's title, og:title/description/url/image and Twitter tags, plus the app's own scripts. This confirms that the Vercel rewrite, the function's `includeFiles` page template and the Supabase store all work in production.
- **API.** `shares.get` returned the approved snapshot only.
- **Turned off.** After the test share was turned off, `shares.get` returned `{"state":"disabled"}` and nothing else.
- **Live app.** The table also holds one other active share, created through the live app by someone else, so creating a link works in production too.
- **Cleanup.** Deleting the test row from this session timed out, so the row remains, turned off.

## Fixed along the way

- **Retry key.** A retry after a failed create used a new request key, so it could have made a second link. Now one key covers each piece of content.
- **Slow first render.** A shared link took 2.7 s to show the workout because the app held its mount for an intro that doesn't play there. It is now about 1.1 s locally. The same fix applies to anyone with the launch intro turned off.
- **Saved-day message.** It now says when exercises were already in the day: they are not added twice, the person's own sets are kept, and Replace is the way to take the shared ones.

## Not done / honest gaps

- **Scopes.** Multiweek plan and selected-exercise subsets are not built; the scopes are one workout and one week. Weeks 1–3 exist in the app, but a multi-week share would need its own composer step.
- **Preview image.** It is the app's existing 512 px mark (`og:image`), not a 1200 × 630 title card; no image renderer exists in this stack.
- **Messaging apps.** No app (iMessage, WhatsApp, Slack) was tested. Only the HTML head was checked.
- **Sign-in.** Production has no accounts, so "sign in to save" doesn't apply: saving is to the plan on that device.
- **Supersets and circuits.** Not in the app, so not shared.
- **Expiry.** Links don't expire; no expiry control is shown.
- **Logo in screenshots.** It shows as a plain orange square because the sandbox can't reach the asset host.

## Compatibility

- **New tables only.** No existing table changed. There were no share links before this, so none needed preserving.
- **Old copies.** Text copied with the previous "Copy workout summary" still pastes correctly.
- **Plans.** Saved plans, favorites and history are untouched; saving writes through the same day store the plan editor uses.
