import { protectedProcedure, publicProcedure, router, costlyPublicProcedure, authPublicProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  completeWorkoutSession,
  createWorkoutSession,
  getWorkoutSession,
  listProgressionSets,
  listWorkoutSessions,
  upsertWorkoutSet,
} from "./workoutSessions";
import {
  listFavoriteExerciseIds,
  setFavoriteExercise,
} from "./favoriteExercises";
import {
  beginPasskeyAuthentication,
  beginPasskeyRegistration,
  clearLocalSession,
  finishPasskeyAuthentication,
  finishPasskeyRegistration,
  listAccountPasskeys,
  registerEmailAccount,
  removeAccountPasskey,
  signInWithEmail,
} from "./localAuth";
import {
  getEvidenceImportPreview,
  getEvidenceLibrarySummary,
  getResearchEvidenceByPmid,
  getResearchEvidenceLibrary,
} from "./researchEvidence";
import {
  getSupabaseEvidenceInventory,
  getSupabaseExerciseEvidence,
  getSupabaseResearchLibrary,
} from "./supabaseEvidence";
import { getSupabaseSportProfile } from "./supabaseSportProfile";
import { getResilienceTargetCatalog } from "./supabaseResilience";
import { getStrengthPercentile, getStrengthPercentiles } from "./supabaseStrengthCurves";
import { getMuscleProfile } from "./supabaseStrengthProfile";
import { getPowerliftingNormsReference } from "./powerliftingNormsReference";
import { getNormsRegistryStatus, getStrengthGenomeOverviewWithReferences, getStrengthObservationReferences } from "./normsResolution";
import { getPublicNormsReference } from "./normsRegistry";
import { getWorkoutPlan, maxPlanBytes, saveWorkoutPlan } from "./workoutPlanSync";
import { createShare, disableShare, ownedShares, readShare, ShareError, tokenPattern } from "./workoutShares";
import { enforceShareCreate } from "./_core/rateLimit";
import {
  correctWorkoutSet,
  deleteStrengthObservation,
  deleteWorkoutSet,
  type RepairOutcome,
} from "./dataIntegrityRepair";
import {
  athleteStrengthProfileInputSchema,
  getAthleteStrengthProfile,
  upsertAthleteStrengthProfile,
} from "./athleteStrengthProfile";
import {
  createStrengthObservation,
  listActiveStrengthPriorities,
  listStrengthObservations,
  setStrengthObservationBodyMass,
  setStrengthPriority,
} from "./strengthGenome";
import { strengthRegionDefinitions } from "../shared/strengthGenomeDefinitions";

/**
 * One answer for "not yours" and "does not exist".
 *
 * Reporting them separately would turn every repair endpoint into a way to probe
 * which record ids exist on other accounts, so the distinction stays inside
 * `resolveRepair` and never reaches the wire.
 */
function answer(outcome: RepairOutcome) {
  if (outcome.status === "applied") return { status: "applied" as const };
  if (outcome.status === "unavailable") {
    throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Records are unavailable right now." });
  }
  throw new TRPCError({ code: "NOT_FOUND", message: "That record is not available on this account." });
}

/**
 * One lift, as the beta percentile route reads it. Any of the three identifiers names the
 * lift: the catalog id is exact, because the research side wrote it into each curve's
 * canonical name; the name is the fallback for the handful of curves that carry no id.
 */
const strengthPercentileLiftInput = z.object({
  // A curve id is a UUID from the curve index; anything else would only miss and fill the cache.
  exerciseId: z.guid().nullish(),
  catalogExerciseId: z.number().int().positive().nullish(),
  exerciseName: z.string().trim().min(1).max(255).nullish(),
  sex: z.enum(["male", "female"]).nullable(),
  bodyMassKg: z.number().positive().max(500).nullable().optional(),
  measuredOneRmKg: z.number().positive().max(1000).nullable().optional(),
  loadKg: z.number().positive().max(1000).nullable().optional(),
  repetitions: z.number().int().min(1).max(100).nullable().optional(),
  repsInReserve: z.number().int().min(0).max(10).nullable().optional(),
  /** Age on the day of the lift. The engine applies the published age table from 15 to 90. */
  ageYears: z.number().min(0).max(120).nullable().optional(),
});

/** A share failure as the API error it is, with a sentence a person can act on. */
async function shareCall<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (!(error instanceof ShareError)) throw error;
    const code = error.code === "unavailable" ? "SERVICE_UNAVAILABLE" : error.code === "forbidden" ? "FORBIDDEN" : error.code === "not-found" ? "NOT_FOUND" : error.code === "too-large" ? "PAYLOAD_TOO_LARGE" : "BAD_REQUEST";
    throw new TRPCError({ code, message: error.code === "unavailable" ? "Sharing by link isn't available right now." : error.message });
  }
}

export const appRouter = router({
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    register: authPublicProcedure
      .input(
        z.object({
          email: z.string().trim().email().max(320),
          password: z.string().min(12).max(200),
        })
      )
      .mutation(async ({ ctx, input }) =>
        registerEmailAccount(input, ctx.req, ctx.res)
      ),
    signIn: authPublicProcedure
      .input(
        z.object({
          email: z.string().trim().email().max(320),
          password: z.string().min(1).max(200),
        })
      )
      .mutation(async ({ ctx, input }) =>
        signInWithEmail(input, ctx.req, ctx.res)
      ),
    passkeyRegistrationOptions: protectedProcedure.mutation(({ ctx }) =>
      beginPasskeyRegistration(ctx.user, ctx.req)
    ),
    passkeyRegistrationVerify: protectedProcedure
      .input(z.object({ response: z.unknown() }))
      .mutation(({ ctx, input }) =>
        finishPasskeyRegistration(ctx.user, input.response, ctx.req)
      ),
    passkeys: protectedProcedure.query(({ ctx }) =>
      listAccountPasskeys(ctx.user.id)
    ),
    removePasskey: protectedProcedure
      .input(z.object({ passkeyId: z.number().int().positive() }))
      .mutation(({ ctx, input }) =>
        removeAccountPasskey(ctx.user.id, input.passkeyId)
      ),
    passkeyAuthenticationOptions: authPublicProcedure
      .input(z.object({ email: z.string().trim().email().max(320) }))
      .mutation(({ ctx, input }) =>
        beginPasskeyAuthentication(input.email, ctx.req)
      ),
    passkeyAuthenticationVerify: authPublicProcedure
      .input(
        z.object({
          email: z.string().trim().email().max(320),
          response: z.object({ id: z.string().min(1).max(1400) }).passthrough(),
        })
      )
      .mutation(({ ctx, input }) =>
        finishPasskeyAuthentication(
          input.email,
          input.response,
          ctx.req,
          ctx.res
        )
      ),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      await clearLocalSession(ctx.req, ctx.res);
      return { success: true } as const;
    }),
  }),

  researchEvidence: router({
    summary: publicProcedure.query(() => getEvidenceLibrarySummary()),
    importPreview: publicProcedure.query(() => getEvidenceImportPreview()),
    supabaseInventory: publicProcedure.query(() =>
      getSupabaseEvidenceInventory()
    ),
    supabaseLibrary: publicProcedure.query(() => getSupabaseResearchLibrary()),
    supabaseExercise: costlyPublicProcedure
      .input(z.object({ catalogExerciseId: z.number().int().positive() }))
      .query(({ input }) =>
        getSupabaseExerciseEvidence(input.catalogExerciseId)
      ),
    list: publicProcedure
      .input(
        z
          .object({
            topic: z.string().trim().max(160).optional(),
            includeRecordOnly: z.boolean().optional().default(false),
            limit: z.number().int().min(1).max(100).optional().default(100),
          })
          .optional()
      )
      .query(async ({ input }) => {
        const records = await getResearchEvidenceLibrary();
        return records
          .filter(record =>
            input?.includeRecordOnly ? true : record.recommendationEligible
          )
          .filter(record => !input?.topic || record.topic === input.topic)
          .slice(0, input?.limit ?? 100);
      }),
    byPmid: publicProcedure
      .input(z.object({ pmid: z.string().regex(/^\d{6,10}$/) }))
      .query(async ({ input }) => {
        const record = await getResearchEvidenceByPmid(input.pmid);
        if (!record)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Research evidence record not found",
          });
        return record;
      }),
  }),

  workoutLog: router({
    start: protectedProcedure
      .input(
        z.object({
          title: z.string().trim().min(1).max(180),
          sportId: z.string().trim().max(80).optional(),
          goal: z.string().trim().max(80).optional(),
          dayLabel: z.string().trim().max(100).optional(),
          exercises: z
            .array(
              z.object({
                catalogExerciseId: z.number().int().positive().optional(),
                exerciseName: z.string().trim().min(1).max(255),
                movement: z.string().trim().max(255).optional(),
                primaryMuscles: z
                  .array(z.string().trim().max(100))
                  .max(24)
                  .optional(),
                /*
                 * Tracks the `plannedPrescription` column that is actually
                 * deployed. Migration 0010 widens it to 255 for long per-set
                 * targets, but nothing in this repo runs migrations on deploy,
                 * so this stays at 100 until `pnpm db:migrate` has been run
                 * against the environment. Accepting more than the column can
                 * hold moves a clean rejection into a write failure.
                 */
                plannedPrescription: z.string().trim().min(1).max(100),
                plannedRpe: z.string().trim().max(40).optional(),
                plannedRest: z.string().trim().max(40).optional(),
              })
            )
            .min(1)
            .max(30),
        })
      )
      .mutation(async ({ ctx, input }) =>
        createWorkoutSession(ctx.user.id, input)
      ),
    get: protectedProcedure
      .input(z.object({ sessionId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const session = await getWorkoutSession(ctx.user.id, input.sessionId);
        if (!session)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Workout session not found",
          });
        return session;
      }),
    list: protectedProcedure.query(({ ctx }) =>
      listWorkoutSessions(ctx.user.id)
    ),
    progressionHistory: protectedProcedure.query(({ ctx }) =>
      listProgressionSets(ctx.user.id)
    ),
    logSet: protectedProcedure
      .input(
        z.object({
          sessionExerciseId: z.number().int().positive(),
          setNumber: z.number().int().min(1).max(20),
          actualWeight: z.number().min(0).max(2000).optional(),
          weightUnit: z.enum(["lb", "kg"]),
          actualReps: z.number().int().min(0).max(1000).optional(),
          actualRpe: z.number().min(1).max(10).optional(),
          completed: z.boolean(),
          setNotes: z.string().trim().max(500).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const session = await upsertWorkoutSet(ctx.user.id, input);
        if (!session)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "That active set log is not available to this account",
          });
        return session;
      }),
    complete: protectedProcedure
      .input(
        z.object({
          sessionId: z.number().int().positive(),
          sessionNotes: z.string().trim().max(5000).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const session = await completeWorkoutSession(
          ctx.user.id,
          input.sessionId,
          input.sessionNotes
        );
        if (!session)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Active workout session not found",
          });
        return session;
      }),
  }),

  /**
   * Correcting and removing the athlete's own records.
   *
   * Before this, `removePasskey` was the only destructive operation in the API,
   * so a mistyped set was permanent. Every procedure here re-checks ownership in
   * the database rather than trusting the id in the request.
   */
  repair: router({
    deleteWorkoutSet: protectedProcedure
      .input(
        z.object({
          sessionExerciseId: z.number().int().positive(),
          setNumber: z.number().int().positive().max(100),
        })
      )
      .mutation(async ({ ctx, input }) => answer(await deleteWorkoutSet(ctx.user.id, input))),
    correctWorkoutSet: protectedProcedure
      .input(
        z.object({
          sessionExerciseId: z.number().int().positive(),
          setNumber: z.number().int().positive().max(100),
          /** Omitted stays as it is; null clears it. */
          actualWeight: z.number().min(0).max(2000).nullable().optional(),
          weightUnit: z.enum(["lb", "kg"]).optional(),
          actualReps: z.number().int().min(0).max(1000).nullable().optional(),
          actualRpe: z.number().min(0).max(10).nullable().optional(),
          completed: z.boolean().optional(),
          setNotes: z.string().trim().max(500).nullable().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { sessionExerciseId, setNumber, ...correction } = input;
        return answer(await correctWorkoutSet(ctx.user.id, { sessionExerciseId, setNumber, correction }));
      }),
    deleteStrengthObservation: protectedProcedure
      .input(z.object({ observationId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) =>
        answer(await deleteStrengthObservation(ctx.user.id, input.observationId))
      ),
  }),

  strengthGenome: router({
    overview: protectedProcedure.query(({ ctx }) =>
      getStrengthGenomeOverviewWithReferences(ctx.user.id)
    ),
    observations: protectedProcedure.query(({ ctx }) =>
      listStrengthObservations(ctx.user.id)
    ),
    priorities: protectedProcedure.query(({ ctx }) =>
      listActiveStrengthPriorities(ctx.user.id)
    ),
    setPriority: protectedProcedure
      .input(z.object({
        // An unknown region is bad input (BAD_REQUEST), refused before the procedure runs.
        regionId: z.string().trim().min(1).max(80).refine(id => strengthRegionDefinitions.some(region => region.id === id), "Unknown Strength Genome region"),
        active: z.boolean(),
        note: z.string().trim().max(280).optional(),
      }))
      .mutation(({ ctx, input }) => setStrengthPriority(ctx.user.id, input.regionId, input.active, input.note)),
    setObservationBodyMass: protectedProcedure
      .input(z.object({ observationId: z.number().int().positive(), bodyMassKgAtTest: z.number().positive().max(1000) }))
      .mutation(async ({ ctx, input }) => {
        const saved = await setStrengthObservationBodyMass(ctx.user.id, input.observationId, input.bodyMassKgAtTest);
        // The same sentence as answer(): a missing id and another account's id read alike.
        if (!saved) throw new TRPCError({ code: "NOT_FOUND", message: "That record is not available on this account." });
        return saved;
      }),
    addObservation: protectedProcedure
      .input(
        z.object({
          catalogExerciseId: z.number().int().positive().optional(),
          exerciseName: z.string().trim().min(1).max(255),
          // Inside what a TIMESTAMP column holds (1970 to 2038), and not days
          // ahead: a typo year is a clear BAD_REQUEST, not a failed insert. Two
          // days of slack covers a UTC date read at local noon.
          observedAt: z.date().refine(
            (date) => date.getTime() >= Date.UTC(1970, 0, 2) && date.getTime() < Date.UTC(2038, 0, 1) && date.getTime() <= Date.now() + 2 * 86_400_000,
            { message: "Enter the date the lift happened." }
          ),
          measurementType: z.enum([
            "MEASURED_1RM",
            "MULTI_REP",
            "BODYWEIGHT",
            "ISOMETRIC",
            "DYNAMOMETRY",
            "JUMP",
            "FORCE_PLATE",
            "VELOCITY",
          ]),
          loadKg: z.number().min(0).max(5000).optional(),
          repetitions: z.number().int().min(0).max(1000).optional(),
          measuredOneRmKg: z.number().min(0).max(5000).optional(),
          estimatedOneRmKg: z.number().min(0).max(5000).optional(),
          estimationMethod: z.string().trim().max(120).optional(),
          estimatedErrorPercent: z.number().min(0).max(100).optional(),
          bodyMassKgAtTest: z.number().positive().max(1000).optional(),
          totalSystemLoadKg: z.number().min(0).max(5000).optional(),
          rpe: z.number().min(1).max(10).optional(),
          rir: z.number().min(0).max(20).optional(),
          equipment: z.string().trim().max(120).optional(),
          romStandard: z.string().trim().max(255).optional(),
          techniqueVariant: z.string().trim().max(255).optional(),
          tempo: z.string().trim().max(80).optional(),
          laterality: z.enum(["BILATERAL", "LEFT", "RIGHT"]).default("BILATERAL"),
          externalAssistance: z.string().trim().max(255).optional(),
          dataQuality: z.enum(["SELF_REPORTED", "STANDARDIZED", "VERIFIED", "UNCERTAIN"]).default("SELF_REPORTED"),
          referenceContextJson: z.string().trim().max(1600).optional(),
          notes: z.string().trim().max(3000).optional(),
        })
      )
      .mutation(({ ctx, input }) => createStrengthObservation(ctx.user.id, input)),
    powerliftingNorms: publicProcedure.query(() => getPowerliftingNormsReference()),
    /**
     * Resolves every saved observation against the approved research registry.
     * Each entry is either a source-bounded percentile band or the typed reason no
     * approved reference applies; the gate lives in the registry, not in this layer.
     */
    referenceComparisons: protectedProcedure.query(({ ctx }) =>
      getStrengthObservationReferences(ctx.user.id)
    ),
    /** Inventory of what the registry currently approves; implies no athlete rank. */
    referenceRegistryStatus: publicProcedure.query(() => getNormsRegistryStatus()),
    /**
     * The approved reference cut points themselves, so the workspace can resolve a
     * comparison for device-local observations that never reach the database.
     * Only rows the registry marks approved are ever sent, and each one is already
     * published percentile data - no athlete record is involved.
     */
    referenceRows: publicProcedure.query(() => getPublicNormsReference()),
    profile: protectedProcedure.query(({ ctx }) => getAthleteStrengthProfile(ctx.user.id)),
    setProfile: protectedProcedure
      .input(athleteStrengthProfileInputSchema)
      .mutation(({ ctx, input }) => upsertAthleteStrengthProfile(ctx.user.id, input)),
  }),

  sportsGenome: router({
    profile: costlyPublicProcedure
      .input(z.object({ sportId: z.string().trim().min(1).max(80) }))
      .query(({ input }) => getSupabaseSportProfile(input.sportId)),
  }),

  /**
   * Selectable capacity/function targets. Read-only and sport-independent: a general-mode
   * athlete gets the same catalog, and a target's `supportedRoutes` says what evidence
   * actually covers it rather than implying every target is actionable.
   */
  resilience: router({
    targetCatalog: publicProcedure.query(() => getResilienceTargetCatalog()),
  }),

  /**
   * Where a lift sits against sex- and bodyweight-matched community curves.
   *
   * This is the beta route (`strength_beta_v2`), kept separate from the research-grade
   * reference path in normsResolution: that one reports a band between published cut points
   * from a directly measured lift, this one interpolates a community curve from an estimated
   * 1RM. Every result names its route, so the two can never be read as the same number.
   *
   * One lift is described the same way whether it arrives alone or in a list.
   */
  /**
   * Per-muscle percentiles for Body Lab's Strength/Rank mode, scored by the database and
   * aggregated here (`server/muscleAggregation.ts`, D-016). Each lift carries the body weight
   * saved with it; the server groups by that weight so a later weight change never re-reads
   * an old lift.
   */
  strengthProfile: router({
    muscleRanks: costlyPublicProcedure
      .input(z.object({
        sex: z.enum(["male", "female"]).nullable(),
        lifts: z.array(z.object({
          catalogExerciseId: z.number().int().positive().nullish(),
          exerciseName: z.string().trim().min(1).max(255),
          /** 0 for a bodyweight movement done without added load; those are scored on reps. */
          loadKg: z.number().min(0).max(1000),
          repetitions: z.number().int().min(1).max(100),
          bodyMassKg: z.number().positive().max(500).nullable(),
          /** Age on the day of this lift, so a birth year given later re-reads every earlier lift. */
          ageYears: z.number().min(0).max(120).nullable().optional(),
        // Each distinct saved weight and age at the lift is one scoring call, each scored lift with an
        // age one adjustment call, plus one read of the muscle mappings: 30 lifts bound a request to 61
        // Supabase calls, run at most four at a time. The client sends at most 30 - each exercise's strongest lifts - duplicates removed.
        })).max(30),
      }))
      .query(({ input }) => getMuscleProfile(input)),
  }),
  strengthPercentile: router({
    forLift: costlyPublicProcedure
      .input(strengthPercentileLiftInput)
      .query(({ input }) => getStrengthPercentile(input)),
    /**
     * Several lifts in one request, answered in order. The Progress section places every
     * lift it shows a trend for; asking one at a time was a request per card.
     */
    forLifts: costlyPublicProcedure
      .input(z.object({ lifts: z.array(strengthPercentileLiftInput).max(24) }))
      .query(({ input }) => getStrengthPercentiles(input.lifts)),
  }),

  /**
   * The training plan, stored against the account so it survives the device.
   *
   * `save` takes the revision the client last saw. A mismatch means another device
   * has written since, and the write is refused with the current plan attached
   * rather than silently overwriting work built elsewhere.
   */
  workoutPlan: router({
    get: protectedProcedure.query(({ ctx }) => getWorkoutPlan(ctx.user.id)),
    save: protectedProcedure
      .input(
        z.object({
          planJson: z.string().max(maxPlanBytes),
          planVersion: z.number().int().min(1).max(100),
          /** Null when this device has never seen the server's copy. */
          baseRevision: z.number().int().min(0).nullable(),
        })
      )
      .mutation(({ ctx, input }) => saveWorkoutPlan(ctx.user.id, input)),
  }),
  /**
   * Shared workouts (server/workoutShares.ts): create a snapshot link, read one by its
   * token, and - for the device holding a share's secret - list and turn shares off.
   * Secrets travel only in POST bodies, never in a query string.
   */
  shares: router({
    create: costlyPublicProcedure
      .input(z.object({
        requestKey: z.string().regex(/^[A-Za-z0-9_-]{16,64}$/),
        manageSecret: z.string().regex(/^[A-Za-z0-9_-]{32,128}$/),
        snapshot: z.unknown(),
        supersedes: z.object({ token: z.string().regex(tokenPattern), manageSecret: z.string().regex(/^[A-Za-z0-9_-]{32,128}$/) }).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await enforceShareCreate(ctx.req, ctx.res);
        return shareCall(() => createShare(input));
      }),
    get: costlyPublicProcedure
      .input(z.object({ token: z.string().max(80) }))
      .query(({ input }) => shareCall(() => readShare(input.token))),
    disable: costlyPublicProcedure
      .input(z.object({ token: z.string().regex(tokenPattern), manageSecret: z.string().regex(/^[A-Za-z0-9_-]{32,128}$/) }))
      .mutation(({ input }) => shareCall(() => disableShare(input.token, input.manageSecret))),
    mine: costlyPublicProcedure
      .input(z.object({ items: z.array(z.object({ token: z.string().regex(tokenPattern), manageSecret: z.string().regex(/^[A-Za-z0-9_-]{32,128}$/) })).max(50) }))
      .mutation(({ input }) => shareCall(() => ownedShares(input.items))),
  }),
  favorites: router({
    list: protectedProcedure.query(({ ctx }) =>
      listFavoriteExerciseIds(ctx.user.id)
    ),
    set: protectedProcedure
      .input(
        z.object({
          catalogExerciseId: z.number().int().positive(),
          favorited: z.boolean(),
        })
      )
      .mutation(({ ctx, input }) =>
        setFavoriteExercise(
          ctx.user.id,
          input.catalogExerciseId,
          input.favorited
        )
      ),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
