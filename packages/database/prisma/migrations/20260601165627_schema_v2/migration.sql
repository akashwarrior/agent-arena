/*
  Warnings:

  - The values [PENDING] on the enum `BetStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `draws` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `losses` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `totalGames` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `winRate` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `wins` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `agentId` on the `Bet` table. All the data in the column will be lost.
  - You are about to drop the column `payout` on the `Bet` table. All the data in the column will be lost.
  - You are about to drop the column `payoutTxHash` on the `Bet` table. All the data in the column will be lost.
  - You are about to drop the column `txHash` on the `Bet` table. All the data in the column will be lost.
  - You are about to drop the column `walletAddress` on the `Bet` table. All the data in the column will be lost.
  - You are about to drop the column `winnerAgentId` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `netEarnings` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `totalBetsLost` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `totalBetsPlaced` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `totalBetsWon` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `totalPayout` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `totalWagered` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `walletAddress` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `AgentGame` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,gameParticipantId]` on the table `Bet` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[depositPaymentId,gameId]` on the table `Bet` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,gameId]` on the table `Bet` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[winnerParticipantId,id]` on the table `Game` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `depositPaymentId` to the `Bet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gameParticipantId` to the `Bet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Bet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `escrowAccountId` to the `Game` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "GameParticipantStatus" AS ENUM ('ACTIVE', 'ELIMINATED', 'WINNER', 'LOSER');

-- CreateEnum
CREATE TYPE "SolanaNetwork" AS ENUM ('DEVNET', 'MAINNET');

-- CreateEnum
CREATE TYPE "EscrowAccountStatus" AS ENUM ('ACTIVE', 'DISABLED', 'RETIRED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('BET_DEPOSIT', 'PAYOUT', 'REFUND', 'PLATFORM_FEE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "SettlementEntryType" AS ENUM ('PAYOUT', 'REFUND', 'LOSS', 'PLATFORM_FEE');

-- CreateEnum
CREATE TYPE "SettlementEntryStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterEnum
BEGIN;
CREATE TYPE "BetStatus_new" AS ENUM ('ACTIVE', 'WON', 'LOST', 'REFUNDED');
ALTER TABLE "public"."Bet" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Bet" ALTER COLUMN "status" TYPE "BetStatus_new" USING ("status"::text::"BetStatus_new");
ALTER TYPE "BetStatus" RENAME TO "BetStatus_old";
ALTER TYPE "BetStatus_new" RENAME TO "BetStatus";
DROP TYPE "public"."BetStatus_old";
ALTER TABLE "Bet" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "GameStatus" ADD VALUE 'DRAFT';
ALTER TYPE "GameStatus" ADD VALUE 'SETTLED';

-- DropForeignKey
ALTER TABLE "AgentGame" DROP CONSTRAINT "AgentGame_agentId_fkey";

-- DropForeignKey
ALTER TABLE "AgentGame" DROP CONSTRAINT "AgentGame_gameId_fkey";

-- DropForeignKey
ALTER TABLE "Bet" DROP CONSTRAINT "Bet_agentId_fkey";

-- DropForeignKey
ALTER TABLE "Bet" DROP CONSTRAINT "Bet_gameId_fkey";

-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_winnerAgentId_fkey";

-- DropIndex
DROP INDEX "Agent_winRate_idx";

-- DropIndex
DROP INDEX "Agent_wins_idx";

-- DropIndex
DROP INDEX "Bet_gameId_idx";

-- DropIndex
DROP INDEX "Bet_payoutTxHash_key";

-- DropIndex
DROP INDEX "Bet_txHash_key";

-- DropIndex
DROP INDEX "Bet_userId_idx";

-- DropIndex
DROP INDEX "Game_status_idx";

-- AlterTable
ALTER TABLE "Agent" DROP COLUMN "draws",
DROP COLUMN "losses",
DROP COLUMN "totalGames",
DROP COLUMN "winRate",
DROP COLUMN "wins";

-- AlterTable
ALTER TABLE "Bet" DROP COLUMN "agentId",
DROP COLUMN "payout",
DROP COLUMN "payoutTxHash",
DROP COLUMN "txHash",
DROP COLUMN "walletAddress",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "depositPaymentId" TEXT NOT NULL,
ADD COLUMN     "gameParticipantId" TEXT NOT NULL,
ADD COLUMN     "payoutAmount" BIGINT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "winnerAgentId",
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "escrowAccountId" TEXT NOT NULL,
ADD COLUMN     "feeBps" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "settledAt" TIMESTAMP(3),
ADD COLUMN     "winnerParticipantId" TEXT;

-- AlterTable
ALTER TABLE "user" DROP COLUMN "netEarnings",
DROP COLUMN "totalBetsLost",
DROP COLUMN "totalBetsPlaced",
DROP COLUMN "totalBetsWon",
DROP COLUMN "totalPayout",
DROP COLUMN "totalWagered",
DROP COLUMN "walletAddress";

-- DropTable
DROP TABLE "AgentGame";

-- CreateTable
CREATE TABLE "GameParticipant" (
    "id" TEXT NOT NULL,
    "gameId" INTEGER NOT NULL,
    "agentId" TEXT NOT NULL,
    "status" "GameParticipantStatus" NOT NULL DEFAULT 'ACTIVE',
    "position" INTEGER,
    "finalRank" INTEGER,
    "finalScore" DOUBLE PRECISION,
    "eliminatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscrowAccount" (
    "id" TEXT NOT NULL,
    "network" "SolanaNetwork" NOT NULL,
    "publicKey" TEXT NOT NULL,
    "tokenAccount" TEXT NOT NULL,
    "usdcMintAddress" TEXT NOT NULL,
    "usdcDecimals" INTEGER NOT NULL DEFAULT 6,
    "status" "EscrowAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EscrowAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "type" "PaymentType" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" BIGINT NOT NULL,
    "confirmedAmount" BIGINT,
    "fromAddress" TEXT NOT NULL,
    "toAddress" TEXT NOT NULL,
    "fromTokenAccount" TEXT,
    "toTokenAccount" TEXT,
    "txHash" TEXT,
    "expiresAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "verification" JSONB,
    "userId" TEXT,
    "escrowAccountId" TEXT NOT NULL,
    "gameId" INTEGER NOT NULL,
    "gameParticipantId" TEXT,
    "betId" TEXT,
    "settlementEntryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameSettlement" (
    "id" TEXT NOT NULL,
    "gameId" INTEGER NOT NULL,
    "winningParticipantId" TEXT,
    "status" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
    "totalPool" BIGINT NOT NULL,
    "feeAmount" BIGINT NOT NULL,
    "payoutPool" BIGINT NOT NULL,
    "feeBps" INTEGER NOT NULL,
    "error" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettlementEntry" (
    "id" TEXT NOT NULL,
    "gameId" INTEGER NOT NULL,
    "settlementId" TEXT NOT NULL,
    "betId" TEXT,
    "userId" TEXT,
    "gameParticipantId" TEXT,
    "type" "SettlementEntryType" NOT NULL,
    "status" "SettlementEntryStatus" NOT NULL DEFAULT 'PENDING',
    "amount" BIGINT NOT NULL,
    "walletAddress" TEXT,
    "failureReason" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SettlementEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GameParticipant_gameId_agentId_key" ON "GameParticipant"("gameId", "agentId");

-- CreateIndex
CREATE UNIQUE INDEX "GameParticipant_id_gameId_key" ON "GameParticipant"("id", "gameId");

-- CreateIndex
CREATE UNIQUE INDEX "EscrowAccount_network_publicKey_key" ON "EscrowAccount"("network", "publicKey");

-- CreateIndex
CREATE UNIQUE INDEX "EscrowAccount_network_tokenAccount_key" ON "EscrowAccount"("network", "tokenAccount");

-- CreateIndex
CREATE UNIQUE INDEX "EscrowAccount_network_usdcMintAddress_publicKey_key" ON "EscrowAccount"("network", "usdcMintAddress", "publicKey");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_txHash_key" ON "Payment"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_id_gameId_key" ON "Payment"("id", "gameId");

-- CreateIndex
CREATE UNIQUE INDEX "GameSettlement_gameId_key" ON "GameSettlement"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "GameSettlement_id_gameId_key" ON "GameSettlement"("id", "gameId");

-- CreateIndex
CREATE UNIQUE INDEX "SettlementEntry_id_gameId_key" ON "SettlementEntry"("id", "gameId");

-- CreateIndex
CREATE UNIQUE INDEX "Bet_userId_gameParticipantId_key" ON "Bet"("userId", "gameParticipantId");

-- CreateIndex
CREATE UNIQUE INDEX "Bet_depositPaymentId_gameId_key" ON "Bet"("depositPaymentId", "gameId");

-- CreateIndex
CREATE UNIQUE INDEX "Bet_id_gameId_key" ON "Bet"("id", "gameId");

-- CreateIndex
CREATE UNIQUE INDEX "Game_winnerParticipantId_id_key" ON "Game"("winnerParticipantId", "id");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_escrowAccountId_fkey" FOREIGN KEY ("escrowAccountId") REFERENCES "EscrowAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_winnerParticipantId_id_fkey" FOREIGN KEY ("winnerParticipantId", "id") REFERENCES "GameParticipant"("id", "gameId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameParticipant" ADD CONSTRAINT "GameParticipant_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameParticipant" ADD CONSTRAINT "GameParticipant_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_gameParticipantId_gameId_fkey" FOREIGN KEY ("gameParticipantId", "gameId") REFERENCES "GameParticipant"("id", "gameId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_depositPaymentId_gameId_fkey" FOREIGN KEY ("depositPaymentId", "gameId") REFERENCES "Payment"("id", "gameId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_escrowAccountId_fkey" FOREIGN KEY ("escrowAccountId") REFERENCES "EscrowAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_gameParticipantId_gameId_fkey" FOREIGN KEY ("gameParticipantId", "gameId") REFERENCES "GameParticipant"("id", "gameId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_betId_gameId_fkey" FOREIGN KEY ("betId", "gameId") REFERENCES "Bet"("id", "gameId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_settlementEntryId_gameId_fkey" FOREIGN KEY ("settlementEntryId", "gameId") REFERENCES "SettlementEntry"("id", "gameId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSettlement" ADD CONSTRAINT "GameSettlement_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSettlement" ADD CONSTRAINT "GameSettlement_winningParticipantId_gameId_fkey" FOREIGN KEY ("winningParticipantId", "gameId") REFERENCES "GameParticipant"("id", "gameId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementEntry" ADD CONSTRAINT "SettlementEntry_settlementId_gameId_fkey" FOREIGN KEY ("settlementId", "gameId") REFERENCES "GameSettlement"("id", "gameId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementEntry" ADD CONSTRAINT "SettlementEntry_betId_gameId_fkey" FOREIGN KEY ("betId", "gameId") REFERENCES "Bet"("id", "gameId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementEntry" ADD CONSTRAINT "SettlementEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementEntry" ADD CONSTRAINT "SettlementEntry_gameParticipantId_gameId_fkey" FOREIGN KEY ("gameParticipantId", "gameId") REFERENCES "GameParticipant"("id", "gameId") ON DELETE RESTRICT ON UPDATE CASCADE;
