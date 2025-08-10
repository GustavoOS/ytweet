/// <reference types="../../worker-configuration.d.ts" />
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@worker/db/schema";

export function getDb(env: Env) {
    const url = env.DATABASE_URL ?? env.HYPERDRIVE.connectionString;
    const conn = postgres(url, {
      // Limit the connections for the Worker request to 5 due to Workers' limits on concurrent external connections
      max: 5,
      // If you are not using array types in your Postgres schema, disable `fetch_types` to avoid an additional round-trip (unnecessary latency)
      fetch_types: false,
    });

    return drizzle(conn, { 
      schema,
      logger: true // Enable SQL logging for debugging
    });  
}
