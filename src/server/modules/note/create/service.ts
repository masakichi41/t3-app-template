import { db } from "@/server/db";
import { toDTO } from "@/server/modules/note/_dto";
import { insertNote } from "@/server/modules/note/_repo";
import { type AppError, Errors } from "@/server/types/errors";
import { type AsyncResult, Err, Ok } from "@/server/types/result";

import { input, type Output } from "./contract";

import type { UserId } from "@/server/types/brand";

export const execute = async (raw: unknown): AsyncResult<Output, AppError> => {
  const p = input.safeParse(raw);
  if (!p.success) {
    return Err(Errors.validation("INVALID_INPUT", p.error.issues));
  }

  const note = await insertNote(db, {
    userId: p.data.userId as UserId,
    title: p.data.title,
    content: p.data.content,
  });

  if (!note.success) {
    return Err(note.error);
  }

  return Ok(toDTO(note.data));
};
