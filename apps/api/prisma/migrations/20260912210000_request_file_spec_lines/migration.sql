-- CreateTable
CREATE TABLE "RequestFileSpecLine" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "RequestFileSpecLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RequestFileSpecLine_fileId_position_key" ON "RequestFileSpecLine"("fileId", "position");

-- AddForeignKey
ALTER TABLE "RequestFileSpecLine" ADD CONSTRAINT "RequestFileSpecLine_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "RequestFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: existing files previously rendered request.specLines (pre-D-054).
INSERT INTO "RequestFileSpecLine" ("id", "fileId", "position", "name", "quantity", "unit", "comment", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    f."id",
    s."position",
    s."name",
    s."quantity",
    s."unit",
    s."comment",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "RequestFile" f
INNER JOIN "RequestSpecLine" s ON s."requestId" = f."requestId"
WHERE NOT EXISTS (
    SELECT 1
    FROM "RequestFileSpecLine" existing
    WHERE existing."fileId" = f."id"
);
