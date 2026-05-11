import { NextRequest, NextResponse } from "next/server";
import type { Agent } from "@repo/types";
import { resolveGameEscrow } from "@/lib/escrow";
import { PublicKey } from "@solana/web3.js";
import { prisma } from "@repo/db";

const FEE_BPS = parseInt(process.env.NEXT_PUBLIC_PLATFORM_FEE_BPS ?? "100", 10);
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

export async function POST(req: NextRequest) {
  try {
    if (INTERNAL_API_KEY) {
      const authHeader = req.headers.get("x-api-key");
      if (authHeader !== INTERNAL_API_KEY) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await req.json();
    const { gameId, agentRanks } = body as { gameId: number; agentRanks: Agent[] };

    if (!gameId || !agentRanks?.length) {
      return NextResponse.json({ error: "gameId and agentRanks required" }, { status: 400 });
    }

    const [game, bets] = await Promise.all([
      prisma.game.update({
        where: { id: gameId },
        data: { status: "ENDED" },
        select: { totalPool: true },
      }),
      prisma.bet.findMany({
        where: { gameId, status: "PENDING" },
        include: { user: true },
      }),
    ]);

    if (bets.length === 0) {
      return NextResponse.json({ resolved: false, reason: "no_bets" });
    }

    const sorted = [...agentRanks].sort((a, b) => {
      if (a.alive !== b.alive) return a.alive ? -1 : 1;
      return b.score - a.score;
    });

    let winningAgentId: string | null = null;
    for (const agent of sorted) {
      if (bets.some((b) => b.agentId === agent.id)) {
        winningAgentId = agent.id;
        break;
      }
    }

    const winningBets = bets.filter((b) => b.agentId === winningAgentId);
    const losingBets = bets.filter((b) => b.agentId !== winningAgentId);

    const totalPool = Number(game.totalPool);
    const feeAmount = Math.floor((totalPool * FEE_BPS) / 10_000);
    const payoutPool = totalPool - feeAmount;
    const perWinnerPayout = Math.ceil(payoutPool / winningBets.length);

    const validEntrants: { walletAddress: string; betAmount: number; payoutAmount: number }[] = [];
    const entrantByBetId = new Map<string, boolean>();

    for (const bet of winningBets) {
      try {
        // Validate wallet address
        new PublicKey(bet.walletAddress);

        entrantByBetId.set(bet.id, true);
        validEntrants.push({
          walletAddress: bet.walletAddress,
          betAmount: Number(bet.amount),
          payoutAmount: perWinnerPayout,
        });
      } catch {
        // do nothing
      }
    }

    const { winnerTxIds, totalFee: actualFee } = await resolveGameEscrow({
      winners: validEntrants,
      totalPool: totalPool,
      feeAmount: feeAmount,
    });

    let txIdx = 0;
    const dbWrites = [];

    for (const bet of winningBets) {
      const payoutTxHash = entrantByBetId.get(bet.id) ? winnerTxIds[txIdx++] ?? null : null;

      dbWrites.push(
        prisma.bet.update({
          where: { id: bet.id },
          data: { status: "WON", payout: perWinnerPayout, payoutTxHash, settledAt: new Date() },
        }),
        prisma.user.update({
          where: { id: bet.userId },
          data: {
            totalBetsWon: { increment: 1 },
            totalPayout: { increment: perWinnerPayout },
            netEarnings: { increment: perWinnerPayout - Number(bet.amount) },
          },
        }),
      );
    }

    for (const bet of losingBets) {
      dbWrites.push(
        prisma.bet.update({
          where: { id: bet.id },
          data: { status: "LOST", settledAt: new Date() },
        }),
        prisma.user.update({
          where: { id: bet.userId },
          data: { totalBetsLost: { increment: 1 } },
        }),
      );
    }

    const allAgentIds = new Set([...winningBets, ...losingBets].map((b) => b.agentId));
    for (const agentId of allAgentIds) {
      const isWinner = agentId === winningAgentId;
      dbWrites.push(
        prisma.agent.update({
          where: { id: agentId },
          data: {
            wins: isWinner ? { increment: 1 } : undefined,
            losses: isWinner ? undefined : { increment: 1 },
            totalGames: { increment: 1 },
          },
        }),
      );
    }

    dbWrites.push(
      prisma.game.update({
        where: { id: gameId },
        data: { feeAmount: actualFee },
      }),
    );

    await Promise.all(dbWrites);

    const updatedAgents = await prisma.agent.findMany({
      where: { id: { in: Array.from(allAgentIds) } },
    });

    await Promise.all(
      updatedAgents.map((agent) => {
        const total = agent.wins + agent.losses;
        return prisma.agent.update({
          where: { id: agent.id },
          data: { winRate: total > 0 ? (agent.wins / total) * 100 : null },
        });
      }),
    );

    return NextResponse.json({
      resolved: true,
      winningAgentId,
      winningBets: winningBets.length,
      losingBets: losingBets.length,
      totalPayout: payoutPool,
      platformFee: actualFee,
      payoutTxIds: winnerTxIds,
    });
  } catch (error) {
    console.error("[resolve] error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Resolution failed" },
      { status: 500 },
    );
  }
}
