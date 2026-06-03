import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import {
  gameDetailSelect,
  normalizeGameDetail,
  normalizeUserGameBet,
  userGameBetSelect,
  type GameDetailResponse,
} from "@/lib/api-types";

const gameIdSchema = z
  .string()
  .regex(/^[1-9]\d*$/)
  .transform(Number);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      {
        status: 401,
      }
    );
  }

  const { id } = await params;
  const parsedGameId = gameIdSchema.safeParse(id);
  if (!parsedGameId.success) {
    return NextResponse.json({ error: "Invalid game id" }, { status: 400 });
  }
  const gameId = parsedGameId.data;

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: gameDetailSelect,
  });

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const userBets = await prisma.bet.findMany({
    where: {
      gameId,
      userId: session.user.id,
    },
    orderBy: {
      placedAt: "desc",
    },
    select: userGameBetSelect,
  });

  const response: GameDetailResponse = {
    game: normalizeGameDetail(game),
    userBets: userBets.map(normalizeUserGameBet),
  };

  return NextResponse.json(response);
}
