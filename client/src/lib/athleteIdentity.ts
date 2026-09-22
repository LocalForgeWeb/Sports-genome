import { getSupabaseClient } from "@/lib/supabaseClient";
import { sexCodeFor } from "@/lib/athleteStrengthEntry";
import type { SexForReference } from "@/components/AthleteBaselineQuiz";

/**
 * Gives every athlete a durable Supabase user id, without asking them to sign
 * up before they can train.
 *
 * The first launch signs in anonymously, which creates a real `auth.users` row.
 * That id owns their `athlete_profiles` row and every
 * `athlete_strength_entries` row from then on, and the session persists across
 * launches, so the history is attached to an account from the very first lift
 * rather than from whenever they eventually decide to register.
 *
 * Adding an email later calls `updateUser` on that same id: the account gains a
 * way to sign in on another device, and not one row moves. That is the whole
 * reason for doing it in this order — registering first and back-filling later
 * is the version where early history gets orphaned.
 *
 * Every function here returns rather than throws. A failure to reach Supabase
 * is a normal condition — no network in a gym basement — and must never stop
 * the athlete logging a set.
 */
export type IdentityState = {
  userId: string | null;
  /** True while the athlete has an id but no email or phone attached to it. */
  anonymous: boolean;
  /** Why there is no id, when there is none. */
  reason?: "not_configured" | "anonymous_sign_ins_disabled" | "unreachable";
};

export const identityChangedEvent = "sports-genome:identity";

function announce() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(identityChangedEvent));
}

/**
 * Resolves the current session, signing in anonymously if there is not one yet.
 * Safe to call on every launch: an existing session short-circuits.
 */
export async function ensureAthleteIdentity(): Promise<IdentityState> {
  const supabase = getSupabaseClient();
  if (!supabase) return { userId: null, anonymous: true, reason: "not_configured" };

  try {
    const { data: existing } = await supabase.auth.getSession();
    const currentUser = existing.session?.user;
    if (currentUser) {
      return { userId: currentUser.id, anonymous: !currentUser.email && !currentUser.phone };
    }

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error || !data.user) {
      // Anonymous sign-ins are a project setting. If they are off, the app keeps
      // working entirely on-device and says so, rather than failing silently.
      const disabled = /anonymous/i.test(error?.message || "") || error?.status === 422;
      return { userId: null, anonymous: true, reason: disabled ? "anonymous_sign_ins_disabled" : "unreachable" };
    }
    announce();
    return { userId: data.user.id, anonymous: true };
  } catch {
    return { userId: null, anonymous: true, reason: "unreachable" };
  }
}

export type AthleteProfileUpsert = {
  sexForReference?: SexForReference;
  birthYear?: number;
  /** uuid from public.sports, resolved from the athlete's chosen sport. */
  primarySportId?: string;
  /**
   * Which of the three real states the athlete is in. The column exists and
   * defaults to `undecided`, and nothing was writing it — so an athlete who had
   * chosen wrestling was stored as never having answered, which is precisely the
   * distinction `sport-optional-context-not-fake-sport` exists to keep.
   */
  sportContextMode?: "sport" | "general" | "undecided";
  /** The athlete's latest weight, used only to prefill a new entry. */
  defaultBodyWeightKg?: number;
  benchmarkPoolOptIn?: boolean;
};

/**
 * Writes the athlete's current defaults to `public.athlete_profiles`.
 *
 * `default_bodyweight_kg` is exactly that — a default. It is not what a lift is
 * measured against; each entry carries its own dated `bodyweight_kg` snapshot,
 * so changing this never rewrites history.
 *
 * `benchmark_pool_opt_in` is only ever sent when the athlete has actually
 * answered. The column defaults to false, and an app that quietly wrote `true`
 * would be answering a consent question on their behalf.
 */
export async function upsertAthleteProfile(userId: string, profile: AthleteProfileUpsert): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase || !userId) return false;

  const row: Record<string, unknown> = {
    user_id: userId,
    sex_code: sexCodeFor(profile.sexForReference),
    updated_at: new Date().toISOString(),
  };
  if (profile.birthYear) row.declared_age_years = new Date().getFullYear() - profile.birthYear;
  /**
   * Mode and sport move together or not at all.
   *
   * `athlete_profiles_mode_sport_agreement_check` requires a sport in `sport`
   * mode and forbids one in `general` or `undecided`. A partial write breaks it
   * both ways: declaring `general` while a previous sport id is still on the row
   * is rejected, and so is declaring `sport` before the sport uuid has resolved.
   * A rejected upsert takes the whole row with it — sex, weight, everything — so
   * the pair is either complete and consistent, or left alone for the next run.
   */
  if (profile.sportContextMode === "sport") {
    if (profile.primarySportId) {
      row.sport_context_mode = "sport";
      row.primary_sport_id = profile.primarySportId;
    }
  } else if (profile.sportContextMode) {
    row.sport_context_mode = profile.sportContextMode;
    row.primary_sport_id = null;
  } else if (profile.primarySportId) {
    // No mode declared by the caller: the sport alone, as this has always done.
    row.primary_sport_id = profile.primarySportId;
  }
  if (profile.defaultBodyWeightKg && profile.defaultBodyWeightKg > 0) row.default_bodyweight_kg = Number(profile.defaultBodyWeightKg.toFixed(2));
  if (profile.benchmarkPoolOptIn !== undefined) row.benchmark_pool_opt_in = profile.benchmarkPoolOptIn;

  try {
    const { error } = await supabase.from("athlete_profiles").upsert(row, { onConflict: "user_id" });
    return !error;
  } catch {
    return false;
  }
}

/** Attaches an email to the id the athlete already has, keeping every row. */
export async function attachEmailToIdentity(email: string): Promise<{ ok: boolean; message?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { ok: false, message: "Account sync is not configured on this build." };
  try {
    const { error } = await supabase.auth.updateUser({ email });
    if (error) return { ok: false, message: error.message };
    announce();
    return { ok: true };
  } catch {
    return { ok: false, message: "Could not reach the account service." };
  }
}
