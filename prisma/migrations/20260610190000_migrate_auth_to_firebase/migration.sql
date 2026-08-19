-- DropForeignKey
ALTER TABLE "VerificationCode"
DROP CONSTRAINT "VerificationCode_userId_fkey";

-- DropTable
DROP TABLE "VerificationCode";

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "firebaseUid" TEXT NOT NULL,
DROP COLUMN "passwordHash",
DROP COLUMN "failedLoginAttempts",
DROP COLUMN "loginLockedUntil",
DROP COLUMN "resendCount",
DROP COLUMN "resendWindowStartedAt";

-- CreateIndex
CREATE UNIQUE INDEX "User_firebaseUid_key" ON "User"("firebaseUid");
