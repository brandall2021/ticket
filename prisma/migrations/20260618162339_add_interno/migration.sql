-- CreateTable
CREATE TABLE "Interno" (
    "id" TEXT NOT NULL,
    "asesor" TEXT NOT NULL,
    "turno" TEXT NOT NULL,
    "campania" TEXT NOT NULL,
    "supervision" TEXT NOT NULL,
    "interno" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interno_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Interno_asesor_idx" ON "Interno"("asesor");

-- CreateIndex
CREATE INDEX "Interno_interno_idx" ON "Interno"("interno");

-- CreateIndex
CREATE INDEX "Interno_campania_idx" ON "Interno"("campania");
