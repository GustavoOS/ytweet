import type { PgQueryResultHKT, PgTransaction } from "drizzle-orm/pg-core";
import * as schema from "@worker/db/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import type { ExtractTablesWithRelations } from "drizzle-orm";

export type Schema = typeof schema;
export type Database = ReturnType<typeof drizzle<Schema>>;
export type Tx = PgTransaction<PgQueryResultHKT, Schema, ExtractTablesWithRelations<Schema>>;

export type Db = Database | Tx
