-- CreateTable
CREATE TABLE "Outbox" (
    "id" SERIAL NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "Outbox_pkey" PRIMARY KEY ("id")
);
