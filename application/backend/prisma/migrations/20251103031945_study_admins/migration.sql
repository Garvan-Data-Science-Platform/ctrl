-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'StudyAdmin';

-- CreateTable
CREATE TABLE "_StudyToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_StudyToUser_AB_unique" ON "_StudyToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_StudyToUser_B_index" ON "_StudyToUser"("B");

-- AddForeignKey
ALTER TABLE "_StudyToUser" ADD CONSTRAINT "_StudyToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Study"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StudyToUser" ADD CONSTRAINT "_StudyToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
