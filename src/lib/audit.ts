import { prisma } from "./prisma"

export async function logAudit(usuarioId: string, accion: string, detalle?: string) {
  try {
    await prisma.auditLog.create({ data: { usuarioId, accion, detalle } })
  } catch {
    // silent fail
  }
}
