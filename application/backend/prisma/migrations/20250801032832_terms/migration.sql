-- AlterTable
ALTER TABLE "Organisation" ADD COLUMN     "tcLink" TEXT NOT NULL DEFAULT 'https://garvan-data-science-platform.github.io/ctrl-docs/terms';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "agreedTermsAt" TIMESTAMP(3);
