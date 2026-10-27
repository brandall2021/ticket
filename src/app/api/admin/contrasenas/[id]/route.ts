import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"
import { encryptServerSecret } from "@/lib/servers"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()

  const password = await prisma.password.findUnique({ where: { id } })
  if (!password) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  }

  let encrypted: string | undefined
  if (typeof body.contrasena === "string" && body.contrasena !== "") {
    try {
      encrypted = encryptServerSecret(body.contrasena)
    } catch {
      return NextResponse.json({ error: "Cifrado de credenciales no configurado (SERVER_ENCRYPTION_KEY)" }, { status: 500 })
    }
  }

  const updated = await prisma.password.update({
    where: { id },
    data: {
      ip: body.ip ?? password.ip,
      usuario: body.usuario ?? password.usuario,
      ...(encrypted !== undefined ? { contrasena: encrypted } : {}),
      funcion: body.funcion ?? password.funcion,
      descripcion: body.descripcion ?? password.descripcion,
      activo: body.activo ?? password.activo,
    },
  })

  await logAudit(session.user.id!, "EDITAR_CONTRASENA", `Credencial ${updated.usuario}@${updated.ip}`)

  const { contrasena: _omit, ...safe } = updated
  void _omit
  return NextResponse.json({ ...safe, tieneContrasena: Boolean(updated.contrasena) })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { id } = await params

  const password = await prisma.password.findUnique({ where: { id } })
  if (!password) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  }

  await prisma.password.delete({ where: { id } })
  await logAudit(session.user.id!, "ELIMINAR_CONTRASENA", `Credencial ${password.usuario}@${password.ip}`)
  return NextResponse.json({ ok: true })
}
