import "dotenv/config";
import { GameStatus, prisma } from ".";
import { Keypair } from "@solana/web3.js";

const ONE_USDC = 1_000_000;

function usdc(amount: number) {
  return Math.round(amount * ONE_USDC);
}

async function main() {
  console.log("Starting seed...");

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
        walletAddress: "7xKXabc123DEF456ghi789jkl012mno345pq",
        totalBetsPlaced: 0,
        totalBetsWon: 0,
        totalBetsLost: 0,
        totalWagered: 0,
        totalPayout: 0,
        netEarnings: 0,
      },
    }),
    prisma.user.create({
      data: {
        id: "user_2",
        name: "Bob Wager",
        email: "bob@example.com",
        walletAddress: "4mRNxyz987UVW654tsr321qpo098nm76lk",
        totalBetsPlaced: 0,
        totalBetsWon: 0,
        totalBetsLost: 0,
        totalWagered: 0,
        totalPayout: 0,
        netEarnings: 0,
      },
    }),
    prisma.user.create({
      data: {
        id: "user_3",
        name: "Charlie Snake",
        email: "charlie@example.com",
        walletAddress: "9pQWdef456GHI789jkl012rst345uvw678",
        totalBetsPlaced: 0,
        totalBetsWon: 0,
        totalBetsLost: 0,
        totalWagered: 0,
        totalPayout: 0,
        netEarnings: 0,
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
      totalGames: 60,
      wins: 21,
      losses: 30,
      draws: 9,
      winRate: 35.0,
    },
    {
      id: "claude",
      name: "Claude",
      color: "#f97316",
      accent: "#d37100",
      totalGames: 60,
      wins: 18,
      losses: 33,
      draws: 9,
      winRate: 30.0,
    },
    {
      id: "openai",
      name: "OpenAI",
      color: "#34d399",
      accent: "#007d2c",
      totalGames: 60,
      wins: 27,
      losses: 24,
      draws: 9,
      winRate: 45.0,
    },
    {
      id: "gemini",
      name: "Gemini",
      color: "#a78bfa",
      accent: "#5934ff",
      totalGames: 60,
      wins: 15,
      losses: 36,
      draws: 9,
      winRate: 25.0,
    },
    {
      id: "grok",
      name: "Grok",
      color: "#f43f5e",
      accent: "#bf0016",
      totalGames: 60,
      wins: 12,
      losses: 39,
      draws: 9,
      winRate: 20.0,
    },
  ];

  const agents = [];
  for (const data of agentsData) {
    const agent = await prisma.agent.create({ data });
    agents.push(agent);
  }
  console.log("Agents created.");

  function makeEscrow() {
    const kp = Keypair.generate();
    return {
      escrowPublicKey: kp.publicKey.toBase58(),
      escrowEncryptedKey: JSON.stringify(Array.from(kp.secretKey)),
    };
  }

  const esc1 = makeEscrow();
  const esc2 = makeEscrow();
  const esc3 = makeEscrow();
  const esc4 = makeEscrow();
  const esc5 = makeEscrow();
  const esc8 = makeEscrow();
  const esc9 = makeEscrow();

  const now = new Date();
  const m = 60 * 100;

  const gamesData = [
    {
      name: "Phoenix Fury",
      status: GameStatus.ENDED,
      totalPool: usdc(0),
      winnerAgentId: "openai",
      bettingOpensAt: new Date(now.getTime() - 80 * m),
      bettingClosesAt: new Date(now.getTime() - 60 * m),
      startedAt: new Date(now.getTime() - 60 * m),
      endedAt: new Date(now.getTime() - 55 * m),
      ...esc1,

    },
    {
      name: "Velocity Vault",
      status: GameStatus.ENDED,
      totalPool: usdc(0),
      winnerAgentId: "deepseek",
      bettingOpensAt: new Date(now.getTime() - 140 * m),
      bettingClosesAt: new Date(now.getTime() - 120 * m),
      startedAt: new Date(now.getTime() - 120 * m),
      endedAt: new Date(now.getTime() - 114 * m),
      ...esc2,

    },
    {
      name: "Alpha Clash",
      status: GameStatus.LIVE,
      totalPool: usdc(0),
      bettingOpensAt: new Date(now.getTime() - 20 * m),
      bettingClosesAt: new Date(now.getTime() - 5 * m),
      startedAt: new Date(now.getTime() - 5 * m),
      ...esc3,

    },
    {
      name: "Beta Blitz",
      status: GameStatus.OPEN,
      totalPool: usdc(0),
      bettingOpensAt: new Date(now.getTime() - 5 * m),
      bettingClosesAt: new Date(now.getTime() + 12 * m),
      ...esc4,

    },
    {
      name: "Gamma Grid",
      status: GameStatus.OPEN,
      totalPool: usdc(0),
      bettingOpensAt: new Date(now.getTime() - 2 * m),
      bettingClosesAt: new Date(now.getTime() + 18 * m),
      ...esc5,

    },
    {
      name: "Delta Dash",
      status: GameStatus.UPCOMING,
      totalPool: usdc(0),
      bettingOpensAt: new Date(now.getTime() + 3 * m),
      bettingClosesAt: new Date(now.getTime() + 20 * m),
    },
    {
      name: "Epsilon Edge",
      status: GameStatus.UPCOMING,
      totalPool: usdc(0),
      bettingOpensAt: new Date(now.getTime() + 25 * m),
      bettingClosesAt: new Date(now.getTime() + 45 * m),
    },
    {
      name: "Zeta Zone",
      status: GameStatus.ENDED,
      totalPool: usdc(0),
      winnerAgentId: "gemini",
      bettingOpensAt: new Date(now.getTime() - 200 * m),
      bettingClosesAt: new Date(now.getTime() - 180 * m),
      startedAt: new Date(now.getTime() - 180 * m),
      endedAt: new Date(now.getTime() - 174 * m),
      ...esc8,

    },
    {
      name: "Theta Thunder",
      status: GameStatus.ENDED,
      totalPool: usdc(0),
      winnerAgentId: "claude",
      bettingOpensAt: new Date(now.getTime() - 300 * m),
      bettingClosesAt: new Date(now.getTime() - 280 * m),
      startedAt: new Date(now.getTime() - 280 * m),
      endedAt: new Date(now.getTime() - 273 * m),
      ...esc9,

    },
    {
      name: "Iota Impact",
      status: GameStatus.CANCELLED,
      totalPool: usdc(0),
      bettingOpensAt: new Date(now.getTime() - 400 * m),
      bettingClosesAt: new Date(now.getTime() - 380 * m),
      startedAt: new Date(now.getTime() - 378 * m),
      endedAt: new Date(now.getTime() - 370 * m),
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
