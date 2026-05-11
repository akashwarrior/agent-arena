import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  verifyUSDCDeposit,
  getEscrowUSDCAddress,
} from "@/lib/escrow";

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const cursor = searchParams.get("cursor");
  const limit = parseInt(searchParams.get("limit") || String(PAGE_SIZE));

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
    amount: bet.amount / 1e6,
    payout: bet.payout ? bet.payout / 1e6 : null,
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

  if (!gameId || !agentId || !amount) {
    return NextResponse.json(
      {
        error:
          "Missing required fields: gameId, agentId, amount",
      },
      { status: 400 }
    );
  }

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { agents: true },
  });

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  if (game.status !== "OPEN" || !game.bettingClosesAt || new Date(game.bettingClosesAt) <= new Date()) {
    return NextResponse.json(
      { error: "Betting is not open for this game" },
      { status: 400 }
    );
  }

  const existingBet = await prisma.bet.findFirst({
    where: { gameId, userId: session.user.id, agentId, },
  });

  if (existingBet) {
    return NextResponse.json(
      { error: "Already placed a bet on this agent" },
      { status: 409 }
    );
  }

  if (!game.escrowPublicKey) {
    return NextResponse.json(
      { error: "Escrow not initialized for this game" },
      { status: 500 }
    );
  }

  const escrowUSDC = await getEscrowUSDCAddress(game.escrowPublicKey);
  const usdcBase = Math.round(amount * 1e6);

  return NextResponse.json({
    escrowPublicKey: game.escrowPublicKey,
    escrowUSDCAddress: escrowUSDC,
    usdcAmount: usdcBase,
    gameId,
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
  const { gameId, agentId, amount, walletAddress, txHash } =
    body;

  if (!gameId || !agentId || !amount || !walletAddress || !txHash) {
    return NextResponse.json(
      {
        error:
          "Missing required fields: gameId, agentId, amount, walletAddress, txHash",
      },
      { status: 400 }
    );
  }

  const existingBet = await prisma.bet.findFirst({
    where: { gameId, userId: session.user.id },
  });

  if (existingBet) {
    return NextResponse.json(
      { error: "Already placed a bet on this game" },
      { status: 409 }
    );
  }

  const game = await prisma.game.findUnique({
    where: { id: gameId },
  });

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  if (!game.escrowPublicKey) {
    return NextResponse.json(
      { error: "Escrow not initialized for this game" },
      { status: 500 }
    );
  }

  const amountBase = Math.round(amount * 1e6);
  const escrowUSDC = await getEscrowUSDCAddress(game.escrowPublicKey);

  const depositVerified = await verifyUSDCDeposit(
    txHash,
    escrowUSDC,
    amountBase
  );

  if (!depositVerified) {
    return NextResponse.json(
      {
        error:
          "Could not verify deposit to escrow. Ensure the transaction is confirmed.",
      },
      { status: 400 }
    );
  }

  const bet = await prisma.bet.create({
    data: {
      userId: session.user.id,
      gameId,
      agentId,
      amount: amountBase,
      walletAddress,
      txHash,
      status: "PENDING",
    },
  });

  await prisma.game.update({
    where: { id: gameId },
    data: {
      totalPool: { increment: amountBase },
    },
  });

  return NextResponse.json({
    bet: {
      ...bet,
      amount: bet.amount / 1e6,
      payout: bet.payout ? bet.payout / 1e6 : null,
    },
  });
}
