import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { completeWorkoutSession, createWorkoutSession, getWorkoutSession, listProgressionSets, listWorkoutSessions, upsertWorkoutSet } from "./workoutSessions";
import { listFavoriteExerciseIds, setFavoriteExercise } from "./favoriteExercises";
import { beginPasskeyAuthentication, beginPasskeyRegistration, clearLocalSession, finishPasskeyAuthentication, finishPasskeyRegistration, listAccountPasskeys, registerEmailAccount, removeAccountPasskey, signInWithEmail } from "./localAuth";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    register: publicProcedure.input(z.object({ email: z.string().trim().email().max(320), password: z.string().min(12).max(200) })).mutation(async ({ ctx, input }) => registerEmailAccount(input, ctx.req, ctx.res)),
    signIn: publicProcedure.input(z.object({ email: z.string().trim().email().max(320), password: z.string().min(1).max(200) })).mutation(async ({ ctx, input }) => signInWithEmail(input, ctx.req, ctx.res)),
    passkeyRegistrationOptions: protectedProcedure.mutation(({ ctx }) => beginPasskeyRegistration(ctx.user, ctx.req)),
    passkeyRegistrationVerify: protectedProcedure.input(z.object({ response: z.unknown() })).mutation(({ ctx, input }) => finishPasskeyRegistration(ctx.user, input.response, ctx.req)),
    passkeys: protectedProcedure.query(({ ctx }) => listAccountPasskeys(ctx.user.id)),
    removePasskey: protectedProcedure.input(z.object({ passkeyId: z.number().int().positive() })).mutation(({ ctx, input }) => removeAccountPasskey(ctx.user.id, input.passkeyId)),
    passkeyAuthenticationOptions: publicProcedure.input(z.object({ email: z.string().trim().email().max(320) })).mutation(({ ctx, input }) => beginPasskeyAuthentication(input.email, ctx.req)),
    passkeyAuthenticationVerify: publicProcedure.input(z.object({ email: z.string().trim().email().max(320), response: z.object({ id: z.string() }).passthrough() })).mutation(({ ctx, input }) => finishPasskeyAuthentication(input.email, input.response, ctx.req, ctx.res)),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      await clearLocalSession(ctx.req, ctx.res);
      return { success: true } as const;
    }),
  }),

  workoutLog: router({
    start: protectedProcedure.input(z.object({
      title: z.string().trim().min(1).max(180),
      sportId: z.string().trim().max(80).optional(),
      goal: z.string().trim().max(80).optional(),
      dayLabel: z.string().trim().max(100).optional(),
      exercises: z.array(z.object({
        catalogExerciseId: z.number().int().positive().optional(),
        exerciseName: z.string().trim().min(1).max(255),
        movement: z.string().trim().max(255).optional(),
        primaryMuscles: z.array(z.string().trim().max(100)).max(24).optional(),
        plannedPrescription: z.string().trim().min(1).max(100),
        plannedRpe: z.string().trim().max(40).optional(),
        plannedRest: z.string().trim().max(40).optional(),
      })).min(1).max(30),
    })).mutation(async ({ ctx, input }) => createWorkoutSession(ctx.user.id, input)),
    get: protectedProcedure.input(z.object({ sessionId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const session = await getWorkoutSession(ctx.user.id, input.sessionId);
      if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Workout session not found" });
      return session;
    }),
    list: protectedProcedure.query(({ ctx }) => listWorkoutSessions(ctx.user.id)),
    progressionHistory: protectedProcedure.query(({ ctx }) => listProgressionSets(ctx.user.id)),
    logSet: protectedProcedure.input(z.object({
      sessionExerciseId: z.number().int().positive(),
      setNumber: z.number().int().min(1).max(20),
      actualWeight: z.number().min(0).max(2000).optional(),
      weightUnit: z.enum(["lb", "kg"]),
      actualReps: z.number().int().min(0).max(1000).optional(),
      actualRpe: z.number().min(1).max(10).optional(),
      completed: z.boolean(),
      setNotes: z.string().trim().max(500).optional(),
    })).mutation(async ({ ctx, input }) => {
      const session = await upsertWorkoutSet(ctx.user.id, input);
      if (!session) throw new TRPCError({ code: "FORBIDDEN", message: "That active set log is not available to this account" });
      return session;
    }),
    complete: protectedProcedure.input(z.object({ sessionId: z.number().int().positive(), sessionNotes: z.string().trim().max(5000).optional() })).mutation(async ({ ctx, input }) => {
      const session = await completeWorkoutSession(ctx.user.id, input.sessionId, input.sessionNotes);
      if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Active workout session not found" });
      return session;
    }),
  }),

  favorites: router({
    list: protectedProcedure.query(({ ctx }) => listFavoriteExerciseIds(ctx.user.id)),
    set: protectedProcedure.input(z.object({
      catalogExerciseId: z.number().int().positive(),
      favorited: z.boolean(),
    })).mutation(({ ctx, input }) => setFavoriteExercise(ctx.user.id, input.catalogExerciseId, input.favorited)),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
