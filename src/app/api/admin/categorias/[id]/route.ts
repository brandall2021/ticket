import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-auth"
import { ROLES } from "@/lib/constants"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole([ROLES.ADMIN])
  if (authResult.error) return authResult.error

  const { id } = await params
  const { nombre, color, activo } = await req.json()

  const data: Record<string, unknown> = {}
  if (nombre !== undefined) data.nombre = nombre
  if (color !== undefined) data.color = color
  if (activo !== undefined) data.activo = activo

  const categoria = await prisma.categoria.update({
    where: { id },
    data,
  })

  return NextResponse.json(categoria)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole([ROLES.ADMIN])
  if (authResult.error) return authResult.error

  const { id } = await params
  await prisma.categoria.delete({ where: { id } })

  return NextResponse.json({ success: true })
}