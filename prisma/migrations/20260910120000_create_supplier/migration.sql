CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "tradeName" TEXT,
    "document" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Supplier_document_key" ON "Supplier"("document");
CREATE INDEX "Supplier_legalName_idx" ON "Supplier"("legalName");
CREATE INDEX "Supplier_isActive_idx" ON "Supplier"("isActive");
