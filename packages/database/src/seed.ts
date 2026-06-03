import "dotenv/config";
import { prisma } from ".";
import { PublicKey } from "@solana/web3.js";

const GAME_NAMES = [
  "Phoenix Fury",
  "Velocity Vault",
  "Alpha Clash",
  "Beta Blitz",
  "Gamma Grid",
  "Delta Dash",
  "Epsilon Edge",
  "Zeta Zone",
  "Theta Thunder",
  "Iota Impact",
  "Kappa Krush",
  "Sigma Storm",
  "Omega Onslaught",
  "Nova Nexus",
  "Rift Rumble",
  "Void Vortex",
];

function getNetwork(): "DEVNET" | "MAINNET" {
  return process.env.MAINNET_LIVE === "true" ? "MAINNET" : "DEVNET";
}

function getPlatformFeeBps() {
  const feeBps = Number(process.env.NEXT_PUBLIC_PLATFORM_FEE_BPS ?? 100);

  if (!Number.isInteger(feeBps) || feeBps < 0 || feeBps > 10_000) {
    throw new Error("NEXT_PUBLIC_PLATFORM_FEE_BPS must be between 0 and 10000");
  }

  return feeBps;
}

function getRequiredPublicKeyEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Set ${name} before seeding`);
  }

  try {
    return new PublicKey(value).toBase58();
  } catch {
    throw new Error(`${name} must be a valid Solana public key`);
  }
}

function getUsdcMint() {
  return getRequiredPublicKeyEnv("NEXT_PUBLIC_USDC_MINT");
}

function getEscrowPublicKey() {
  return getRequiredPublicKeyEnv("SHARED_ESCROW_PUBLIC_KEY");
}

function getEscrowTokenAccount() {
  return getRequiredPublicKeyEnv("SHARED_ESCROW_USDC_TOKEN_ACCOUNT");
}

async function main() {
  const network = getNetwork();
  const usdcMint = getUsdcMint();
  const escrowPublicKey = getEscrowPublicKey();
  const escrowTokenAccount = getEscrowTokenAccount();
  const feeBps = getPlatformFeeBps();

  await prisma.$connect();

  console.log("Starting seed...");

  await prisma.payment.updateMany({
    data: {
      betId: null,
      gameParticipantId: null,
      settlementEntryId: null,
      userId: null,
    },
  });
  await prisma.settlementEntry.updateMany({
    data: {
      betId: null,
      gameParticipantId: null,
      userId: null,
    },
  });
  await prisma.game.updateMany({
    data: { winnerParticipantId: null },
  });
  await prisma.bet.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.settlementEntry.deleteMany();
  await prisma.gameSettlement.deleteMany();
  await prisma.gameParticipant.deleteMany();
  await prisma.game.deleteMany();
  await prisma.escrowAccount.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.user.deleteMany();

  const escrowAccount = await prisma.escrowAccount.create({
    data: {
      network,
      publicKey: escrowPublicKey,
      tokenAccount: escrowTokenAccount,
      usdcMintAddress: usdcMint,
      usdcDecimals: 6,
    },
  });

  console.log(`USDC mint seeded: ${usdcMint} (${network})`);
  console.log(`Escrow seeded: ${escrowAccount.publicKey}`);

  const agentsData = [
    { id: "deepseek", name: "DeepSeek", color: "#60a5fa", accent: "#006ff6" },
    { id: "claude", name: "Claude", color: "#f97316", accent: "#d37100" },
    { id: "openai", name: "OpenAI", color: "#34d399", accent: "#007d2c" },
    { id: "gemini", name: "Gemini", color: "#a78bfa", accent: "#5934ff" },
    { id: "grok", name: "Grok", color: "#f43f5e", accent: "#bf0016" },
  ];

  const agents = [];
  for (const data of agentsData) {
    const agent = await prisma.agent.create({ data });
    agents.push(agent);
  }
  console.log(`${agents.length} agents created.`);

  for (const name of GAME_NAMES) {
    const game = await prisma.game.create({
      data: {
        name,
        status: "UPCOMING",
        escrowAccountId: escrowAccount.id,
        feeBps,
        participants: {
          create: agents.map((agent, position) => ({
            agentId: agent.id,
            position: position + 1,
          })),
        },
      },
    });
    console.log(`Game created: ${game.name} (${game.id}, ${game.status})`);
  }

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
