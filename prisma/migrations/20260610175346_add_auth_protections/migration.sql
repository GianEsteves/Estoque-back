-- AlterTable
ALTER TABLE "User" ADD COLUMN     "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "loginLockedUntil" TIMESTAMP(3),
ADD COLUMN     "resendCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "resendWindowStartedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "VerificationCode" ADD COLUMN     "failedAttempts" INTEGER NOT NULL DEFAULT 0;
