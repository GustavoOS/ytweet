/// <reference types="../../worker-configuration.d.ts" />

import { getDb } from "@worker/db";
import { Redis } from '@upstash/redis';
import { UnitOfWork } from "@worker/uow";

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

  const db = getDb(env);

  return {
    req,
    env,
    workerCtx,
    db,
    uow: new UnitOfWork(db),
    redis
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;