CREATE TYPE "SaleStatus" AS ENUM ('COMPLETED', 'CANCELLED');

CREATE TABLE "StockEntry" (
  "id" TEXT NOT NULL, "supplierId" TEXT NOT NULL, "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notes" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "userId" TEXT,
  CONSTRAINT "StockEntry_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "StockEntryItem" (
  "id" TEXT NOT NULL, "entryId" TEXT NOT NULL, "productId" TEXT NOT NULL, "quantity" INTEGER NOT NULL,
  "unitCost" DECIMAL(12,2) NOT NULL, CONSTRAINT "StockEntryItem_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Sale" (
  "id" TEXT NOT NULL, "customerId" TEXT, "userId" TEXT NOT NULL, "status" "SaleStatus" NOT NULL DEFAULT 'COMPLETED',
  "paymentMethod" TEXT NOT NULL, "discount" DECIMAL(12,2) NOT NULL DEFAULT 0, "subtotal" DECIMAL(12,2) NOT NULL,
  "total" DECIMAL(12,2) NOT NULL, "cancellationReason" TEXT, "cancelledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SaleItem" (
  "id" TEXT NOT NULL, "saleId" TEXT NOT NULL, "productId" TEXT NOT NULL, "quantity" INTEGER NOT NULL,
  "unitPrice" DECIMAL(12,2) NOT NULL, "discount" DECIMAL(12,2) NOT NULL DEFAULT 0, "total" DECIMAL(12,2) NOT NULL,
  CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "StockEntry_supplierId_receivedAt_idx" ON "StockEntry"("supplierId", "receivedAt");
CREATE INDEX "StockEntryItem_productId_idx" ON "StockEntryItem"("productId");
CREATE INDEX "Sale_customerId_createdAt_idx" ON "Sale"("customerId", "createdAt");
CREATE INDEX "Sale_userId_createdAt_idx" ON "Sale"("userId", "createdAt");
CREATE INDEX "Sale_status_createdAt_idx" ON "Sale"("status", "createdAt");
CREATE INDEX "SaleItem_productId_idx" ON "SaleItem"("productId");
ALTER TABLE "StockEntry" ADD CONSTRAINT "StockEntry_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockEntry" ADD CONSTRAINT "StockEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockEntryItem" ADD CONSTRAINT "StockEntryItem_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "StockEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockEntryItem" ADD CONSTRAINT "StockEntryItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
