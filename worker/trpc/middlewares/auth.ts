import { createClerkClient, type User } from "@clerk/backend";
import { TRPCError } from "@trpc/server";
import { t } from "@worker/trpc";
import type { Context } from "../context";

type ExtendedContext = Context & { user: User };
export async function authenticateUserMiddlewareFunction<T>({ next, ctx }: { ctx: Context, next: (opts: { ctx: ExtendedContext }) => Promise<T> }) {
  try {
    const clerk = createClerkClient({ secretKey: ctx.env.CLERK_SECRET_KEY, publishableKey: ctx.env.CLERK_PUBLISHABLE_KEY });
    const requestState = await clerk.authenticateRequest(ctx.req);
    const auth = requestState.toAuth();
    if (!auth?.isAuthenticated) {
      throw new Error("User is not authenticated");
    }
    const user = await clerk.users.getUser(auth.userId);
    return next({ ctx: { ...ctx, user } });

  } catch (error) {
    console.error(error);
    throw new TRPCError({ message: "Unable to get auth", cause: error, code: "UNAUTHORIZED" });
  }
};

export const authentication = t.middleware(authenticateUserMiddlewareFunction);
