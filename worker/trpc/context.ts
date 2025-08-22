/// <reference types="../../worker-configuration.d.ts" />

import { getDb } from "@worker/db";
import { Redis } from '@upstash/redis';

export async function createContext({
  req,
  env,
  workerCtx,
}: {
  req: Request;
  env: Env;
  workerCtx: ExecutionContext;
}) {
  const redis = new Redis({
    url: env.REDIS_URL,
    token: env.REDIS_TOKEN,
  });

  return {
    req,
    env,
    workerCtx,
    db: getDb(env),
    redis
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;