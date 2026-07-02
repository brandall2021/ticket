-- CreateTable
CREATE TABLE "StockCategoria" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "icono" TEXT NOT NULL DEFAULT 'Package',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockCategoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockItem" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "categoriaId" TEXT NOT NULL,

    CONSTRAINT "StockItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StockCategoria_nombre_key" ON "StockCategoria"("nombre");

-- CreateIndex
CREATE INDEX "StockCategoria_activo_idx" ON "StockCategoria"("activo");

-- CreateIndex
CREATE INDEX "StockItem_categoriaId_idx" ON "StockItem"("categoriaId");

-- AddForeignKey
ALTER TABLE "StockItem" ADD CONSTRAINT "StockItem_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "StockCategoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
