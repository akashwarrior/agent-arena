import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  verifyUSDCDeposit,
  getSharedEscrowUSDCAddress,
  getSharedEscrowPublicKey,
} from "@/lib/escrow";

const PAGE_SIZE = 20;
const MAX_BET_USDC = 10000;
const AGENT_SERVER_URL = process.env.AGENT_SERVER_URL ?? "http://localhost:3001";

const fetchHeaders: Record<string, string> = {
  "x-api-key": process.env.INTERNAL_API_KEY as string,
} as const;

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const cursor = searchParams.get("cursor");
  const rawLimit = parseInt(searchParams.get("limit") || String(PAGE_SIZE));
  const limit = Math.min(Math.max(rawLimit || PAGE_SIZE, 1), 100);

  const bets = await prisma.bet.findMany({
    where: { userId: session.user.id },
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { placedAt: "desc" },
    include: {
      game: true,
      agent: true,
    },
  });

  let nextCursor: string | null = null;
  if (bets.length > limit) {
    const nextItem = bets.pop();
    nextCursor = nextItem!.id;
  }

  const normalizedBets = bets.map((bet) => ({
    ...bet,
    amount: Number(bet.amount) / 1e6,
    payout: bet.payout ? Number(bet.payout) / 1e6 : null,
    game: {
      ...bet.game,
      totalPool: Number(bet.game.totalPool) / 1e6,
      feeAmount: bet.game.feeAmount ? Number(bet.game.feeAmount) / 1e6 : null,
    }
  }));

  return NextResponse.json({
    bets: normalizedBets,
    nextCursor,
  });
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { gameId, agentId, amount } = body;

  if (!gameId || !agentId || amount == null) {
    return NextResponse.json(
      { error: "Missing required fields: gameId, agentId, amount" },
      { status: 400 }
    );
  }

  const amountNum = Number(amount);
  if (isNaN(amountNum) || amountNum <= 0 || !Number.isFinite(amountNum)) {
    return NextResponse.json(
      { error: "Invalid bet amount. Must be a positive number." },
      { status: 400 }
    );
  }

  if (amountNum > MAX_BET_USDC) {
    return NextResponse.json(
      { error: `Bet amount exceeds maximum of ${MAX_BET_USDC} USDC` },
      { status: 400 }
    );
  }

  const [game, existingBet] = await Promise.all([
    prisma.game.findUnique({
      where: { id: gameId },
      include: { agents: true },
    }),
    prisma.bet.findFirst({
      where: { gameId, userId: session.user.id, agentId },
    }),
  ]);

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  if (game.status !== "LIVE") {
    return NextResponse.json(
      { error: "Betting is only open during live matches" },
      { status: 400 }
    );
  }

  if (existingBet) {
    return NextResponse.json(
      { error: "Already placed a bet on this agent" },
      { status: 409 }
    );
  }

  const escrowPublicKey = getSharedEscrowPublicKey();
  const escrowUSDCAddress = await getSharedEscrowUSDCAddress();

  if (!escrowPublicKey || !escrowUSDCAddress) {
    return NextResponse.json(
      { error: "Escrow not configured. Contact support." },
      { status: 500 }
    );
  }

  const usdcBase = Math.round(amountNum * 1e6);

  return NextResponse.json({
    escrowUSDCAddress,
    usdcAmount: usdcBase,
  });
}

export async function PATCH(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { gameId, agentId, walletAddress, txHash } = body;

  if (!gameId || !agentId || !walletAddress || !txHash) {
    return NextResponse.json(
      { error: "gameId, agentId, walletAddress, and txHash are required" },
      { status: 400 }
    );
  }

  const [existingBet, game] = await Promise.all([
    prisma.bet.findFirst({
      where: { gameId, userId: session.user.id, agentId },
      select: {
        id: true,
      }
    }),
    prisma.game.findUnique({
      where: { id: gameId },
      select: {
        status: true,
      }
    }),
  ]);

  if (game?.status !== "LIVE") {
    return NextResponse.json(
      { error: "Betting is only open during live matches" },
      { status: 400 }
    );
  }

  if (existingBet) {
    return NextResponse.json(
      { error: "You already bet on this agent in this match" },
      { status: 409 }
    );
  }

  let amountBase: number | null = null;
  for (let attempt = 0; attempt < 30; attempt++) {
    const result = await verifyUSDCDeposit(txHash, walletAddress);
    if (result.verified) {
      amountBase = result.amount;
      break;
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  if (amountBase === null || amountBase <= 0) {
    return NextResponse.json(
      { error: "Deposit not found. Wait for your transaction to confirm and try again." },
      { status: 400 }
    );
  }

  const [bet, { totalPool }] = await prisma.$transaction((tx) =>
    Promise.all([
      tx.bet.create({
        data: {
          userId: session.user.id,
          gameId,
          agentId,
          amount: amountBase,
          walletAddress,
          txHash,
          status: "PENDING",
        },
      }),
      tx.game.update({
        where: { id: gameId },
        data: { totalPool: { increment: amountBase } },
        select: { totalPool: true },
      }),
      tx.user.update({
        where: { id: session.user.id },
        data: {
          totalBetsPlaced: { increment: 1 },
          totalWagered: { increment: amountBase },
        },
        select: { id: true },
      }),
    ]),
  );

  const params = new URLSearchParams({ pool: String(Number(totalPool) / 1e6) });

  fetch(`${AGENT_SERVER_URL}/bet-confirmed?${params}`, { headers: fetchHeaders })
    .catch((err) => console.warn("[bets] agent notify failed", err));

  return NextResponse.json({
    bet: {
      ...bet,
      amount: Number(bet.amount) / 1e6,
      payout: null,
    },
  });
}