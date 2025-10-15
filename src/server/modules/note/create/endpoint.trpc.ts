import { protectedProcedure } from "@/server/api/trpc";
import { toTrpcError } from "@/server/types/errors";
import { createDeps } from "@/server/utils/deps";

import { request, response } from "./contract";
import { execute } from "./service";

export const createNote = protectedProcedure
  .input(request)
  .output(response)
  .mutation(async ({ ctx, input }) => {
    const deps = createDeps(ctx.db, ctx.session.user.id);

    const result = await execute(deps, input);
    if (!result.success) {
      throw toTrpcError(result.error);
    }
    return result.data;
  });
