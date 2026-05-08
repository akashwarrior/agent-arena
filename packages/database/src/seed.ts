import { GameStatus, BetStatus, TransactionType, TransactionStatus, prisma } from ".";

async function main() {
  console.log("Starting seed...");

  // Clean up existing data
  await prisma.transaction.deleteMany();
  await prisma.bet.deleteMany();
  await prisma.agentGame.deleteMany();
  await prisma.game.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Users
  const user1 = await prisma.user.create({
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
  });

  const user2 = await prisma.user.create({
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
  });

  console.log("Users created.");

  // 2. Create Agents
  const agentsData = [
    { id: "deepseek", name: "DeepSeek", color: "#60a5fa", totalGames: 42, wins: 14, losses: 20, draws: 8, winRate: 33.3 },
    { id: "claude", name: "Claude", color: "#f97316", totalGames: 42, wins: 12, losses: 22, draws: 8, winRate: 28.6 },
    { id: "openai", name: "OpenAI", color: "#34d399", totalGames: 42, wins: 18, losses: 16, draws: 8, winRate: 42.9 },
    { id: "gemini", name: "Gemini", color: "#a78bfa", totalGames: 42, wins: 10, losses: 24, draws: 8, winRate: 23.8 },
    { id: "grok", name: "Grok", color: "#f43f5e", totalGames: 42, wins: 8, losses: 26, draws: 8, winRate: 19.0 },
  ];

  const agents = [];
  for (const data of agentsData) {
    const agent = await prisma.agent.create({ data });
    agents.push(agent);
  }
  console.log("Agents created.");

  // 3. Create Games
  const now = new Date();

  // Game 1: Ended
  const game1 = await prisma.game.create({
    data: {
      name: "Sigma Storm",
      status: GameStatus.ENDED,
      totalPool: 6780,
      winnerAgentId: "openai",
      bettingOpensAt: new Date(now.getTime() - 75 * 60 * 1000),
      bettingClosesAt: new Date(now.getTime() - 60 * 60 * 1000),
      startedAt: new Date(now.getTime() - 60 * 60 * 1000),
      endedAt: new Date(now.getTime() - 57 * 60 * 1000),
    },
  });

  // Game 2: Live
  const game2 = await prisma.game.create({
    data: {
      name: "Alpha Arena",
      status: GameStatus.LIVE,
      totalPool: 4350,
      bettingOpensAt: new Date(now.getTime() - 15 * 60 * 1000),
      bettingClosesAt: new Date(now.getTime() - 2 * 60 * 1000),
      startedAt: new Date(now.getTime() - 2 * 60 * 1000),
    },
  });

  // Game 3: Open
  const game3 = await prisma.game.create({
    data: {
      name: "Beta Blitz",
      status: GameStatus.OPEN,
      totalPool: 1200,
      bettingOpensAt: new Date(now.getTime() - 5 * 60 * 1000),
      bettingClosesAt: new Date(now.getTime() + 10 * 60 * 1000),
    },
  });

  // Link Agents to Games
  const games = [game1, game2, game3];
  for (const game of games) {
    for (const agent of agents) {
      await prisma.agentGame.create({
        data: {
          gameId: game.id,
          agentId: agent.id,
        },
      });
    }
  }
  console.log("Games created.");

  // 4. Create Bets & Transactions
  // Bet 1: Alice won on Game 1 (OpenAI)
  const bet1 = await prisma.bet.create({
    data: {
      userId: user1.id,
      gameId: game1.id,
      agentId: "openai",
      walletAddress: user1.walletAddress!,
      amount: 800,
      payout: 3800,
      status: BetStatus.WON,
      placedAt: new Date(now.getTime() - 65 * 60 * 1000),
      settledAt: new Date(now.getTime() - 57 * 60 * 1000),
      txHash: "tx_hash_1",
      payoutTxHash: "tx_hash_1_payout",
    },
  });

  await prisma.transaction.create({
    data: {
      userId: user1.id,
      betId: bet1.id,
      type: TransactionType.BET_PLACED,
      amount: 800,
      txHash: "tx_hash_1",
      status: TransactionStatus.CONFIRMED,
      confirmedAt: bet1.placedAt,
    },
  });

  await prisma.transaction.create({
    data: {
      userId: user1.id,
      betId: bet1.id,
      type: TransactionType.PAYOUT,
      amount: 3800,
      txHash: "tx_hash_1_payout",
      status: TransactionStatus.CONFIRMED,
      confirmedAt: bet1.settledAt,
    },
  });

  // Bet 2: Bob lost on Game 1 (DeepSeek)
  const bet2 = await prisma.bet.create({
    data: {
      userId: user2.id,
      gameId: game1.id,
      agentId: "deepseek",
      walletAddress: user2.walletAddress!,
      amount: 500,
      status: BetStatus.LOST,
      placedAt: new Date(now.getTime() - 62 * 60 * 1000),
      settledAt: new Date(now.getTime() - 57 * 60 * 1000),
      txHash: "tx_hash_2",
    },
  });

  await prisma.transaction.create({
    data: {
      userId: user2.id,
      betId: bet2.id,
      type: TransactionType.BET_PLACED,
      amount: 500,
      txHash: "tx_hash_2",
      status: TransactionStatus.CONFIRMED,
      confirmedAt: bet2.placedAt,
    },
  });

  // Bet 3: Alice pending on Game 2 (Claude)
  const bet3 = await prisma.bet.create({
    data: {
      userId: user1.id,
      gameId: game2.id,
      agentId: "claude",
      walletAddress: user1.walletAddress!,
      amount: 1000,
      status: BetStatus.PENDING,
      placedAt: new Date(now.getTime() - 5 * 60 * 1000),
      txHash: "tx_hash_3",
    },
  });

  await prisma.transaction.create({
    data: {
      userId: user1.id,
      betId: bet3.id,
      type: TransactionType.BET_PLACED,
      amount: 1000,
      txHash: "tx_hash_3",
      status: TransactionStatus.CONFIRMED,
      confirmedAt: bet3.placedAt,
    },
  });

  console.log("Bets and Transactions created.");
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
