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
  const { nombre, cantidad, categoriaId } = await req.json()

  const data: Record<string, unknown> = {}
  if (nombre !== undefined) data.nombre = nombre
  if (categoriaId !== undefined) data.categoriaId = categoriaId
  if (cantidad !== undefined) data.cantidad = cantidad

  const item = await prisma.stockItem.update({
    where: { id },
    data,
    include: { categoria: true },
  })

  return NextResponse.json(item)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(ROLES_ADMIN_AGENT)
  if (authResult.error) return authResult.error

  const { id } = await params
  await prisma.stockItem.delete({ where: { id } })

  return NextResponse.json({ success: true })
}