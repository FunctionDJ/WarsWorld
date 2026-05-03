import type { Player } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { prisma } from "server/prisma/prisma-client";
import { z } from "zod";
import { t } from "../trpc-init";

export const withPlayerIdSchema = z.object<{
  playerId: z.ZodType<Player["id"]>;
}>({
  playerId: z.string(),
});

export const developmentPlayerNamePrefix = "[dev]";

const getLoggedInUserPlayers = (session: unknown) => {
  throw new Error("stub");

  if (typeof session?.user?.name !== "string") {
    return [];
  }

  return prisma.player.findMany({
    where: {
      user: {
        name: session.user.name,
      },
    },
  });
};

export const playerMiddleware = t.middleware(async ({ ctx, next, input }) => {
  const parseResult = withPlayerIdSchema.safeParse(input);

  if (!parseResult.success || parseResult.data.playerId === "") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No playerId specified",
    });
  }

  const { playerId } = parseResult.data;

  const ownedPlayers = await getLoggedInUserPlayers(ctx.session);

  const currentPlayer = ownedPlayers.find((p) => p.id === playerId);

  if (currentPlayer === undefined) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `You used playerId ${playerId} but you don't own that player.`,
    });
  }

  return next({
    ctx: {
      ...ctx,
      currentPlayer,
      ownedPlayers,
    },
  });
});

export const playerWithoutCurrentMiddleware = t.middleware(async ({ ctx, next }) => {
  const ownedPlayers = await getLoggedInUserPlayers(ctx.session);

  return next({
    ctx: {
      ...ctx,
      ownedPlayers,
    },
  });
});
