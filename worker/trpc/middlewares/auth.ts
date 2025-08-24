import { createClerkClient, type User } from "@clerk/backend";
import { TRPCError } from "@trpc/server";
import { t } from "@worker/trpc";
import type { Context } from "../context";

export type AuthenticatedContext = Context & { user: User };

export const authentication = t.middleware(async ({ next, ctx }) => {
  try {
    const user = await getUser(ctx);
    return next({ ctx: { ...ctx, user } });
  } catch (error) {
    console.error(error);
    throw new TRPCError({ message: "Unable to get auth", cause: error, code: "UNAUTHORIZED" });
  }
});

export async function getUser(ctx: Context) {
  const clerk = createClerkClient({ secretKey: ctx.env.CLERK_SECRET_KEY, publishableKey: ctx.env.CLERK_PUBLISHABLE_KEY });
  const requestState = await clerk.authenticateRequest(ctx.req);
  const auth = requestState.toAuth();
  if (!auth?.isAuthenticated) {
    throw new Error("User is not authenticated");
  }
  return clerk.users.getUser(auth.userId);
}

