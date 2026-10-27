import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"
import { decryptServerSecret } from "@/lib/servers"

/**
 * Revela una credencial puntual. Es el único endpoint que devuelve el secreto y
 * cada acceso queda auditado.
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { id } = await params
  const entry = await prisma.password.findUnique({ where: { id } })
  if (!entry) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  }

  let contrasena: string
  try {
    contrasena = decryptServerSecret(entry.contrasena)
  } catch {
    return NextResponse.json({ error: "No se pudo descifrar la credencial" }, { status: 500 })
  }

  await logAudit(
    session.user.id!,
    "REVELAR_CONTRASENA",
    `Credencial ${entry.usuario}@${entry.ip} (${entry.funcion})`
  )

  return NextResponse.json({ contrasena })
}
