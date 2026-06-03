import type { Prisma } from "@repo/db";
import { usdcBaseUnitsToNumber } from "@/lib/usdc";

function serializeDate(date: Date | null) {
  return date?.toISOString() ?? null;
}

export const gameListSelect = {
  id: true,
  name: true,
  status: true,
  totalPool: true,
  participants: {
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: {
      agent: {
        select: {
          id: true,
          name: true,
          color: true,
          accent: true,
        },
      },
    },
  },
} satisfies Prisma.GameSelect;

export type GameListRecord = Prisma.GameGetPayload<{
  select: typeof gameListSelect;
}>;

export type GameListAgent = GameListRecord["participants"][number]["agent"];

export type GameListItem = Omit<
  GameListRecord,
  "participants" | "totalPool"
> & {
  totalPool: number;
  agents: GameListAgent[];
};

export type GamesResponse = {
  games: GameListItem[];
  nextCursor: GameListItem["id"] | null;
};

export function normalizeGameListItem(game: GameListRecord): GameListItem {
  return {
    id: game.id,
    name: game.name,
    status: game.status,
    totalPool: usdcBaseUnitsToNumber(game.totalPool),
    agents: game.participants.map((participant) => participant.agent),
  };
}

export const gameDetailSelect = {
  id: true,
  name: true,
  status: true,
  startedAt: true,
  totalPool: true,
  winnerParticipantId: true,
  winnerParticipant: {
    select: {
      agentId: true,
    },
  },
  participants: {
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      status: true,
      finalRank: true,
      finalScore: true,
      eliminatedAt: true,
      agent: {
        select: {
          id: true,
          name: true,
          color: true,
          accent: true,
        },
      },
    },
  },
} satisfies Prisma.GameSelect;

export type GameDetailRecord = Prisma.GameGetPayload<{
  select: typeof gameDetailSelect;
}>;

type GameDetailParticipant = GameDetailRecord["participants"][number];

export type GameAgent = GameDetailParticipant["agent"] & {
  participantId: GameDetailParticipant["id"];
  participantStatus: GameDetailParticipant["status"];
  finalRank: GameDetailParticipant["finalRank"];
  finalScore: GameDetailParticipant["finalScore"];
  eliminatedAt: string | null;
};

export type GameWithAgents = Omit<
  GameDetailRecord,
  "participants" | "winnerParticipant" | "startedAt" | "totalPool"
> & {
  startedAt: string | null;
  totalPool: number;
  winnerAgentId:
    | NonNullable<GameDetailRecord["winnerParticipant"]>["agentId"]
    | null;
  agents: GameAgent[];
};

export function normalizeGameDetail(game: GameDetailRecord): GameWithAgents {
  return {
    id: game.id,
    name: game.name,
    status: game.status,
    startedAt: serializeDate(game.startedAt),
    totalPool: usdcBaseUnitsToNumber(game.totalPool),
    winnerParticipantId: game.winnerParticipantId,
    winnerAgentId: game.winnerParticipant?.agentId ?? null,
    agents: game.participants.map((participant) => ({
      ...participant.agent,
      participantId: participant.id,
      participantStatus: participant.status,
      finalRank: participant.finalRank,
      finalScore: participant.finalScore,
      eliminatedAt: serializeDate(participant.eliminatedAt),
    })),
  };
}

export const userGameBetSelect = {
  id: true,
  userId: true,
  gameId: true,
  gameParticipantId: true,
  amount: true,
  payoutAmount: true,
  status: true,
  placedAt: true,
  settledAt: true,
  gameParticipant: {
    select: {
      agentId: true,
      agent: {
        select: {
          name: true,
        },
      },
    },
  },
} satisfies Prisma.BetSelect;

export type UserGameBetRecord = Prisma.BetGetPayload<{
  select: typeof userGameBetSelect;
}>;

export type UserGameBet = Omit<
  UserGameBetRecord,
  "amount" | "payoutAmount" | "placedAt" | "settledAt" | "gameParticipant"
> & {
  agentId: UserGameBetRecord["gameParticipant"]["agentId"];
  agentName: UserGameBetRecord["gameParticipant"]["agent"]["name"];
  amount: number;
  payoutAmount: number | null;
  placedAt: string;
  settledAt: string | null;
};

export type GameDetailResponse = {
  game: GameWithAgents;
  userBets: UserGameBet[];
};

export function normalizeUserGameBet(bet: UserGameBetRecord): UserGameBet {
  return {
    id: bet.id,
    userId: bet.userId,
    gameId: bet.gameId,
    gameParticipantId: bet.gameParticipantId,
    agentId: bet.gameParticipant.agentId,
    agentName: bet.gameParticipant.agent.name,
    status: bet.status,
    placedAt: bet.placedAt.toISOString(),
    settledAt: serializeDate(bet.settledAt),
    amount: usdcBaseUnitsToNumber(bet.amount),
    payoutAmount:
      bet.payoutAmount === null
        ? null
        : usdcBaseUnitsToNumber(bet.payoutAmount),
  };
}

export const paymentInitSelect = {
  id: true,
  status: true,
  amount: true,
  expiresAt: true,
  fromAddress: true,
  toAddress: true,
  toTokenAccount: true,
  gameId: true,
  gameParticipantId: true,
} satisfies Prisma.PaymentSelect;

export type PaymentInitRecord = Prisma.PaymentGetPayload<{
  select: typeof paymentInitSelect;
}>;

export type PaymentInitResponse = {
  payment: Omit<
    PaymentInitRecord,
    "amount" | "expiresAt" | "toTokenAccount"
  > & {
    amount: number;
    expiresAt: string | null;
    toTokenAccount: string;
  };
  agentId: string;
};

export function normalizePaymentInit(
  payment: PaymentInitRecord
): PaymentInitResponse["payment"] {
  if (!payment.toTokenAccount) {
    throw new Error("Payment is missing destination token account");
  }

  return {
    id: payment.id,
    status: payment.status,
    amount: usdcBaseUnitsToNumber(payment.amount),
    expiresAt: serializeDate(payment.expiresAt),
    fromAddress: payment.fromAddress,
    toAddress: payment.toAddress,
    toTokenAccount: payment.toTokenAccount,
    gameId: payment.gameId,
    gameParticipantId: payment.gameParticipantId,
  };
}

export const confirmedPaymentSelect = {
  id: true,
  status: true,
  amount: true,
  confirmedAmount: true,
  txHash: true,
  confirmedAt: true,
} satisfies Prisma.PaymentSelect;

export type ConfirmedPaymentRecord = Prisma.PaymentGetPayload<{
  select: typeof confirmedPaymentSelect;
}>;

export type ConfirmedPayment = Omit<
  ConfirmedPaymentRecord,
  "amount" | "confirmedAmount" | "confirmedAt"
> & {
  amount: number;
  confirmedAmount: number | null;
  confirmedAt: string | null;
};

export type BetConfirmationResponse = {
  payment: ConfirmedPayment;
  bet: UserGameBet;
};

export function normalizeConfirmedPayment(
  payment: ConfirmedPaymentRecord
): ConfirmedPayment {
  return {
    id: payment.id,
    status: payment.status,
    amount: usdcBaseUnitsToNumber(payment.amount),
    confirmedAmount:
      payment.confirmedAmount === null
        ? null
        : usdcBaseUnitsToNumber(payment.confirmedAmount),
    txHash: payment.txHash,
    confirmedAt: serializeDate(payment.confirmedAt),
  };
}

export const liveBetActivitySelect = {
  id: true,
  amount: true,
  placedAt: true,
  gameId: true,
  gameParticipant: {
    select: {
      agent: {
        select: {
          name: true,
        },
      },
    },
  },
} satisfies Prisma.BetSelect;

export type LiveBetActivityRecord = Prisma.BetGetPayload<{
  select: typeof liveBetActivitySelect;
}>;

export type LiveBetActivity = Omit<
  LiveBetActivityRecord,
  "amount" | "placedAt" | "gameParticipant"
> & {
  amount: number;
  placedAt: string;
  agentName: LiveBetActivityRecord["gameParticipant"]["agent"]["name"];
};

export type LiveBetActivityResponse = {
  activities: LiveBetActivity[];
};

export function normalizeLiveBetActivity(
  bet: LiveBetActivityRecord
): LiveBetActivity {
  return {
    id: bet.id,
    amount: usdcBaseUnitsToNumber(bet.amount),
    placedAt: bet.placedAt.toISOString(),
    gameId: bet.gameId,
    agentName: bet.gameParticipant.agent.name,
  };
}

export const leaderboardUserSelect = {
  id: true,
  name: true,
  bets: {
    select: {
      amount: true,
      payoutAmount: true,
      status: true,
    },
  },
} satisfies Prisma.UserSelect;

export type LeaderboardUserRecord = Prisma.UserGetPayload<{
  select: typeof leaderboardUserSelect;
}>;

export type LeaderboardItem = Pick<LeaderboardUserRecord, "id" | "name"> & {
  rank: number;
  totalBetsPlaced: number;
  totalBetsWon: number;
  totalBetsLost: number;
  totalWagered: number;
  totalPayout: number;
  netEarnings: number;
};

export type LeaderboardResponse = {
  leaderboard: LeaderboardItem[];
};
