import type { db } from "@/server/db";

export type Deps = {
  db: typeof db;
  authUserId: string | null;
  now: () => Date;
};

export const createDeps = (
  database: typeof db,
  authUserId: string | null,
): Deps => {
  return {
    db: database,
    authUserId,
    now: () => new Date(),
  };
};
