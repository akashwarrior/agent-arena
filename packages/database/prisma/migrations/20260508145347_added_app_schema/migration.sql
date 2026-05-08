-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('UPCOMING', 'OPEN', 'LOCKED', 'LIVE', 'ENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BetStatus" AS ENUM ('PENDING', 'WON', 'LOST', 'REFUNDED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('BET_PLACED', 'PAYOUT', 'REFUND');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "netEarnings" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalBetsLost" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalBetsPlaced" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalBetsWon" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalPayout" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalWagered" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "totalGames" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "winRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "GameStatus" NOT NULL DEFAULT 'UPCOMING',
    "bettingOpensAt" TIMESTAMP(3),
    "bettingClosesAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "totalPool" INTEGER NOT NULL DEFAULT 0,
    "winnerAgentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentGame" (
    "agentId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,

    CONSTRAINT "AgentGame_pkey" PRIMARY KEY ("agentId","gameId")
);

-- CreateTable
CREATE TABLE "Bet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "payout" INTEGER,
    "status" "BetStatus" NOT NULL DEFAULT 'PENDING',
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledAt" TIMESTAMP(3),
    "txHash" TEXT NOT NULL,
    "payoutTxHash" TEXT,

    CONSTRAINT "Bet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "txHash" TEXT NOT NULL,
    "blockNumber" INTEGER,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "betId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agent_name_key" ON "Agent"("name");

-- CreateIndex
CREATE INDEX "Agent_winRate_idx" ON "Agent"("winRate");

-- CreateIndex
CREATE INDEX "Agent_wins_idx" ON "Agent"("wins");

-- CreateIndex
CREATE INDEX "Game_status_idx" ON "Game"("status");

-- CreateIndex
CREATE INDEX "AgentGame_gameId_idx" ON "AgentGame"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "Bet_txHash_key" ON "Bet"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "Bet_payoutTxHash_key" ON "Bet"("payoutTxHash");

-- CreateIndex
CREATE INDEX "Bet_userId_idx" ON "Bet"("userId");

-- CreateIndex
CREATE INDEX "Bet_gameId_idx" ON "Bet"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_txHash_key" ON "Transaction"("txHash");

-- CreateIndex
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");

-- CreateIndex
CREATE INDEX "Transaction_betId_idx" ON "Transaction"("betId");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_winnerAgentId_fkey" FOREIGN KEY ("winnerAgentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentGame" ADD CONSTRAINT "AgentGame_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentGame" ADD CONSTRAINT "AgentGame_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_betId_fkey" FOREIGN KEY ("betId") REFERENCES "Bet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
