import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import type { Prisma } from "@repo/db";
import { PublicKey } from "@solana/web3.js";
import { z } from "zod";
import {
  EscrowTransferConfirmationError,
  transferEscrowUsdc,
} from "@/lib/escrow";

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;
const PLATFORM_FEE_WALLET_ADDRESS = process.env.PLATFORM_FEE_WALLET_ADDRESS;

const gameIdSchema = z
  .string()
  .regex(/^[1-9]\d*$/)
  .transform(Number);

const gameSelect = {
  id: true,
  status: true,
  totalPool: true,
  feeBps: true,
  winnerParticipantId: true,
  escrowAccountId: true,
  escrowAccount: {
    select: {
      publicKey: true,
      tokenAccount: true,
      usdcMintAddress: true,
      usdcDecimals: true,
    },
  },
  participants: {
    select: {
      id: true,
      finalRank: true,
      position: true,
    },
  },
  settlement: {
    select: {
      id: true,
      status: true,
      completedAt: true,
    },
  },
} satisfies Prisma.GameSelect;

const activeBetSelect = {
  id: true,
  userId: true,
  gameId: true,
  gameParticipantId: true,
  amount: true,
  depositPayment: {
    select: {
      fromAddress: true,
      fromTokenAccount: true,
    },
  },
} satisfies Prisma.BetSelect;

const settlementEntrySelect = {
  id: true,
  gameId: true,
  settlementId: true,
  type: true,
  status: true,
  amount: true,
  walletAddress: true,
  failureReason: true,
  completedAt: true,
  betId: true,
  userId: true,
  gameParticipantId: true,
} satisfies Prisma.SettlementEntrySelect;

const settlementSelect = {
  id: true,
  gameId: true,
  winningParticipantId: true,
  status: true,
  totalPool: true,
  feeAmount: true,
  payoutPool: true,
  feeBps: true,
  error: true,
  completedAt: true,
  entries: {
    orderBy: { createdAt: "asc" },
    select: settlementEntrySelect,
  },
} satisfies Prisma.GameSettlementSelect;

type GameForSettlement = Prisma.GameGetPayload<{ select: typeof gameSelect }>;
type ActiveBet = Prisma.BetGetPayload<{ select: typeof activeBetSelect }>;
type SettlementForProcessing = Prisma.GameSettlementGetPayload<{
  select: typeof settlementSelect;
}>;
type SettlementEntryForProcessing = SettlementForProcessing["entries"][number];

class SettlementConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SettlementConfigurationError";
  }
}

function splitPayouts(total: bigint, count: number): bigint[] {
  if (count <= 0) return [];

  const countBigInt = BigInt(count);
  const base = total / countBigInt;
  const remainder = Number(total % countBigInt);

  return Array.from({ length: count }, (_, index) =>
    index < remainder ? base + BigInt(1) : base
  );
}

function isValidWalletAddress(address: string | null): address is string {
  if (!address) return false;

  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

function requirePlatformFeeWalletAddress() {
  if (!PLATFORM_FEE_WALLET_ADDRESS) {
    throw new SettlementConfigurationError(
      "PLATFORM_FEE_WALLET_ADDRESS is required when platform fees are enabled"
    );
  }

  if (!isValidWalletAddress(PLATFORM_FEE_WALLET_ADDRESS)) {
    throw new SettlementConfigurationError(
      "PLATFORM_FEE_WALLET_ADDRESS must be a valid Solana wallet address"
    );
  }

  return PLATFORM_FEE_WALLET_ADDRESS;
}

function rankValue(rank: number | null): number {
  return rank ?? Number.MAX_SAFE_INTEGER;
}

function getRankedParticipantIds(params: {
  participants: Array<{
    id: string;
    finalRank: number | null;
    position: number | null;
  }>;
  winnerParticipantId: string;
}) {
  return [...params.participants]
    .sort((a, b) => {
      const rankA =
        a.id === params.winnerParticipantId ? 0 : rankValue(a.finalRank);
      const rankB =
        b.id === params.winnerParticipantId ? 0 : rankValue(b.finalRank);
      if (rankA !== rankB) return rankA - rankB;

      const positionA = rankValue(a.position);
      const positionB = rankValue(b.position);
      if (positionA !== positionB) return positionA - positionB;

      return a.id.localeCompare(b.id);
    })
    .map((participant) => participant.id);
}

function getSettlementWinnerParticipantId(params: {
  activeBets: Array<{ gameParticipantId: string }>;
  participants: Array<{
    id: string;
    finalRank: number | null;
    position: number | null;
  }>;
  winnerParticipantId: string | null;
}) {
  if (!params.winnerParticipantId) return null;

  const betParticipantIds = new Set(
    params.activeBets.map((bet) => bet.gameParticipantId)
  );

  return (
    getRankedParticipantIds({
      participants: params.participants,
      winnerParticipantId: params.winnerParticipantId,
    }).find((participantId) => betParticipantIds.has(participantId)) ?? null
  );
}

function isTransferEntry(entry: SettlementEntryForProcessing) {
  return entry.type === "PAYOUT" || entry.type === "PLATFORM_FEE";
}

function isActionableTransferEntry(entry: SettlementEntryForProcessing) {
  return (
    isTransferEntry(entry) &&
    (entry.status === "PENDING" || entry.status === "FAILED") &&
    entry.amount > BigInt(0) &&
    isValidWalletAddress(entry.walletAddress)
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown settlement error";
}

function buildSettlementPlan(game: GameForSettlement, activeBets: ActiveBet[]) {
  const totalPool = activeBets.reduce(
    (sum, bet) => sum + bet.amount,
    BigInt(0)
  );
  const winningParticipantId = getSettlementWinnerParticipantId({
    activeBets,
    participants: game.participants,
    winnerParticipantId: game.winnerParticipantId,
  });
  const feeAmount = winningParticipantId
    ? (totalPool * BigInt(game.feeBps)) / BigInt(10_000)
    : BigInt(0);
  const payoutPool = totalPool - feeAmount;
  const winningBets = winningParticipantId
    ? activeBets.filter((bet) => bet.gameParticipantId === winningParticipantId)
    : [];
  const losingBets = winningParticipantId
    ? activeBets.filter((bet) => bet.gameParticipantId !== winningParticipantId)
    : [];
  const refundBets = winningParticipantId ? [] : activeBets;
  const payouts = splitPayouts(payoutPool, winningBets.length);

  return {
    totalPool,
    feeAmount,
    payoutPool,
    winningParticipantId,
    winningBets,
    losingBets,
    refundBets,
    payouts,
  };
}

async function prepareSettlement(
  game: GameForSettlement,
  activeBets: ActiveBet[]
) {
  return prisma.$transaction(async (tx) => {
    const existingSettlement = await tx.gameSettlement.findUnique({
      where: { gameId: game.id },
      select: settlementSelect,
    });

    if (existingSettlement?.status === "COMPLETED") {
      return existingSettlement;
    }

    if (existingSettlement && existingSettlement.entries.length > 0) {
      const invalidPlatformFeeEntryIds = existingSettlement.entries
        .filter(
          (entry) =>
            entry.type === "PLATFORM_FEE" &&
            entry.status !== "COMPLETED" &&
            entry.amount > BigInt(0) &&
            !isValidWalletAddress(entry.walletAddress)
        )
        .map((entry) => entry.id);

      if (invalidPlatformFeeEntryIds.length > 0) {
        const platformFeeWalletAddress = requirePlatformFeeWalletAddress();

        await tx.settlementEntry.updateMany({
          where: {
            id: { in: invalidPlatformFeeEntryIds },
            gameId: game.id,
            settlementId: existingSettlement.id,
            payments: { none: {} },
          },
          data: {
            status: "PENDING",
            walletAddress: platformFeeWalletAddress,
            failureReason: null,
            completedAt: null,
          },
        });
      }

      const hasPendingRefunds = existingSettlement.entries.some(
        (entry) => entry.type === "REFUND" && entry.status !== "COMPLETED"
      );
      const hasProcessingTransfers = existingSettlement.entries.some(
        (entry) => isTransferEntry(entry) && entry.status === "PROCESSING"
      );

      return tx.gameSettlement.update({
        where: { id: existingSettlement.id },
        data: {
          status: hasPendingRefunds ? "FAILED" : "PROCESSING",
          completedAt: null,
          error: hasPendingRefunds
            ? "Refund processing is not implemented yet"
            : hasProcessingTransfers
              ? "One or more transfer entries are already processing"
              : null,
        },
        select: settlementSelect,
      });
    }

    const plan = buildSettlementPlan(game, activeBets);
    const now = new Date();
    const platformFeeWalletAddress =
      plan.feeAmount > BigInt(0) ? requirePlatformFeeWalletAddress() : null;

    const settlement = await tx.gameSettlement.upsert({
      where: { gameId: game.id },
      create: {
        gameId: game.id,
        winningParticipantId: plan.winningParticipantId,
        status: plan.refundBets.length > 0 ? "FAILED" : "PROCESSING",
        totalPool: plan.totalPool,
        feeAmount: plan.feeAmount,
        payoutPool: plan.payoutPool,
        feeBps: game.feeBps,
        completedAt: activeBets.length === 0 ? now : null,
        error:
          plan.refundBets.length > 0
            ? "Refund processing is not implemented yet"
            : null,
      },
      update: {
        winningParticipantId: plan.winningParticipantId,
        status: plan.refundBets.length > 0 ? "FAILED" : "PROCESSING",
        totalPool: plan.totalPool,
        feeAmount: plan.feeAmount,
        payoutPool: plan.payoutPool,
        feeBps: game.feeBps,
        completedAt: activeBets.length === 0 ? now : null,
        error:
          plan.refundBets.length > 0
            ? "Refund processing is not implemented yet"
            : null,
      },
      select: { id: true },
    });

    await tx.settlementEntry.deleteMany({
      where: {
        gameId: game.id,
        settlementId: settlement.id,
        payments: { none: {} },
      },
    });

    for (const [index, bet] of plan.winningBets.entries()) {
      const payoutAmount = plan.payouts[index] ?? BigInt(0);
      const walletAddress = bet.depositPayment.fromAddress;
      const walletIsValid = isValidWalletAddress(walletAddress);

      await tx.settlementEntry.create({
        data: {
          gameId: game.id,
          settlementId: settlement.id,
          betId: bet.id,
          userId: bet.userId,
          gameParticipantId: bet.gameParticipantId,
          type: "PAYOUT",
          status:
            walletIsValid && payoutAmount > BigInt(0) ? "PENDING" : "FAILED",
          amount: payoutAmount,
          walletAddress,
          failureReason: walletIsValid ? null : "Invalid payout wallet address",
        },
        select: { id: true },
      });
    }

    for (const bet of plan.losingBets) {
      await tx.settlementEntry.create({
        data: {
          gameId: game.id,
          settlementId: settlement.id,
          betId: bet.id,
          userId: bet.userId,
          gameParticipantId: bet.gameParticipantId,
          type: "LOSS",
          status: "PENDING",
          amount: bet.amount,
        },
        select: { id: true },
      });
    }

    for (const bet of plan.refundBets) {
      await tx.settlementEntry.create({
        data: {
          gameId: game.id,
          settlementId: settlement.id,
          betId: bet.id,
          userId: bet.userId,
          gameParticipantId: bet.gameParticipantId,
          type: "REFUND",
          status: "PENDING",
          amount: bet.amount,
          walletAddress: bet.depositPayment.fromAddress,
        },
        select: { id: true },
      });
    }

    if (plan.feeAmount > BigInt(0)) {
      await tx.settlementEntry.create({
        data: {
          gameId: game.id,
          settlementId: settlement.id,
          type: "PLATFORM_FEE",
          status: "PENDING",
          amount: plan.feeAmount,
          walletAddress: platformFeeWalletAddress,
        },
        select: { id: true },
      });
    }

    if (activeBets.length === 0) {
      await tx.game.update({
        where: { id: game.id },
        data: {
          status: "SETTLED",
          settledAt: now,
          feeAmount: BigInt(0),
        },
        select: { id: true },
      });
    }

    return tx.gameSettlement.findUniqueOrThrow({
      where: { gameId: game.id },
      select: settlementSelect,
    });
  });
}

async function createTransferPayment(params: {
  tx: Prisma.TransactionClient;
  game: GameForSettlement;
  entry: SettlementEntryForProcessing;
  txHash: string;
  confirmed: boolean;
}) {
  const now = new Date();

  await params.tx.payment.upsert({
    where: { txHash: params.txHash },
    create: {
      type: params.entry.type === "PLATFORM_FEE" ? "PLATFORM_FEE" : "PAYOUT",
      status: params.confirmed ? "CONFIRMED" : "PENDING",
      amount: params.entry.amount,
      confirmedAmount: params.confirmed ? params.entry.amount : null,
      fromAddress: params.game.escrowAccount.publicKey,
      toAddress: params.entry.walletAddress!,
      fromTokenAccount: params.game.escrowAccount.tokenAccount,
      txHash: params.txHash,
      confirmedAt: params.confirmed ? now : null,
      userId: params.entry.userId,
      escrowAccountId: params.game.escrowAccountId,
      gameId: params.game.id,
      gameParticipantId: params.entry.gameParticipantId,
      betId: params.entry.betId,
      settlementEntryId: params.entry.id,
    },
    update: {
      status: params.confirmed ? "CONFIRMED" : "PENDING",
      confirmedAmount: params.confirmed ? params.entry.amount : null,
      confirmedAt: params.confirmed ? now : null,
      settlementEntryId: params.entry.id,
    },
    select: { id: true },
  });
}

async function completeTransferEntry(params: {
  game: GameForSettlement;
  entry: SettlementEntryForProcessing;
  txHash: string;
}) {
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await createTransferPayment({
      tx,
      game: params.game,
      entry: params.entry,
      txHash: params.txHash,
      confirmed: true,
    });

    await tx.settlementEntry.updateMany({
      where: {
        id: params.entry.id,
        gameId: params.game.id,
        status: "PROCESSING",
      },
      data: {
        status: "COMPLETED",
        failureReason: null,
        completedAt: now,
      },
    });
  });
}

async function markTransferSubmitted(params: {
  game: GameForSettlement;
  entry: SettlementEntryForProcessing;
  txHash: string;
  failureReason: string;
}) {
  await prisma.$transaction(async (tx) => {
    await createTransferPayment({
      tx,
      game: params.game,
      entry: params.entry,
      txHash: params.txHash,
      confirmed: false,
    });

    await tx.settlementEntry.updateMany({
      where: {
        id: params.entry.id,
        gameId: params.game.id,
        status: "PROCESSING",
      },
      data: {
        failureReason: params.failureReason,
      },
    });
  });
}

async function failTransferEntry(params: {
  gameId: number;
  entryId: string;
  failureReason: string;
}) {
  await prisma.settlementEntry.updateMany({
    where: {
      id: params.entryId,
      gameId: params.gameId,
      status: "PROCESSING",
    },
    data: {
      status: "FAILED",
      failureReason: params.failureReason,
    },
  });
}

async function processTransferEntry(
  game: GameForSettlement,
  entry: SettlementEntryForProcessing
) {
  const claimed = await prisma.settlementEntry.updateMany({
    where: {
      id: entry.id,
      gameId: game.id,
      settlementId: entry.settlementId,
      status: { in: ["PENDING", "FAILED"] },
    },
    data: {
      status: "PROCESSING",
      failureReason: null,
    },
  });

  if (claimed.count !== 1) {
    return;
  }

  try {
    const txHash = await transferEscrowUsdc({
      escrow: game.escrowAccount,
      toAddress: entry.walletAddress!,
      amount: entry.amount,
    });

    await completeTransferEntry({ game, entry, txHash });
  } catch (error) {
    if (error instanceof EscrowTransferConfirmationError) {
      await markTransferSubmitted({
        game,
        entry,
        txHash: error.txHash,
        failureReason: error.message,
      });
      return;
    }

    await failTransferEntry({
      gameId: game.id,
      entryId: entry.id,
      failureReason: getErrorMessage(error),
    });
  }
}

async function processSettlementTransfers(
  game: GameForSettlement,
  settlement: SettlementForProcessing
) {
  for (const entry of settlement.entries) {
    if (!isActionableTransferEntry(entry)) continue;
    await processTransferEntry(game, entry);
  }
}

function getIncompleteSettlementError(entries: SettlementEntryForProcessing[]) {
  if (
    entries.some(
      (entry) => entry.type === "REFUND" && entry.status !== "COMPLETED"
    )
  ) {
    return "Refund processing is not implemented yet";
  }

  if (
    entries.some(
      (entry) => isTransferEntry(entry) && entry.status === "PROCESSING"
    )
  ) {
    return "One or more transfers are processing or need reconciliation";
  }

  return "One or more settlement transfers failed";
}

async function finalizeSettlement(game: GameForSettlement) {
  const settlement = await prisma.gameSettlement.findUniqueOrThrow({
    where: { gameId: game.id },
    select: settlementSelect,
  });

  const refundEntries = settlement.entries.filter(
    (entry) => entry.type === "REFUND" && entry.status !== "COMPLETED"
  );
  const incompleteTransferEntries = settlement.entries.filter(
    (entry) => isTransferEntry(entry) && entry.status !== "COMPLETED"
  );

  if (refundEntries.length === 0 && incompleteTransferEntries.length === 0) {
    const now = new Date();

    return prisma.$transaction(async (tx) => {
      for (const entry of settlement.entries) {
        if (entry.type === "PAYOUT" && entry.betId) {
          await tx.bet.update({
            where: { id: entry.betId },
            data: {
              status: "WON",
              payoutAmount: entry.amount,
              settledAt: now,
            },
            select: { id: true },
          });
        }

        if (entry.type === "LOSS" && entry.betId) {
          await tx.bet.update({
            where: { id: entry.betId },
            data: {
              status: "LOST",
              settledAt: now,
            },
            select: { id: true },
          });

          await tx.settlementEntry.update({
            where: { id: entry.id },
            data: {
              status: "COMPLETED",
              completedAt: now,
              failureReason: null,
            },
            select: { id: true },
          });
        }
      }

      await tx.game.update({
        where: { id: game.id },
        data: {
          status: "SETTLED",
          settledAt: now,
          feeAmount: settlement.feeAmount,
        },
        select: { id: true },
      });

      return tx.gameSettlement.update({
        where: { id: settlement.id },
        data: {
          status: "COMPLETED",
          error: null,
          completedAt: now,
        },
        select: settlementSelect,
      });
    });
  }

  const hasProcessingTransfer = incompleteTransferEntries.some(
    (entry) => entry.status === "PROCESSING"
  );

  return prisma.gameSettlement.update({
    where: { id: settlement.id },
    data: {
      status: hasProcessingTransfer ? "PROCESSING" : "FAILED",
      error: getIncompleteSettlementError(settlement.entries),
      completedAt: null,
    },
    select: settlementSelect,
  });
}

// TODO: resolve shouldn't be a route it should be an isolated worker
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (
    !INTERNAL_API_KEY ||
    request.headers.get("x-api-key") !== INTERNAL_API_KEY
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsedGameId = gameIdSchema.safeParse(id);
  if (!parsedGameId.success) {
    return NextResponse.json({ error: "Invalid game id" }, { status: 400 });
  }

  const gameId = parsedGameId.data;
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: gameSelect,
  });

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  if (game.settlement?.status === "COMPLETED") {
    return NextResponse.json({
      settled: true,
      settlement: game.settlement,
    });
  }

  if (game.status !== "ENDED" && game.status !== "SETTLED") {
    return NextResponse.json(
      { error: "Game must be ended before settlement" },
      { status: 409 }
    );
  }

  const activeBets = await prisma.bet.findMany({
    where: {
      gameId,
      status: "ACTIVE",
    },
    select: activeBetSelect,
  });

  try {
    const preparedSettlement = await prepareSettlement(game, activeBets);
    if (preparedSettlement.status !== "COMPLETED") {
      await processSettlementTransfers(game, preparedSettlement);
    }

    const settlement = await finalizeSettlement(game);

    return NextResponse.json({
      settled: settlement.status === "COMPLETED",
      settlement: {
        id: settlement.id,
        status: settlement.status,
        completedAt: settlement.completedAt,
        error: settlement.error,
      },
    });
  } catch (error) {
    if (error instanceof SettlementConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    throw error;
  }
}
