export { createTable } from "./_table";
export {
  accounts,
  type InsertAccount,
  type SelectAccount,
} from "./accounts";
export { type InsertNote, notes, type SelectNote } from "./notes";
export {
  accountsRelations,
  sessionsRelations,
  usersRelations,
} from "./relations";
export {
  type InsertSession,
  type SelectSession,
  sessions,
} from "./sessions";
export { type InsertUser, type SelectUser, users } from "./users";
