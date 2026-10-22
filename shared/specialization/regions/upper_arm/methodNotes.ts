/**
 * What `upper_arm_mappings_v1` does and does not claim (docs/specialization-atlas/10-multi-region.md
 * §4.1, §8), shown under "How this is counted" on the upper-arm page and on any page that credits
 * an upper-arm muscle. The first three sentences are §8's wording with the upper arm's incidental
 * word, "steadying" (§1.1); the rest say what this version decided. The method in full is
 * docs/specialization-atlas/regions/upper_arm/mappings.md.
 */
export const upperArmMethodNotes: string = [
  "A reviewed mapping says the muscle does that joint action in that exercise, from anatomy references and, where cited, muscle-activity studies.",
  "It does not say how much the exercise loads the muscle.",
  "\"Incidental steadying\" credit means the muscle holds a position while other muscles move the load; it is counted apart and never as direct work.",
  "Each exercise has one shared variant (cat-<id>) with its set-up written out, and each mapping names one muscle, one joint action, how the muscle takes part (direct, contributing, steadying or holding) and whether its joint moves or holds.",
  "The lateral and medial heads of the triceps do the same things, so their work is credited together and never split between them.",
  "The long head has its own row; where the arm is held, overhead or at the side, never changes its credit, and growth found in training studies is never used as credit.",
  "The biceps' help in raising the arm forward is disputed, so no exercise counts toward a shoulder-flexion target in this version.",
  "The coracobrachialis is explained but never credited, and the brachioradialis is credited as the forearm counts it.",
  "Mappings not yet reviewed are shown as pending and never counted.",
].join(" ");
