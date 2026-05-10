import "dotenv/config";
import {
  GameStatus,
  BetStatus,
  TransactionType,
  TransactionStatus,
  prisma,
} from ".";

async function main() {
  console.log("Starting seed...");

  await prisma.transaction.deleteMany();
  await prisma.bet.deleteMany();
  await prisma.agentGame.deleteMany();
  await prisma.game.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.user.deleteMany();

  const users = await Promise.all([
    prisma.user.create({
      data: {
        id: "user_1",
        name: "Alice Bettor",
        email: "alice@example.com",
        walletAddress: "7xKXabc123DEF456ghi789",
        totalBetsPlaced: 20,
        totalBetsWon: 14,
        totalBetsLost: 6,
        totalWagered: 5000,
        totalPayout: 14250,
        netEarnings: 9250,
      },
    }),
    prisma.user.create({
      data: {
        id: "user_2",
        name: "Bob Wager",
        email: "bob@example.com",
        walletAddress: "4mRNxyz987UVW654tsr321",
        totalBetsPlaced: 18,
        totalBetsWon: 12,
        totalBetsLost: 6,
        totalWagered: 4500,
        totalPayout: 9810,
        netEarnings: 5310,
      },
    }),
    prisma.user.create({
      data: {
        id: "user_3",
        name: "Charlie Snake",
        email: "charlie@example.com",
        walletAddress: "9pQWdef456GHI789jkl012",
        totalBetsPlaced: 5,
        totalBetsWon: 2,
        totalBetsLost: 3,
        totalWagered: 1200,
        totalPayout: 1800,
        netEarnings: 600,
      },
    }),
  ]);
  console.log("Users created.");

  const agentsData = [
    {
      id: "deepseek",
      name: "DeepSeek",
      color: "#60a5fa",
      accent: "#006ff6",
      totalGames: 42,
      wins: 14,
      losses: 20,
      draws: 8,
      winRate: 33.3,
    },
    {
      id: "claude",
      name: "Claude",
      color: "#f97316",
      accent: "#d37100",
      totalGames: 42,
      wins: 12,
      losses: 22,
      draws: 8,
      winRate: 28.6,
    },
    {
      id: "openai",
      name: "OpenAI",
      color: "#34d399",
      accent: "#007d2c",
      totalGames: 42,
      wins: 18,
      losses: 16,
      draws: 8,
      winRate: 42.9,
    },
    {
      id: "gemini",
      name: "Gemini",
      color: "#a78bfa",
      accent: "#5934ff",
      totalGames: 42,
      wins: 10,
      losses: 24,
      draws: 8,
      winRate: 23.8,
    },
    {
      id: "grok",
      name: "Grok",
      color: "#f43f5e",
      accent: "#bf0016",
      totalGames: 42,
      wins: 8,
      losses: 26,
      draws: 8,
      winRate: 19.0,
    },
  ];

  const agents = [];
  for (const data of agentsData) {
    const agent = await prisma.agent.create({ data });
    agents.push(agent);
  }
  console.log("Agents created.");

  const now = new Date();
  const min = 60 * 1000;

  const gamesData = [
    {
      name: "Sigma Storm",
      status: GameStatus.ENDED,
      totalPool: 6780,
      winnerAgentId: "openai",
      bettingOpensAt: new Date(now.getTime() - 75 * min),
      bettingClosesAt: new Date(now.getTime() - 60 * min),
      startedAt: new Date(now.getTime() - 60 * min),
      endedAt: new Date(now.getTime() - 57 * min),
    },
    {
      name: "Alpha Arena",
      status: GameStatus.LIVE,
      totalPool: 4350,
      bettingOpensAt: new Date(now.getTime() - 15 * min),
      bettingClosesAt: new Date(now.getTime() - 2 * min),
      startedAt: new Date(now.getTime() - 2 * min),
    },
    {
      name: "Beta Blitz",
      status: GameStatus.UPCOMING,
      totalPool: 1200,
      bettingOpensAt: new Date(now.getTime() + 30 * 1000),
      bettingClosesAt: new Date(now.getTime() + 90 * 1000),
    },
    {
      name: "Gamma Grid",
      status: GameStatus.OPEN,
      totalPool: 890,
      bettingOpensAt: new Date(now.getTime() - 3 * min),
      bettingClosesAt: new Date(now.getTime() + 15 * min),
    },
    {
      name: "Delta Dash",
      status: GameStatus.UPCOMING,
      totalPool: 0,
      bettingOpensAt: new Date(now.getTime() + 20 * min),
      bettingClosesAt: new Date(now.getTime() + 35 * min),
    },
    {
      name: "Epsilon Edge",
      status: GameStatus.ENDED,
      totalPool: 3200,
      winnerAgentId: "deepseek",
      bettingOpensAt: new Date(now.getTime() - 120 * min),
      bettingClosesAt: new Date(now.getTime() - 105 * min),
      startedAt: new Date(now.getTime() - 105 * min),
      endedAt: new Date(now.getTime() - 100 * min),
    },
    {
      name: "Zeta Zone",
      status: GameStatus.ENDED,
      totalPool: 2100,
      winnerAgentId: "claude",
      bettingOpensAt: new Date(now.getTime() - 180 * min),
      bettingClosesAt: new Date(now.getTime() - 165 * min),
      startedAt: new Date(now.getTime() - 165 * min),
      endedAt: new Date(now.getTime() - 160 * min),
    },
    {
      name: "Eta Echo",
      status: GameStatus.ENDED,
      totalPool: 5500,
      winnerAgentId: "gemini",
      bettingOpensAt: new Date(now.getTime() - 240 * min),
      bettingClosesAt: new Date(now.getTime() - 225 * min),
      startedAt: new Date(now.getTime() - 225 * min),
      endedAt: new Date(now.getTime() - 220 * min),
    },
    {
      name: "Theta Thunder",
      status: GameStatus.ENDED,
      totalPool: 4100,
      winnerAgentId: "grok",
      bettingOpensAt: new Date(now.getTime() - 300 * min),
      bettingClosesAt: new Date(now.getTime() - 285 * min),
      startedAt: new Date(now.getTime() - 285 * min),
      endedAt: new Date(now.getTime() - 280 * min),
    },
    {
      name: "Iota Impact",
      status: GameStatus.ENDED,
      totalPool: 7800,
      winnerAgentId: "openai",
      bettingOpensAt: new Date(now.getTime() - 360 * min),
      bettingClosesAt: new Date(now.getTime() - 345 * min),
      startedAt: new Date(now.getTime() - 345 * min),
      endedAt: new Date(now.getTime() - 340 * min),
    },
  ];

  const games = [];
  for (const data of gamesData) {
    const game = await prisma.game.create({ data });
    games.push(game);
    for (const agent of agents) {
      await prisma.agentGame.create({
        data: { gameId: game.id, agentId: agent.id },
      });
    }
  }
  console.log("Games created.");

  const bets = await Promise.all([
    prisma.bet.create({
      data: {
        userId: users[0].id,
        gameId: games[0].id,
        agentId: "openai",
        walletAddress: users[0].walletAddress!,
        amount: 800,
        payout: 3800,
        status: BetStatus.WON,
        placedAt: new Date(now.getTime() - 65 * min),
        settledAt: new Date(now.getTime() - 57 * min),
        txHash: "tx_001",
        payoutTxHash: "tx_001_payout",
      },
    }),
    prisma.bet.create({
      data: {
        userId: users[1].id,
        gameId: games[0].id,
        agentId: "deepseek",
        walletAddress: users[1].walletAddress!,
        amount: 500,
        status: BetStatus.LOST,
        placedAt: new Date(now.getTime() - 62 * min),
        settledAt: new Date(now.getTime() - 57 * min),
        txHash: "tx_002",
      },
    }),
    prisma.bet.create({
      data: {
        userId: users[0].id,
        gameId: games[1].id,
        agentId: "claude",
        walletAddress: users[0].walletAddress!,
        amount: 1000,
        status: BetStatus.PENDING,
        placedAt: new Date(now.getTime() - 5 * min),
        txHash: "tx_003",
      },
    }),
    prisma.bet.create({
      data: {
        userId: users[1].id,
        gameId: games[1].id,
        agentId: "openai",
        walletAddress: users[1].walletAddress!,
        amount: 750,
        status: BetStatus.PENDING,
        placedAt: new Date(now.getTime() - 4 * min),
        txHash: "tx_004",
      },
    }),
    prisma.bet.create({
      data: {
        userId: users[2].id,
        gameId: games[2].id,
        agentId: "gemini",
        walletAddress: users[2].walletAddress!,
        amount: 300,
        status: BetStatus.PENDING,
        placedAt: new Date(now.getTime() - 2 * min),
        txHash: "tx_005",
      },
    }),
    prisma.bet.create({
      data: {
        userId: users[0].id,
        gameId: games[5].id,
        agentId: "deepseek",
        walletAddress: users[0].walletAddress!,
        amount: 600,
        payout: 2400,
        status: BetStatus.WON,
        placedAt: new Date(now.getTime() - 110 * min),
        settledAt: new Date(now.getTime() - 100 * min),
        txHash: "tx_006",
        payoutTxHash: "tx_006_payout",
      },
    }),
    prisma.bet.create({
      data: {
        userId: users[1].id,
        gameId: games[6].id,
        agentId: "claude",
        walletAddress: users[1].walletAddress!,
        amount: 400,
        payout: 1600,
        status: BetStatus.WON,
        placedAt: new Date(now.getTime() - 170 * min),
        settledAt: new Date(now.getTime() - 160 * min),
        txHash: "tx_007",
        payoutTxHash: "tx_007_payout",
      },
    }),
    prisma.bet.create({
      data: {
        userId: users[2].id,
        gameId: games[7].id,
        agentId: "grok",
        walletAddress: users[2].walletAddress!,
        amount: 200,
        status: BetStatus.LOST,
        placedAt: new Date(now.getTime() - 230 * min),
        settledAt: new Date(now.getTime() - 220 * min),
        txHash: "tx_008",
      },
    }),
  ]);
  console.log("Bets created.");

  for (const bet of bets) {
    await prisma.transaction.create({
      data: {
        userId: bet.userId,
        betId: bet.id,
        type: TransactionType.BET_PLACED,
        amount: bet.amount,
        txHash: bet.txHash!,
        status: TransactionStatus.CONFIRMED,
        confirmedAt: bet.placedAt,
      },
    });
    if (bet.payout) {
      await prisma.transaction.create({
        data: {
          userId: bet.userId,
          betId: bet.id,
          type: TransactionType.PAYOUT,
          amount: bet.payout,
          txHash: bet.payoutTxHash!,
          status: TransactionStatus.CONFIRMED,
          confirmedAt: bet.settledAt!,
        },
      });
    }
  }
  console.log("Transactions created.");
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
