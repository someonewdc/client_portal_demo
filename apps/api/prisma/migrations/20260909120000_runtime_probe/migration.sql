-- CreateTable
CREATE TABLE "RuntimeProbe" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RuntimeProbe_pkey" PRIMARY KEY ("id")
);
