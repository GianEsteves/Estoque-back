-- AlterTable
ALTER TABLE "Trip" ADD COLUMN "vehicleId" TEXT;

-- Backfill existing trips with the oldest vehicle owned by the same driver.
UPDATE "Trip"
SET "vehicleId" = (
  SELECT "Vehicle"."id"
  FROM "Vehicle"
  WHERE "Vehicle"."driverProfileId" = "Trip"."driverProfileId"
  ORDER BY "Vehicle"."createdAt" ASC
  LIMIT 1
);

-- Abort instead of leaving trips without a vehicle association.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Trip" WHERE "vehicleId" IS NULL) THEN
    RAISE EXCEPTION 'Existem viagens sem veiculo disponivel para associacao';
  END IF;
END $$;

-- AlterTable
ALTER TABLE "Trip" ALTER COLUMN "vehicleId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Trip_vehicleId_idx" ON "Trip"("vehicleId");

-- AddForeignKey
ALTER TABLE "Trip"
ADD CONSTRAINT "Trip_vehicleId_fkey"
FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
