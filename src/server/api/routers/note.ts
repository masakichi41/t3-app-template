import { createTRPCRouter } from "@/server/api/trpc";
import { createNote } from "@/server/modules/note/create/endpoint.trpc";
import { listNotes } from "@/server/modules/note/list/endpoint.trpc";

export const noteRouter = createTRPCRouter({
  create: createNote,
  list: listNotes,
});
