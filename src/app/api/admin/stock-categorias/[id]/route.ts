import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-auth"
import { ROLES_ADMIN_AGENT } from "@/lib/constants"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(ROLES_ADMIN_AGENT)
  if (authResult.error) return authResult.error

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
  const authResult = await requireRole(ROLES_ADMIN_AGENT)
  if (authResult.error) return authResult.error

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