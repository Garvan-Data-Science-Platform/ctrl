/*
  Warnings:

  - You are about to drop the column `mailerHost` on the `Organisation` table. All the data in the column will be lost.
  - You are about to drop the column `mailerPassword` on the `Organisation` table. All the data in the column will be lost.
  - You are about to drop the column `mailerPort` on the `Organisation` table. All the data in the column will be lost.
  - You are about to drop the column `mailerUser` on the `Organisation` table. All the data in the column will be lost.
  - You are about to drop the column `redcapToken` on the `Organisation` table. All the data in the column will be lost.
  - You are about to drop the column `redcapURL` on the `Organisation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Organisation" DROP COLUMN "mailerHost",
DROP COLUMN "mailerPassword",
DROP COLUMN "mailerPort",
DROP COLUMN "mailerUser",
DROP COLUMN "redcapToken",
DROP COLUMN "redcapURL";

-- AlterTable
ALTER TABLE "Study" ADD COLUMN     "redcapToken" TEXT,
ADD COLUMN     "redcapURL" TEXT;
