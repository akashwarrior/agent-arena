import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    // TODO: fix authorisation message/code by reusing from one place
    return NextResponse.json(
      {
        error: "Unauthorised",
      },
      {
        status: 404,
      }
    );
  }

  const { id } = await params;

  const idNum = Number(id);
  if (!Number.isInteger(idNum) || idNum <= 0) {
    return NextResponse.json({ error: "Invalid game id" }, { status: 400 });
  }

  const game = await prisma.game.findUnique({
    where: { id: idNum },
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

  const userBets = await prisma.bet.findMany({
    where: {
      gameId: idNum,
      userId: session.user.id,
    },
  });

  return NextResponse.json({
    game: {
      id: game.id,
      name: game.name,
      status: game.status,
      startedAt: game.startedAt,
      endedAt: game.endedAt,
      winnerAgentId: game.winnerAgentId,
      winner: game.winner,
      createdAt: game.createdAt,
      updatedAt: game.updatedAt,
      agents: game.agents.map((ag) => ag.agent),
      totalPool: Number(game.totalPool) / 1e6,
      feeAmount: game.feeAmount ? Number(game.feeAmount) / 1e6 : null,
    },
    userBets: userBets.map((b) => ({
      id: b.id,
      userId: b.userId,
      agentId: b.agentId,
      gameId: b.gameId,
      status: b.status,
      placedAt: b.placedAt,
      walletAddress: b.walletAddress,
      txHash: b.txHash,
      payoutTxHash: b.payoutTxHash,
      settledAt: b.settledAt,
      amount: Number(b.amount) / 1e6,
      payout: b.payout ? Number(b.payout) / 1e6 : null,
    })),
  });
}
