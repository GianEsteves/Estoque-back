-- CreateEnum
CREATE TYPE "VehicleCategory" AS ENUM (
  'SUV',
  'SEDAN',
  'HATCH',
  'PICKUP',
  'CROSSOVER',
  'MINIVAN',
  'VAN',
  'MOTORCYCLE'
);

-- CreateTable
CREATE TABLE "DriverProfile" (
  "id" TEXT NOT NULL,
  "cnh" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "userId" TEXT NOT NULL,

  CONSTRAINT "DriverProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
  "id" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "plate" TEXT NOT NULL,
  "color" TEXT NOT NULL,
  "category" "VehicleCategory" NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "driverProfileId" TEXT NOT NULL,

  CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DriverProfile_cnh_key" ON "DriverProfile"("cnh");

-- CreateIndex
CREATE UNIQUE INDEX "DriverProfile_userId_key" ON "DriverProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_plate_key" ON "Vehicle"("plate");

-- CreateIndex
CREATE INDEX "Vehicle_driverProfileId_idx" ON "Vehicle"("driverProfileId");

-- AddForeignKey
ALTER TABLE "DriverProfile"
ADD CONSTRAINT "DriverProfile_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle"
ADD CONSTRAINT "Vehicle_driverProfileId_fkey"
FOREIGN KEY ("driverProfileId") REFERENCES "DriverProfile"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
