import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { usdcBaseUnitsToNumber } from "@/lib/usdc";
import {
  leaderboardUserSelect,
  type LeaderboardResponse,
} from "@/lib/api-types";

export async function GET() {
  const users = await prisma.user.findMany({
    select: leaderboardUserSelect,
  });

  const leaderboard: LeaderboardResponse["leaderboard"] = users
    .map((user) => {
      const settledOrActiveBets = user.bets.filter(
        (bet) => bet.status !== "REFUNDED"
      );
      const totalWagered = settledOrActiveBets.reduce(
        (sum, bet) => sum + bet.amount,
        BigInt(0)
      );
      const totalPayout = settledOrActiveBets.reduce(
        (sum, bet) => sum + (bet.payoutAmount ?? BigInt(0)),
        BigInt(0)
      );

      return {
        id: user.id,
        name: user.name,
        totalBetsPlaced: settledOrActiveBets.length,
        totalBetsWon: settledOrActiveBets.filter((bet) => bet.status === "WON")
          .length,
        totalBetsLost: settledOrActiveBets.filter(
          (bet) => bet.status === "LOST"
        ).length,
        totalWagered,
        totalPayout,
        netEarnings: totalPayout - totalWagered,
      };
    })
    .filter((user) => user.totalBetsPlaced > 0)
    .sort((a, b) => {
      if (a.totalWagered === b.totalWagered) return 0;
      return a.totalWagered > b.totalWagered ? -1 : 1;
    })
    .slice(0, 5)
    .map((user, index) => ({
      rank: index + 1,
      id: user.id,
      name: user.name,
      totalBetsPlaced: user.totalBetsPlaced,
      totalBetsWon: user.totalBetsWon,
      totalBetsLost: user.totalBetsLost,
      totalWagered: usdcBaseUnitsToNumber(user.totalWagered),
      totalPayout: usdcBaseUnitsToNumber(user.totalPayout),
      netEarnings: usdcBaseUnitsToNumber(user.netEarnings),
    }));

  const response: LeaderboardResponse = { leaderboard };

  return NextResponse.json(response);
}
