-- CreateEnum
CREATE TYPE "ClaimReason" AS ENUM ('DAMAGED', 'NOT_CONFORM', 'MISSING', 'DELAY', 'QUALITY', 'WITHDRAWAL', 'OTHER');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('RECEIVED', 'IN_REVIEW', 'AWAITING', 'RESOLVED', 'REJECTED');

-- CreateTable
CREATE TABLE "Claim" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'RECEIVED',
    "reason" "ClaimReason" NOT NULL,
    "userId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "orderId" TEXT,
    "orderNumber" TEXT,
    "description" TEXT NOT NULL,
    "attachments" JSONB,
    "internalNote" TEXT,
    "resolution" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimMessage" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "authorName" TEXT,
    "body" TEXT NOT NULL,
    "attachments" JSONB,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClaimMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Claim_number_key" ON "Claim"("number");

-- CreateIndex
CREATE INDEX "Claim_status_createdAt_idx" ON "Claim"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Claim_email_idx" ON "Claim"("email");

-- CreateIndex
CREATE INDEX "Claim_orderId_idx" ON "Claim"("orderId");

-- CreateIndex
CREATE INDEX "ClaimMessage_claimId_createdAt_idx" ON "ClaimMessage"("claimId", "createdAt");

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimMessage" ADD CONSTRAINT "ClaimMessage_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

