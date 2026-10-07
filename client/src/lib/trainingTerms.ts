import type { GlossaryGroup } from "@/lib/glossarySearch";

/**
 * The Training terms' names and aliases: all universal search needs to link straight to one
 * term. The explanations live in lib/trainingGlossary, which only the glossary sheet loads.
 */
export type TrainingTerm = { id: string; group: GlossaryGroup; term: string; aliases: readonly string[] };

export const trainingTerms: readonly TrainingTerm[] = [
  { id: "set", group: "Prescription", term: "Set", aliases: ["set", "sets", "planned set", "planned sets", "set count", "sets x reps"] },
  { id: "repetition", group: "Prescription", term: "Repetition (rep)", aliases: ["rep", "reps", "repetition", "repetitions"] },
  { id: "rep-range", group: "Prescription", term: "Rep range", aliases: ["rep range", "repetition range", "rep target", "target reps", "8-12", "8–12"] },
  { id: "working-set", group: "Prescription", term: "Working set", aliases: ["working set", "working sets", "work set", "work sets", "multi-rep"] },
  { id: "warm-up-set", group: "Prescription", term: "Warm-up set", aliases: ["warm-up set", "warm-up sets", "warmup set", "warm up", "warmup", "ramp-up set"] },
  { id: "rest-interval", group: "Prescription", term: "Rest interval", aliases: ["rest", "rest interval", "rest period", "rest time", "rest timer", "rest between sets"] },
  { id: "tempo", group: "Prescription", term: "Tempo", aliases: ["tempo", "lifting tempo", "rep tempo", "cadence", "rep speed"] },
  { id: "range-of-motion", group: "Prescription", term: "Range of motion (ROM)", aliases: ["rom", "range of motion", "full range", "partial reps", "depth", "full depth"] },
  { id: "planned-vs-actual", group: "Logging", term: "Planned vs actual", aliases: ["planned", "actual", "planned sets", "completed sets", "plan vs log", "prescribed vs performed"] },
  { id: "skipped-vs-not-recorded", group: "Logging", term: "Skipped vs not recorded", aliases: ["skipped", "skip", "not recorded", "unrecorded", "not logged", "not done", "draft set"] },
  { id: "drop-set", group: "Logging", term: "Drop set (the set vs its stages)", aliases: ["drop set", "drop sets", "dropset", "stage", "stages", "drop", "strip set"] },
  { id: "per-side", group: "Logging", term: "Unilateral / per-side entry", aliases: ["unilateral", "per side", "per-side", "each side", "single-arm", "single-leg", "left", "right", "laterality", "/ side"] },
  { id: "assistance", group: "Logging", term: "Assistance (assisted exercises)", aliases: ["assistance", "assisted", "assist", "counterweight", "assisted pull-up", "assisted dip", "machine assistance"] },
  { id: "load-convention", group: "Logging", term: "Total vs per-implement load", aliases: ["total load", "per implement", "per-implement", "per dumbbell", "per hand", "weight per dumbbell", "added weight", "machine load", "stack weight"] },
  { id: "rpe", group: "Effort", term: "RPE (rating of perceived exertion)", aliases: ["rpe", "rate of perceived exertion", "rating of perceived exertion", "effort", "effort rating", "perceived exertion"] },
  { id: "rir", group: "Effort", term: "RIR (reps in reserve)", aliases: ["rir", "reps in reserve", "repetitions in reserve", "reps left", "reps short of failure"] },
  { id: "prescribed-vs-recorded-effort", group: "Effort", term: "Prescribed effort vs recorded effort", aliases: ["prescribed effort", "recorded effort", "target rpe", "actual rpe", "reported effort", "planned effort"] },
  { id: "direct-sets", group: "Analysis", term: "Direct sets", aliases: ["direct sets", "direct set", "direct volume", "sets per muscle", "weekly sets"] },
  { id: "supporting-exposure", group: "Analysis", term: "Supporting exposure ('With support (est.)')", aliases: ["supporting sets", "supporting exposure", "with support", "indirect sets", "indirect volume", "secondary muscle", "attributed sets", "half sets"] },
  { id: "coverage-points", group: "Analysis", term: "Coverage points (split targets)", aliases: ["coverage points", "split coverage", "split targets", "target gap", "coverage score"] },
  { id: "movement-pattern-coverage", group: "Analysis", term: "Movement-pattern coverage", aliases: ["movement coverage", "pattern coverage", "movement pattern", "movement patterns", "not planned", "unknown mapping"] },
  { id: "calendar-vs-plan-week", group: "Analysis", term: "Calendar week vs plan week", aliases: ["calendar week", "program week", "plan week", "training week", "this week", "week 1", "week 2", "week 3"] },
  { id: "e1rm", group: "Strength", term: "Estimated 1RM (e1RM)", aliases: ["e1rm", "estimated 1rm", "estimated one-rep max", "estimated one rep max", "estimated max", "1rm estimate"] },
  { id: "measured-1rm", group: "Strength", term: "Measured 1RM", aliases: ["1rm", "one-rep max", "one rep max", "measured max", "tested max", "max single", "measured one-rep max"] },
  { id: "percentile", group: "Strength", term: "Percentile", aliases: ["percentile", "percentiles", "strength percentile", "63rd percentile"] },
  { id: "comparison-group", group: "Strength", term: "Comparison group", aliases: ["comparison group", "reference group", "cohort", "compare against", "men who lift", "women who lift", "norms"] },
  { id: "rank", group: "Strength", term: "Rank (Sports Genome rank)", aliases: ["rank", "ranks", "capability rank", "rank band", "prospect", "jv", "junior varsity", "varsity", "regional", "state", "national", "world stage", "rank confidence"] },
  { id: "rank-coverage", group: "Strength", term: "Regions covered (coverage vs rank)", aliases: ["rank coverage", "regions covered", "covered", "coverage", "on record", "nothing logged yet"] },
  { id: "unavailable-comparison", group: "Strength", term: "Unavailable comparison (no percentile, Not scored)", aliases: ["unavailable", "no comparison", "not scored", "unranked", "no rank", "no percentile", "checking"] },
  { id: "muscle-role", group: "Sport context", term: "Primary / supporting / stabilizing role", aliases: ["prime mover", "primary mover", "primary", "synergist", "supporting", "assisting muscle", "stabilizer", "stabilizing", "muscle role"] },
  { id: "movement-support-vs-transfer", group: "Sport context", term: "Movement support vs proven skill transfer", aliases: ["movement support", "transfer", "skill transfer", "movement-specific", "related pattern", "muscle support", "not mapped", "movement link", "movement matches"] },
];
