/*
  Warnings:

  - You are about to drop the column `avatarUrl` on the `Agent` table. All the data in the column will be lost.
  - Added the required column `accent` to the `Agent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Agent" DROP COLUMN "avatarUrl",
ADD COLUMN     "accent" TEXT NOT NULL;
