-- CreateTable
CREATE TABLE "Instructivo" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT 'Instructivo de Gestión',
    "url" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Instructivo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Instructivo_title_idx" ON "Instructivo"("title");
