-- CreateTable
CREATE TABLE "TenantChannel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'telegram',
    "channelId" TEXT NOT NULL,
    "label" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validatedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TenantChannel_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TenantChannel_tenantId_idx" ON "TenantChannel"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantChannel_tenantId_platform_key" ON "TenantChannel"("tenantId", "platform");