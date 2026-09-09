-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('accepted', 'in_calculation', 'quote_ready', 'invoice_issued');

-- CreateEnum
CREATE TYPE "RequestFileKind" AS ENUM ('questionnaire', 'quote', 'invoice');

-- DropTable
DROP TABLE "RuntimeProbe";

-- CreateTable
CREATE TABLE "Request" (
    "id" TEXT NOT NULL,
    "publicNumber" TEXT NOT NULL,
    "counterpartyName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL,
    "accessSecretHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestSpecLine" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequestSpecLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestFile" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "kind" "RequestFileKind" NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequestFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestStageHistory" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL,
    "reachedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequestStageHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Request_publicNumber_key" ON "Request"("publicNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Request_accessSecretHash_key" ON "Request"("accessSecretHash");

-- CreateIndex
CREATE INDEX "Request_status_idx" ON "Request"("status");

-- CreateIndex
CREATE INDEX "RequestSpecLine_requestId_idx" ON "RequestSpecLine"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "RequestSpecLine_requestId_position_key" ON "RequestSpecLine"("requestId", "position");

-- CreateIndex
CREATE INDEX "RequestFile_requestId_idx" ON "RequestFile"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "RequestFile_requestId_position_key" ON "RequestFile"("requestId", "position");

-- CreateIndex
CREATE INDEX "RequestStageHistory_requestId_idx" ON "RequestStageHistory"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "RequestStageHistory_requestId_status_key" ON "RequestStageHistory"("requestId", "status");

-- AddForeignKey
ALTER TABLE "RequestSpecLine" ADD CONSTRAINT "RequestSpecLine_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestFile" ADD CONSTRAINT "RequestFile_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestStageHistory" ADD CONSTRAINT "RequestStageHistory_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;
