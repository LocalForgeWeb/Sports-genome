import type { UnmappedTaggedExercise } from "../../types";

/**
 * Catalog exercises that list `forearms` as a secondary muscle, or carry the `grip` quality, and
 * are deliberately left without an atlas mapping. They stay region-level for the forearm (and
 * keep their usual week totals). Each says why, so a later review can revisit the reason rather
 * than rediscover it.
 *
 * No exercise tagged `forearms` as a PRIMARY muscle is here: since 16 Oct 2026 every one has a
 * reviewed mapping (client/src/lib/specialization/regionContent.test.ts holds every region to a
 * mapping or a listed reason for each tagged row).
 */
export const forearmUnmappedTagged: UnmappedTaggedExercise[] = [
  { catalogId: 24, reason: "Pullover: the hands cup one end of the dumbbell rather than gripping a handle, and the grip demand depends on that set-up." },
  { catalogId: 63, reason: "Pullover: straight-arm shoulder extension; the attachment and grip vary and are not defined." },
  { catalogId: 64, reason: "Pullover machines load the upper arm through pads; the hands may barely grip." },
  { catalogId: 65, reason: "Pullover: the hands cup one end of the dumbbell rather than gripping a handle, and the grip demand depends on that set-up." },
  { catalogId: 190, reason: "The bar sits on the upper back; the hands steady it but do not hold the load." },
  { catalogId: 191, reason: "The bar sits on the upper back; the hands steady it but do not hold the load." },
  { catalogId: 200, reason: "Done unloaded or with a plate held to the chest; no defined grip on a load." },
  { catalogId: 201, reason: "The hands hold the machine to stay on it; the load is on the legs." },
  { catalogId: 279, reason: "A ball is held between the palms and released; no sustained grip." },
  { catalogId: 280, reason: "A ball is held between the palms and released; no sustained grip." },
  { catalogId: 296, reason: "The hands push on the sled's posts; nothing is gripped against load." },
  { catalogId: 297, reason: "Handles or a harness can be used; the catalog does not say which, so the grip demand is unknown." },
  { catalogId: 298, reason: "The hands push on the sled's posts; nothing is gripped against load." },
  { catalogId: 319, reason: "Light shoulder-rotation work; the handle is held, not loaded in the grip in any way the atlas can name." },
  { catalogId: 335, reason: "Explosive pull whose grip demand depends on load and attachment; not reviewed." },
  { catalogId: 343, reason: "The hands push down on the attachment; the forearm tag reflects steadying the wrist, which the atlas has no reviewed mapping for." },
  { catalogId: 344, reason: "The hands push down on the attachment; the forearm tag reflects steadying the wrist, which the atlas has no reviewed mapping for." },
  { catalogId: 345, reason: "Palms-up pressdown; the wrist steadying is not reviewed." },
  { catalogId: 346, reason: "The hand pushes down on the handle; the wrist steadying is not reviewed." },
  { catalogId: 348, reason: "Light handle hold; the wrist steadying is not reviewed." },
  { catalogId: 387, reason: "Ballistic: the bell rotates around the hand and the grip demand changes through the lift; not reviewed." },
  { catalogId: 388, reason: "Ballistic: the bell rotates around the hand and the grip demand changes through the lift; not reviewed." },
  { catalogId: 389, reason: "Ballistic then pressing; the grip demand changes through the lift; not reviewed." },
  { catalogId: 390, reason: "The bell is held overhead with the wrist stacked; wrist steadying, not a reviewed grip mapping." },
];
