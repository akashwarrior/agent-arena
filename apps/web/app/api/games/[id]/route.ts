import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const game = await prisma.game.findUnique({
    where: { id },
    include: {
      agents: {
        include: {
          agent: true,
        },
      },
      winner: true,
    },
  });

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  let userBet = null;
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (session?.user) {
      userBet = await prisma.bet.findFirst({
        where: {
          gameId: id,
          userId: session.user.id,
        },
      });
    }
  } catch {
    // no session, no bet
  }

  return NextResponse.json({
    game: {
      ...game,
      agents: game.agents.map((ag) => ag.agent),
      totalPool: game.totalPool / 1e6,
    },
    userBet: userBet
      ? {
          ...userBet,
          amount: userBet.amount / 1e6,
          payout: userBet.payout ? userBet.payout / 1e6 : null,
        }
      : null,
  });
}
