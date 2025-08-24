import { TRPCError } from "@trpc/server";
import { t } from "@worker/trpc";
import { authFunction } from "@worker/trpc/middlewares/auth";
import { rateLimitFunction } from "@worker/trpc/middlewares/rate-limit";

export const authentication = t.middleware(async ({ next, ctx }) => {
  try {
    const user = await authFunction(ctx);
    return next({ ctx: { ...ctx, user } });
  } catch (error) {
    console.error(error);
    throw new TRPCError({ message: "Unable to get auth", cause: error, code: "UNAUTHORIZED" });
  }
});

export const rateLimit = t.middleware(async ({ next, ctx }) => {
  await rateLimitFunction(ctx)
  return next({ ctx });
});