import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
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
} from "./supabaseEvidence";
import {
  createStrengthObservation,
  getStrengthGenomeOverview,
  listActiveStrengthPriorities,
  listStrengthObservations,
  setStrengthObservationBodyMass,
  setStrengthPriority,
} from "./strengthGenome";

export const appRouter = router({
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    register: publicProcedure
      .input(
        z.object({
          email: z.string().trim().email().max(320),
          password: z.string().min(12).max(200),
        })
      )
      .mutation(async ({ ctx, input }) =>
        registerEmailAccount(input, ctx.req, ctx.res)
      ),
    signIn: publicProcedure
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
    passkeyAuthenticationOptions: publicProcedure
      .input(z.object({ email: z.string().trim().email().max(320) }))
      .mutation(({ ctx, input }) =>
        beginPasskeyAuthentication(input.email, ctx.req)
      ),
    passkeyAuthenticationVerify: publicProcedure
      .input(
        z.object({
          email: z.string().trim().email().max(320),
          response: z.object({ id: z.string() }).passthrough(),
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
    supabaseExercise: publicProcedure
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

  strengthGenome: router({
    overview: protectedProcedure.query(({ ctx }) =>
      getStrengthGenomeOverview(ctx.user.id)
    ),
    observations: protectedProcedure.query(({ ctx }) =>
      listStrengthObservations(ctx.user.id)
    ),
    priorities: protectedProcedure.query(({ ctx }) =>
      listActiveStrengthPriorities(ctx.user.id)
    ),
    setPriority: protectedProcedure
      .input(z.object({ regionId: z.string().trim().min(1).max(80), active: z.boolean(), note: z.string().trim().max(280).optional() }))
      .mutation(({ ctx, input }) => setStrengthPriority(ctx.user.id, input.regionId, input.active, input.note)),
    setObservationBodyMass: protectedProcedure
      .input(z.object({ observationId: z.number().int().positive(), bodyMassKgAtTest: z.number().positive().max(1000) }))
      .mutation(({ ctx, input }) => setStrengthObservationBodyMass(ctx.user.id, input.observationId, input.bodyMassKgAtTest)),
    addObservation: protectedProcedure
      .input(
        z.object({
          catalogExerciseId: z.number().int().positive().optional(),
          exerciseName: z.string().trim().min(1).max(255),
          observedAt: z.date(),
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
