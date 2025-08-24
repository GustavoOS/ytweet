import { createClerkClient } from "@clerk/backend";
import type { Context } from "../context";


export async function authFunction(ctx: Context) {
  const clerk = createClerkClient({ secretKey: ctx.env.CLERK_SECRET_KEY, publishableKey: ctx.env.CLERK_PUBLISHABLE_KEY });
  const requestState = await clerk.authenticateRequest(ctx.req);
  const auth = requestState.toAuth();
  if (!auth?.isAuthenticated) {
    throw new Error("User is not authenticated");
  }
  return clerk.users.getUser(auth.userId);
}

