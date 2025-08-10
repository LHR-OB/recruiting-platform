import { drizzle } from "drizzle-orm/neon-http";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

import { env } from "~/env";
import * as schema from "./schema";

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  conn: NeonQueryFunction<false, false> | undefined;
};

const conn = globalForDb.conn ?? neon(env.DATABASE_URL);
if (env.NODE_ENV !== "production") globalForDb.conn = conn;

const db = drizzle({ client: conn, schema });
export { db, schema };
