-- CreateEnum
CREATE TYPE "TripRequestStatus" AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED'
);

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM (
  'PENDING',
  'PAID',
  'REFUNDED'
);

-- AlterTable
ALTER TABLE "Trip"
ADD COLUMN "availableSeats" INTEGER,
ADD COLUMN "recurrenceGroupId" TEXT;

-- Backfill existing trips before making availableSeats mandatory.
UPDATE "Trip"
SET "availableSeats" = "maxPassengers";

-- AlterTable
ALTER TABLE "Trip"
ALTER COLUMN "availableSeats" SET NOT NULL;

-- CreateTable
CREATE TABLE "TripRequest" (
  "id" TEXT NOT NULL,
  "status" "TripRequestStatus" NOT NULL DEFAULT 'PENDING',
  "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "amount" DECIMAL(10,2) NOT NULL,
  "pickupLocation" TEXT NOT NULL,
  "dropoffLocation" TEXT NOT NULL,
  "requestedPickupLocation" TEXT,
  "requestedDropoffLocation" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "tripId" TEXT NOT NULL,
  "passengerId" TEXT NOT NULL,

  CONSTRAINT "TripRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Trip_recurrenceGroupId_idx" ON "Trip"("recurrenceGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "TripRequest_tripId_passengerId_key"
ON "TripRequest"("tripId", "passengerId");

-- CreateIndex
CREATE INDEX "TripRequest_tripId_status_idx"
ON "TripRequest"("tripId", "status");

-- CreateIndex
CREATE INDEX "TripRequest_passengerId_idx"
ON "TripRequest"("passengerId");

-- AddForeignKey
ALTER TABLE "TripRequest"
ADD CONSTRAINT "TripRequest_tripId_fkey"
FOREIGN KEY ("tripId") REFERENCES "Trip"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripRequest"
ADD CONSTRAINT "TripRequest_passengerId_fkey"
FOREIGN KEY ("passengerId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
