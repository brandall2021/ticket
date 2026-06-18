import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const rolesPermitidos = ["ADMIN", "AGENT"]

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || !rolesPermitidos.includes(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const { nombre, cantidad, tipo } = await req.json()

  const data: Record<string, unknown> = {}
  if (nombre !== undefined) data.nombre = nombre
  if (tipo !== undefined) data.tipo = tipo
  if (cantidad !== undefined) data.cantidad = cantidad

  const item = await prisma.stockItem.update({
    where: { id },
    data,
  })

  return NextResponse.json(item)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || !rolesPermitidos.includes(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  await prisma.stockItem.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
