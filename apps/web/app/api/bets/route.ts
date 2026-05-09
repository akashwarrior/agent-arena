import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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
    amount: bet.amount / 1e9,
    payout: bet.payout ? bet.payout / 1e9 : null,
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
  const { gameId, agentId, amount, walletAddress } = body;

  if (!gameId || !agentId || !amount || !walletAddress) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const existingBet = await prisma.bet.findFirst({
    where: {
      gameId,
      userId: session.user.id,
    },
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

  if (game.status !== "OPEN" && game.status !== "UPCOMING") {
    return NextResponse.json(
      { error: "Betting is not open for this game" },
      { status: 400 }
    );
  }

  const amountLamports = Math.round(amount * 1e9);

  const bet = await prisma.bet.create({
    data: {
      userId: session.user.id,
      gameId,
      agentId,
      amount: amountLamports,
      walletAddress,
      txHash: `tx-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      status: "PENDING",
    },
  });

  return NextResponse.json({
    bet: {
      ...bet,
      amount: bet.amount / 1e9,
      payout: bet.payout ? bet.payout / 1e9 : null,
    },
  });
}
