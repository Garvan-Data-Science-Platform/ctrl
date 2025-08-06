-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lockedUntil" TIMESTAMP(3),
ADD COLUMN     "retriesRemaining" INTEGER NOT NULL DEFAULT 10;

-- CreateTable
CREATE TABLE "OTPToken" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OTPToken_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OTPToken" ADD CONSTRAINT "OTPToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
