ALTER TABLE "Password"
ADD COLUMN "usuario" TEXT NOT NULL DEFAULT '';

CREATE INDEX "Password_usuario_idx" ON "Password"("usuario");
