import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

const PAGE_SIZE = 15;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const cursor = searchParams.get("cursor");
  const limit = parseInt(searchParams.get("limit") || String(PAGE_SIZE));

  const games = await prisma.game.findMany({
    where: {
      status: {
        in: ["LIVE", "UPCOMING", "OPEN"],
      },
    },
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { createdAt: "asc" },
    include: {
      agents: {
        include: {
          agent: true,
        },
      },
      winner: true,
    },
  });

  let nextCursor: string | null = null;
  if (games.length > limit) {
    const nextItem = games.pop();
    nextCursor = nextItem!.id;
  }

  const normalizedGames = games.map((game) => ({
    ...game,
    agents: game.agents.map((ag) => ag.agent),
    totalPool: game.totalPool / 1e9,
  }));

  return NextResponse.json({
    games: normalizedGames,
    nextCursor,
  });
}
