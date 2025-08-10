/// <reference types="../../worker-configuration.d.ts" />

import { getDb } from "@worker/db";
import { createClerkClient } from "@clerk/backend";
import { TRPCError } from "@trpc/server";

export async function createContext({
  req,
  env,
  workerCtx,
}: {
  req: Request;
  env: Env;
  workerCtx: ExecutionContext;
}) {
  try {
    const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY, publishableKey: env.CLERK_PUBLISHABLE_KEY });
    const requestState = await clerk.authenticateRequest(req)
    const auth = requestState.toAuth()
    return {
      req,
      env,
      workerCtx,
      db: getDb(env),
      auth,
      clerk
    };


  } catch (error) {
    console.error(error)
    throw new TRPCError({ message: "Unable to get auth", cause: error, code: "BAD_GATEWAY" })
  }


}

export type Context = Awaited<ReturnType<typeof createContext>>;