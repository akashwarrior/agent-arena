import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function parseLimit(value: string | null): number {
  if (!value) return DEFAULT_LIMIT;

  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return DEFAULT_LIMIT;

  return Math.min(Math.max(parsed, 1), MAX_LIMIT);
}

export async function GET(request: NextRequest) {
  const limit = parseLimit(request.nextUrl.searchParams.get("limit"));

  const bets = await prisma.bet.findMany({
    orderBy: {
      placedAt: "desc",
    },
    take: limit,
    select: {
      id: true,
      amount: true,
      placedAt: true,
      agent: {
        select: {
          id: true,
          name: true,
          color: true,
          accent: true,
        },
      },
      game: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
    },
  });

  return NextResponse.json({
    activities: bets.map((bet) => ({
      id: bet.id,
      amount: Number(bet.amount) / 1e6,
      placedAt: bet.placedAt,
      agent: bet.agent,
      game: bet.game,
    })),
  });
}
