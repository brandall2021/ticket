import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

  const updated = await prisma.password.update({
    where: { id },
    data: {
      ip: body.ip ?? password.ip,
      contrasena: body.contrasena ?? password.contrasena,
      funcion: body.funcion ?? password.funcion,
      descripcion: body.descripcion ?? password.descripcion,
      activo: body.activo ?? password.activo,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
  return NextResponse.json({ ok: true })
}
