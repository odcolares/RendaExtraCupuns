-- CreateTable
CREATE TABLE "Click" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "offerId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Click_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Click_tenantId_createdAt_idx" ON "Click"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Click_offerId_idx" ON "Click"("offerId");