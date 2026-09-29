-- CreateTable
CREATE TABLE "MikrotikRouter" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "apiPort" INTEGER NOT NULL DEFAULT 8728,
    "useTls" BOOLEAN NOT NULL DEFAULT false,
    "user" TEXT NOT NULL DEFAULT 'admin',
    "password" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "identidad" TEXT,
    "version" TEXT,
    "boardName" TEXT,
    "cpuLoad" INTEGER,
    "freeMemory" DOUBLE PRECISION,
    "totalMemory" DOUBLE PRECISION,
    "uptime" TEXT,
    "ultimoEstado" TEXT,
    "ultimoError" TEXT,
    "ultimaConexion" TIMESTAMP(3),
    "notificarAdmin" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MikrotikRouter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MikrotikSnapshot" (
    "id" TEXT NOT NULL,
    "routerId" TEXT NOT NULL,
    "cpuLoad" INTEGER,
    "freeMemory" DOUBLE PRECISION,
    "totalMemory" DOUBLE PRECISION,
    "uptimeSec" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MikrotikSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MikrotikTraffic" (
    "id" TEXT NOT NULL,
    "routerId" TEXT NOT NULL,
    "iface" TEXT NOT NULL,
    "rxBytes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "txBytes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rxPackets" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "txPackets" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MikrotikTraffic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MikrotikAlert" (
    "id" TEXT NOT NULL,
    "routerId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "nivel" TEXT NOT NULL DEFAULT 'WARNING',
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MikrotikAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MikrotikRouter_host_idx" ON "MikrotikRouter"("host");

-- CreateIndex
CREATE INDEX "MikrotikRouter_activo_idx" ON "MikrotikRouter"("activo");

-- CreateIndex
CREATE INDEX "MikrotikSnapshot_routerId_createdAt_idx" ON "MikrotikSnapshot"("routerId", "createdAt");

-- CreateIndex
CREATE INDEX "MikrotikTraffic_routerId_iface_createdAt_idx" ON "MikrotikTraffic"("routerId", "iface", "createdAt");

-- CreateIndex
CREATE INDEX "MikrotikAlert_routerId_createdAt_idx" ON "MikrotikAlert"("routerId", "createdAt");

-- CreateIndex
CREATE INDEX "MikrotikAlert_leida_idx" ON "MikrotikAlert"("leida");

-- AddForeignKey
ALTER TABLE "MikrotikSnapshot" ADD CONSTRAINT "MikrotikSnapshot_routerId_fkey" FOREIGN KEY ("routerId") REFERENCES "MikrotikRouter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MikrotikTraffic" ADD CONSTRAINT "MikrotikTraffic_routerId_fkey" FOREIGN KEY ("routerId") REFERENCES "MikrotikRouter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MikrotikAlert" ADD CONSTRAINT "MikrotikAlert_routerId_fkey" FOREIGN KEY ("routerId") REFERENCES "MikrotikRouter"("id") ON DELETE CASCADE ON UPDATE CASCADE;