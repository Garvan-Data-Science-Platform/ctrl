/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Study` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `Study` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Study" ADD COLUMN     "name" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Study_name_key" ON "Study"("name");
