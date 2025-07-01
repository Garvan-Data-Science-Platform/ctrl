/*
  Warnings:

  - The primary key for the `Invite` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `studyId` to the `Invite` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Invite" DROP CONSTRAINT "Invite_pkey",
ADD COLUMN     "studyId" INTEGER NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Invite_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Invite_id_seq";

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "Study"("id") ON DELETE CASCADE ON UPDATE CASCADE;
