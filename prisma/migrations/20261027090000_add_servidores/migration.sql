-- CreateEnum
CREATE TYPE "ServerProtocol" AS ENUM ('SSH', 'RDP');

-- CreateTable
CREATE TABLE "Server" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "protocolo" "ServerProtocol" NOT NULL DEFAULT 'SSH',
    "puerto" INTEGER NOT NULL DEFAULT 22,
    "usuario" TEXT NOT NULL DEFAULT 'root',
    "password" TEXT,
    "privateKey" TEXT,
    "passphrase" TEXT,
    "dominio" TEXT,
    "resolucion" TEXT NOT NULL DEFAULT '1280x800',
    "seguridad" TEXT NOT NULL DEFAULT 'any',
    "descripcion" TEXT,
    "grupo" TEXT,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fingerprint" TEXT,
    "ultimoEstado" TEXT,
    "ultimoError" TEXT,
    "ultimaConexion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Server_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServerSession" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "protocolo" "ServerProtocol" NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVA',
    "detalle" TEXT,
    "ip" TEXT,
    "inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fin" TIMESTAMP(3),
    "duracion" INTEGER,

    CONSTRAINT "ServerSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Server_host_idx" ON "Server"("host");

-- CreateIndex
CREATE INDEX "Server_activo_idx" ON "Server"("activo");

-- CreateIndex
CREATE INDEX "Server_protocolo_idx" ON "Server"("protocolo");

-- CreateIndex
CREATE INDEX "Server_grupo_idx" ON "Server"("grupo");

-- CreateIndex
CREATE INDEX "Server_nombre_idx" ON "Server"("nombre");

-- CreateIndex
CREATE INDEX "ServerSession_serverId_inicio_idx" ON "ServerSession"("serverId", "inicio");

-- CreateIndex
CREATE INDEX "ServerSession_usuarioId_idx" ON "ServerSession"("usuarioId");

-- CreateIndex
CREATE INDEX "ServerSession_estado_idx" ON "ServerSession"("estado");

-- AddForeignKey
ALTER TABLE "ServerSession" ADD CONSTRAINT "ServerSession_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerSession" ADD CONSTRAINT "ServerSession_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
