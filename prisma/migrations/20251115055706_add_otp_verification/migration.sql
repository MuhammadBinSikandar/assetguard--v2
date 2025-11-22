-- AlterTable
ALTER TABLE "email_verification_tokens" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "otpCode" TEXT,
ALTER COLUMN "tokenHash" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "email_verification_tokens_otpCode_idx" ON "email_verification_tokens"("otpCode");
