import { TRPCError } from "@trpc/server";
import type { Player } from "generated/browser";
import { prisma } from "server/prisma/prisma-client";
import { findOrThrow } from "shared/throw-helper";
import { z } from "zod";
import { t } from "../trpc-init";

export const withPlayerIdSchema = z.object<{
  playerId: z.ZodType<Player["id"]>;
}>({
  playerId: z.string(),
});

export const developmentPlayerNamePrefix = "[dev]";

export const playerMiddleware = t.middleware(async ({ ctx, next, input }) => {
  const parseResult = withPlayerIdSchema.safeParse(input);

  if (!parseResult.success || parseResult.data.playerId === "") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No playerId specified",
    });
  }

  const { playerId } = parseResult.data;
  const ownedPlayers = await prisma.player.findMany();
  const currentPlayer = findOrThrow(ownedPlayers, (p) => p.id === playerId);

  return next({
    ctx: {
      ...ctx,
      currentPlayer,
      ownedPlayers,
    },
  });
});

export const playerWithoutCurrentMiddleware = t.middleware(async ({ ctx, next }) => {
  const ownedPlayers = await prisma.player.findMany();

  return next({
    ctx: {
      ...ctx,
      ownedPlayers,
    },
  });
});
