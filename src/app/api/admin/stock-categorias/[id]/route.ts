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
  const { nombre, color, icono, activo } = await req.json()

  const data: Record<string, unknown> = {}
  if (nombre !== undefined) data.nombre = nombre
  if (color !== undefined) data.color = color
  if (icono !== undefined) data.icono = icono
  if (activo !== undefined) data.activo = activo

  const categoria = await prisma.stockCategoria.update({ where: { id }, data })
  return NextResponse.json(categoria)
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

  const count = await prisma.stockItem.count({ where: { categoriaId: id } })
  if (count > 0) {
    return NextResponse.json(
      { error: `No se puede eliminar: ${count} item(s) usan esta categoría` },
      { status: 400 }
    )
  }

  await prisma.stockCategoria.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
