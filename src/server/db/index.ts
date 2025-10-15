import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/env";

import { accounts } from "./schema/accounts";
import { notes } from "./schema/notes";
import { accountsRelations, sessionsRelations, usersRelations } from "./schema/relations";
import { sessions } from "./schema/sessions";
import { users } from "./schema/users";

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

const schema = {
  accounts,
  notes,
  sessions,
  users,
  accountsRelations,
  sessionsRelations,
  usersRelations,
};

const conn = globalForDb.conn ?? postgres(env.DATABASE_URL);
if (env.NODE_ENV !== "production") globalForDb.conn = conn;

export const db = drizzle(conn, { schema });

export type DBLike = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];
