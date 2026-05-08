import { TRPCError } from "@trpc/server";
import { matchStore } from "server/match-store";
import { DispatchableError } from "shared/dispatchable-error";
import { throwIfUndefined } from "shared/types/throw-helper";
import { z } from "zod";
import { t } from "../trpc-init";

export const withMatchIdSchema = z.object({
  matchId: z.string(),
});

export type WithMatchId = z.infer<typeof withMatchIdSchema>;

export const matchMiddleware = t.middleware(async ({ ctx, input, next }) => {
  const parseResult = withMatchIdSchema.safeParse(input);

  if (!parseResult.success) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No matchId specified",
    });
  }

  const { matchId } = parseResult.data;
  const match = throwIfUndefined(matchStore.get(matchId), `Match with id ${matchId} not found`);

  if (match.type === "match-in-setup") {
    throw new DispatchableError("Match is in setup, not in-game");
  }

  return next({
    ctx: {
      ...ctx,
      match,
    },
  });
});

export const matchInSetupMiddleware = t.middleware(async ({ ctx, input, next }) => {
  const parseResult = withMatchIdSchema.safeParse(input);

  if (!parseResult.success) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No matchId specified",
    });
  }

  const { matchId } = parseResult.data;
  const match = throwIfUndefined(matchStore.get(matchId), `Match with id ${matchId} not found`);

  if (match.type !== "match-in-setup") {
    throw new DispatchableError("Match is not in setup");
  }

  return next({
    ctx: {
      ...ctx,
      match,
    },
  });
});
