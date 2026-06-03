import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { verifyUsdcPayment } from "@/lib/escrow";
import { formatUsdcBaseUnits } from "@/lib/usdc";
import {
  confirmedPaymentSelect,
  normalizeConfirmedPayment,
  normalizeUserGameBet,
  userGameBetSelect,
  type BetConfirmationResponse,
} from "@/lib/api-types";

const AGENT_SERVER_URL =
  process.env.AGENT_SERVER_URL ?? "http://localhost:3001";

const fetchHeaders: Record<string, string> = process.env.INTERNAL_API_KEY
  ? { "x-api-key": process.env.INTERNAL_API_KEY }
  : {};

const paymentIdSchema = z.string().uuid();
const confirmationSchema = z.object({
  txHash: z.string().min(1),
});

function getPrismaErrorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error
    ? String(error.code)
    : null;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown verification error";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsedPaymentId = paymentIdSchema.safeParse(id);
  if (!parsedPaymentId.success) {
    return NextResponse.json({ error: "Invalid payment id" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsedBody = confirmationSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: "Invalid payment confirmation",
        issues: parsedBody.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  const payment = await prisma.payment.findUnique({
    where: { id: parsedPaymentId.data },
    select: {
      id: true,
      type: true,
      status: true,
      amount: true,
      expiresAt: true,
      txHash: true,
      fromAddress: true,
      toAddress: true,
      gameId: true,
      gameParticipantId: true,
      userId: true,
      escrowAccount: {
        select: {
          usdcMintAddress: true,
          usdcDecimals: true,
        },
      },
    },
  });

  if (!payment || payment.userId !== session.user.id) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  if (payment.type !== "BET_DEPOSIT" || !payment.gameParticipantId) {
    return NextResponse.json(
      { error: "Payment cannot be confirmed as a bet deposit" },
      { status: 409 }
    );
  }

  const { txHash } = parsedBody.data;

  if (payment.status === "PROCESSING") {
    return NextResponse.json(
      payment.txHash === txHash
        ? { error: "Payment verification is already in progress" }
        : { error: "Payment is already verifying another transaction" },
      { status: 409 }
    );
  }

  if (payment.status !== "PENDING") {
    return NextResponse.json(
      { error: "Payment has already been processed" },
      { status: 409 }
    );
  }

  if (payment.expiresAt && payment.expiresAt.getTime() < Date.now()) {
    try {
      await prisma.payment.update({
        where: {
          id: payment.id,
          status: "PENDING",
        },
        data: {
          status: "EXPIRED",
          failureReason: "Payment confirmation expired",
        },
        select: { id: true },
      });
    } catch (error) {
      if (getPrismaErrorCode(error) !== "P2025") {
        throw error;
      }
    }

    return NextResponse.json({ error: "Payment expired" }, { status: 409 });
  }

  try {
    await prisma.payment.update({
      where: {
        id: payment.id,
        userId: session.user.id,
        type: "BET_DEPOSIT",
        status: "PENDING",
      },
      data: {
        status: "PROCESSING",
        txHash,
        failureReason: null,
      },
      select: { id: true },
    });
  } catch (error) {
    const code = getPrismaErrorCode(error);

    if (code === "P2002") {
      return NextResponse.json(
        { error: "Transaction has already been used" },
        { status: 409 }
      );
    }

    if (code === "P2025") {
      const latestPayment = await prisma.payment.findUnique({
        where: { id: payment.id },
        select: {
          id: true,
          status: true,
          txHash: true,
        },
      });

      if (latestPayment?.status === "PROCESSING") {
        return NextResponse.json(
          latestPayment.txHash === txHash
            ? { error: "Payment verification is already in progress" }
            : { error: "Payment is already verifying another transaction" },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "Payment has already been processed" },
        { status: 409 }
      );
    }

    throw error;
  }

  let verificationResult: Awaited<ReturnType<typeof verifyUsdcPayment>> | null =
    null;

  try {
    for (let attempt = 0; attempt < 30; attempt++) {
      const result = await verifyUsdcPayment({
        expectedAmount: formatUsdcBaseUnits(payment.amount),
        signature: txHash,
        senderWallet: payment.fromAddress,
        recipientWallet: payment.toAddress,
        mintAddress: payment.escrowAccount.usdcMintAddress,
        decimals: payment.escrowAccount.usdcDecimals,
      });

      if (result.ok) {
        verificationResult = result;
        break;
      }

      verificationResult = result;
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  } catch (error) {
    await prisma.payment.update({
      where: {
        id: payment.id,
        status: "PROCESSING",
        txHash,
      },
      data: {
        status: "FAILED",
        failureReason: getErrorMessage(error),
      },
      select: { id: true },
    });

    console.error("[payments] verification failed", error);
    return NextResponse.json(
      { error: "Failed to verify payment transaction" },
      { status: 500 }
    );
  }

  if (!verificationResult?.ok) {
    await prisma.payment.update({
      where: {
        id: payment.id,
        status: "PROCESSING",
        txHash,
      },
      data: {
        status: "FAILED",
        failureReason:
          verificationResult?.reason ?? "Unable to verify USDC deposit",
        verification: verificationResult ?? undefined,
      },
      select: { id: true },
    });

    return NextResponse.json(
      {
        error: verificationResult?.reason ?? "Unable to verify USDC deposit",
      },
      { status: 400 }
    );
  }

  const confirmedAmount = BigInt(
    verificationResult.actualReceivedRawAmount ?? "0"
  );

  if (confirmedAmount !== payment.amount) {
    await prisma.payment.update({
      where: {
        id: payment.id,
        status: "PROCESSING",
        txHash,
      },
      data: {
        status: "FAILED",
        confirmedAmount,
        failureReason:
          "Confirmed payment amount does not match requested amount",
        verification: verificationResult,
      },
      select: { id: true },
    });

    return NextResponse.json(
      { error: "Confirmed payment amount does not match the requested amount" },
      { status: 400 }
    );
  }

  try {
    const { bet, totalPool, confirmedPayment } = await prisma.$transaction(
      async (tx) => {
        const [existingBet, existingTx] = await Promise.all([
          tx.bet.findUnique({
            where: {
              userId_gameParticipantId: {
                userId: session.user.id,
                gameParticipantId: payment.gameParticipantId!,
              },
            },
            select: { id: true },
          }),
          tx.payment.findUnique({
            where: { txHash },
            select: { id: true },
          }),
        ]);

        if (existingBet) {
          throw new Error("Already placed a bet on this agent");
        }

        if (existingTx && existingTx.id !== payment.id) {
          throw new Error("Transaction has already been used");
        }

        await tx.payment.update({
          where: {
            id: payment.id,
            status: "PROCESSING",
            txHash,
          },
          data: {
            status: "CONFIRMED",
            confirmedAmount,
            txHash,
            confirmedAt: new Date(),
            fromTokenAccount:
              verificationResult.matchedTransfer?.sourceTokenAccount,
            toTokenAccount:
              verificationResult.matchedTransfer?.destinationTokenAccount,
            verification: verificationResult,
          },
          select: { id: true },
        });

        const bet = await tx.bet.create({
          data: {
            userId: session.user.id,
            gameId: payment.gameId,
            gameParticipantId: payment.gameParticipantId!,
            depositPaymentId: payment.id,
            amount: confirmedAmount,
            status: "ACTIVE",
          },
          select: userGameBetSelect,
        });

        const game = await tx.game.update({
          where: { id: payment.gameId },
          data: {
            totalPool: {
              increment: confirmedAmount,
            },
          },
          select: {
            totalPool: true,
          },
        });

        const confirmedPayment = await tx.payment.findUniqueOrThrow({
          where: { id: payment.id },
          select: confirmedPaymentSelect,
        });

        return { bet, totalPool: game.totalPool, confirmedPayment };
      }
    );

    const params = new URLSearchParams({
      gameId: String(payment.gameId),
      pool: totalPool.toString(),
    });

    fetch(`${AGENT_SERVER_URL}/bet-confirmed?${params}`, {
      headers: fetchHeaders,
    }).catch((err) => console.warn("[payments] agent notify failed", err));

    const response: BetConfirmationResponse = {
      payment: normalizeConfirmedPayment(confirmedPayment),
      bet: normalizeUserGameBet(bet),
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (getPrismaErrorCode(error) === "P2025") {
      return NextResponse.json(
        { error: "Payment has already been processed" },
        { status: 409 }
      );
    }

    if (
      error instanceof Error &&
      [
        "Already placed a bet on this agent",
        "Payment has already been processed",
        "Transaction has already been used",
      ].includes(error.message)
    ) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error("[payments] confirmation failed", error);
    return NextResponse.json(
      { error: "Failed to confirm payment" },
      { status: 500 }
    );
  }
}
