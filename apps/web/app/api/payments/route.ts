import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { PublicKey } from "@solana/web3.js";
import { z } from "zod";
import { parseUsdcToBaseUnits } from "@/lib/usdc";
import {
  normalizePaymentInit,
  paymentInitSelect,
  type PaymentInitResponse,
} from "@/lib/api-types";

const MAX_BET_USDC = 10_000;
const MAX_BET_BASE_UNITS = BigInt(MAX_BET_USDC) * BigInt(1_000_000);
const PAYMENT_TTL_MS = 3 * 60 * 1000;

const createPaymentSchema = z.object({
  gameId: z.coerce.number().int().positive(),
  agentId: z.string().min(1),
  amount: z.union([z.string(), z.number()]),
  walletAddress: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsedBody = createPaymentSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: "Invalid payment request",
        issues: parsedBody.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  const { gameId, agentId, amount, walletAddress } = parsedBody.data;

  try {
    new PublicKey(walletAddress);
  } catch {
    return NextResponse.json(
      { error: "Invalid wallet address" },
      { status: 400 }
    );
  }

  let amountBaseUnits: bigint;
  try {
    amountBaseUnits = parseUsdcToBaseUnits(amount);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid USDC amount" },
      { status: 400 }
    );
  }

  if (amountBaseUnits <= BigInt(0)) {
    return NextResponse.json(
      { error: "Bet amount must be greater than 0" },
      { status: 400 }
    );
  }

  if (amountBaseUnits > MAX_BET_BASE_UNITS) {
    return NextResponse.json(
      { error: `Bet amount exceeds maximum of ${MAX_BET_USDC} USDC` },
      { status: 400 }
    );
  }

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: {
      id: true,
      status: true,
      escrowAccountId: true,
      escrowAccount: {
        select: {
          publicKey: true,
          tokenAccount: true,
          status: true,
        },
      },
      participants: {
        where: { agentId },
        take: 1,
        select: {
          id: true,
          status: true,
          agentId: true,
        },
      },
    },
  });

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  if (game.status !== "LIVE") {
    return NextResponse.json(
      { error: "Betting is only open during live matches" },
      { status: 409 }
    );
  }

  if (game.escrowAccount.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "Game escrow is not active" },
      { status: 409 }
    );
  }

  const participant = game.participants[0];
  if (!participant) {
    return NextResponse.json(
      { error: "Agent is not participating in this game" },
      { status: 404 }
    );
  }

  if (participant.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "Betting is closed for this agent" },
      { status: 409 }
    );
  }

  const existingBet = await prisma.bet.findUnique({
    where: {
      userId_gameParticipantId: {
        userId: session.user.id,
        gameParticipantId: participant.id,
      },
    },
    select: { id: true },
  });

  if (existingBet) {
    return NextResponse.json(
      { error: "Already placed a bet on this agent" },
      { status: 409 }
    );
  }

  const payment = await prisma.payment.create({
    data: {
      type: "BET_DEPOSIT",
      status: "PENDING",
      amount: amountBaseUnits,
      fromAddress: walletAddress,
      toAddress: game.escrowAccount.publicKey,
      toTokenAccount: game.escrowAccount.tokenAccount,
      userId: session.user.id,
      escrowAccountId: game.escrowAccountId,
      gameId: game.id,
      gameParticipantId: participant.id,
      expiresAt: new Date(Date.now() + PAYMENT_TTL_MS),
    },
    select: paymentInitSelect,
  });

  const response: PaymentInitResponse = {
    payment: normalizePaymentInit(payment),
    agentId: participant.agentId,
  };

  return NextResponse.json(response, { status: 201 });
}
