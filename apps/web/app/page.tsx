import { GameStatus, prisma } from "@repo/db";
import { LandingPage, type LandingData } from "@/components/landing-page";
import { gameListSelect, normalizeGameListItem } from "@/lib/api-types";

export const revalidate = 3600;

const ACTIVE_GAME_STATUSES = [GameStatus.LIVE, GameStatus.UPCOMING] as const;

function shortenAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function usdcFromBaseUnits(amount: bigint) {
  return Number(amount) / 1e6;
}

function payoutMultiplier(totalPayout: bigint, totalWagered: bigint) {
  if (totalWagered <= BigInt(0)) return null;
  return Number((totalPayout * BigInt(100)) / totalWagered) / 100;
}

type LandingPayoutBet = {
  amount: bigint;
  payoutAmount: bigint | null;
  settlementEntries: Array<{
    amount: bigint;
  }>;
};

function getEffectivePayoutAmount(bet: LandingPayoutBet) {
  if (bet.payoutAmount !== null) return bet.payoutAmount;

  return bet.settlementEntries.reduce(
    (sum, entry) => sum + entry.amount,
    BigInt(0)
  );
}

function getPlatformFeeBps() {
  const feeBps = Number(process.env.NEXT_PUBLIC_PLATFORM_FEE_BPS ?? 100);
  return Number.isInteger(feeBps) && feeBps >= 0 && feeBps <= 10_000
    ? feeBps
    : 100;
}

async function getLandingData(): Promise<LandingData> {
  const [
    activeMatchCount,
    liveMatchCount,
    totalWageredAgg,
    uniqueBettors,
    recentPayouts,
    recentBets,
    matches,
    agents,
  ] = await Promise.all([
    prisma.game.count({
      where: { status: { in: [...ACTIVE_GAME_STATUSES] } },
    }),
    prisma.game.count({
      where: { status: GameStatus.LIVE },
    }),
    prisma.bet.aggregate({
      where: { status: { not: "REFUNDED" } },
      _sum: { amount: true },
    }),
    prisma.bet.groupBy({
      by: ["userId"],
      where: { status: { not: "REFUNDED" } },
    }),
    prisma.payment.findMany({
      where: {
        type: "PAYOUT",
        status: "CONFIRMED",
      },
      orderBy: [{ confirmedAt: "desc" }, { createdAt: "desc" }],
      take: 6,
      select: {
        id: true,
        amount: true,
        toAddress: true,
        confirmedAt: true,
        createdAt: true,
        gameParticipant: {
          select: {
            agent: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.bet.findMany({
      where: { status: { not: "REFUNDED" } },
      orderBy: { placedAt: "desc" },
      take: 8,
      select: {
        id: true,
        amount: true,
        placedAt: true,
        gameId: true,
        depositPayment: {
          select: {
            fromAddress: true,
          },
        },
        gameParticipant: {
          select: {
            agent: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.game.findMany({
      where: { status: { in: [...ACTIVE_GAME_STATUSES] } },
      orderBy: { id: "asc" },
      take: 3,
      select: gameListSelect,
    }),
    prisma.agent.findMany({
      select: {
        id: true,
        name: true,
        participants: {
          select: {
            status: true,
            bets: {
              where: { status: { not: "REFUNDED" } },
              select: {
                amount: true,
                payoutAmount: true,
                settlementEntries: {
                  where: {
                    type: "PAYOUT",
                    status: { not: "FAILED" },
                  },
                  select: {
                    amount: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  const payoutBets = agents.flatMap((agent) =>
    agent.participants.flatMap((participant) =>
      participant.bets.filter(
        (bet) => getEffectivePayoutAmount(bet) > BigInt(0)
      )
    )
  );
  const totalPayout = payoutBets.reduce(
    (sum, bet) => sum + getEffectivePayoutAmount(bet),
    BigInt(0)
  );
  const totalWageredOnPayouts = payoutBets.reduce(
    (sum, bet) => sum + bet.amount,
    BigInt(0)
  );

  const leaderboard = agents
    .map((agent) => {
      const settledMatches = agent.participants.filter(
        (participant) =>
          participant.status === "WINNER" || participant.status === "LOSER"
      );
      const wins = settledMatches.filter(
        (participant) => participant.status === "WINNER"
      ).length;
      const winningBets = agent.participants.flatMap((participant) =>
        participant.bets.filter(
          (bet) => getEffectivePayoutAmount(bet) > BigInt(0)
        )
      );
      const totalWageredOnWins = winningBets.reduce(
        (sum, bet) => sum + bet.amount,
        BigInt(0)
      );
      const totalWon = winningBets.reduce(
        (sum, bet) => sum + getEffectivePayoutAmount(bet),
        BigInt(0)
      );

      return {
        id: agent.id,
        name: agent.name,
        matches: settledMatches.length,
        winRate:
          settledMatches.length === 0
            ? 0
            : (wins / settledMatches.length) * 100,
        totalWon: usdcFromBaseUnits(totalWon),
        avgPayout: payoutMultiplier(totalWon, totalWageredOnWins),
      };
    })
    .filter((agent) => agent.matches > 0)
    .sort((a, b) => {
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      return b.totalWon - a.totalWon;
    })
    .slice(0, 6)
    .map((agent, index) => ({
      rank: index + 1,
      ...agent,
    }));

  return {
    currentYear: new Date().getFullYear(),
    feeBps: getPlatformFeeBps(),
    stats: {
      activeMatchCount,
      liveMatchCount,
      totalWagered: usdcFromBaseUnits(totalWageredAgg._sum.amount ?? BigInt(0)),
      uniqueBettorCount: uniqueBettors.length,
      avgPayout: payoutMultiplier(totalPayout, totalWageredOnPayouts),
    },
    recentPayouts: recentPayouts.map((payout) => ({
      id: payout.id,
      user: shortenAddress(payout.toAddress),
      agent: payout.gameParticipant?.agent.name ?? "Unknown",
      amount: usdcFromBaseUnits(payout.amount),
      paidAt: (payout.confirmedAt ?? payout.createdAt).toISOString(),
    })),
    recentBets: recentBets.map((bet) => ({
      id: bet.id,
      user: shortenAddress(bet.depositPayment.fromAddress),
      agent: bet.gameParticipant.agent.name,
      amount: usdcFromBaseUnits(bet.amount),
      gameId: bet.gameId,
      placedAt: bet.placedAt.toISOString(),
    })),
    matches: matches.map(normalizeGameListItem),
    leaderboard,
  };
}

export default async function HomePage() {
  const landing = await getLandingData();
  return <LandingPage landing={landing} />;
}
