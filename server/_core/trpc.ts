import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { publicErrorMessage } from "./apiErrors";
import { assertCostlyCallAllowed } from "./rateLimit";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  /**
   * An unexpected failure answers with a fixed sentence and a reference instead of its
   * own message, which for a database error carried the SQL and its bound values. The
   * stack is sent only in development. Deliberate errors keep their messages.
   */
  errorFormatter({ shape, error }) {
    const data = process.env.NODE_ENV === "development" ? shape.data : { ...shape.data, stack: undefined };
    return { ...shape, message: publicErrorMessage(error), data };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

/** A public route that fans out to Supabase with the service key: counted per client (./rateLimit.ts). */
export const costlyPublicProcedure = t.procedure.use(async ({ ctx, next }) => {
  assertCostlyCallAllowed(ctx.req);
  return next();
});

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
