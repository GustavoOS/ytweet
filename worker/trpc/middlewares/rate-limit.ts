import { TRPCError } from "@trpc/server";
import { Ratelimit } from "@upstash/ratelimit";
import { t } from "@worker/trpc";
import type { Context } from "@worker/trpc/context";
import { isLocal } from "@worker/trpc/util/local";

export async function rateLimitFunction(ctx: Context) {
  const limiter = new Ratelimit({
    redis: ctx.redis,
    limiter: Ratelimit.slidingWindow(10, "10 s"),
    analytics: true,
    prefix: "ratelimit",
  });

  const ip = ctx.req.headers.get("CF-Connecting-IP");

  if (!ip) {
    if (isLocal(ctx.env.DATABASE_URL)) {
      console.warn("⚠️  Running in local mode, skipping rate limit");
      return;
    }
    throw new TRPCError({ code: "BAD_REQUEST", message: "IP address not found" });
  }

  console.info("⏲️  Using Rate Limiter")

  const { success } = await limiter.limit(ip);
  if (!success) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Rate limit exceeded",
    });
  }
}

export const rateLimit = t.middleware(async ({ next, ctx }) => {
  await rateLimitFunction(ctx)
  return next({ ctx });
});
