-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM (
  'AVAILABLE',
  'CANCELLED',
  'COMPLETED'
);

-- CreateEnum
CREATE TYPE "TripPointType" AS ENUM (
  'PICKUP',
  'DROPOFF'
);

-- CreateTable
CREATE TABLE "Trip" (
  "id" TEXT NOT NULL,
  "origin" TEXT NOT NULL,
  "destination" TEXT NOT NULL,
  "departureAt" TIMESTAMP(3) NOT NULL,
  "price" DECIMAL(10,2) NOT NULL,
  "maxPassengers" INTEGER NOT NULL,
  "description" TEXT,
  "status" "TripStatus" NOT NULL DEFAULT 'AVAILABLE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "driverProfileId" TEXT NOT NULL,

  CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripPoint" (
  "id" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "type" "TripPointType" NOT NULL,
  "order" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "tripId" TEXT NOT NULL,

  CONSTRAINT "TripPoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Trip_driverProfileId_idx" ON "Trip"("driverProfileId");

-- CreateIndex
CREATE INDEX "Trip_departureAt_idx" ON "Trip"("departureAt");

-- CreateIndex
CREATE INDEX "Trip_status_idx" ON "Trip"("status");

-- CreateIndex
CREATE INDEX "TripPoint_tripId_type_idx" ON "TripPoint"("tripId", "type");

-- AddForeignKey
ALTER TABLE "Trip"
ADD CONSTRAINT "Trip_driverProfileId_fkey"
FOREIGN KEY ("driverProfileId") REFERENCES "DriverProfile"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripPoint"
ADD CONSTRAINT "TripPoint_tripId_fkey"
FOREIGN KEY ("tripId") REFERENCES "Trip"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
