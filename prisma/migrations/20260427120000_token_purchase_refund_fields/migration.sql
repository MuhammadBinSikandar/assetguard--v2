-- AlterTable
ALTER TABLE "token_purchases" ADD COLUMN "refundTxHash" TEXT;
ALTER TABLE "token_purchases" ADD COLUMN "refundedAt" TIMESTAMP(3);
