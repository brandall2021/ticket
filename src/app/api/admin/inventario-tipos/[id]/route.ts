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
  const { nombre, color, activo } = await req.json()

  const data: Record<string, unknown> = {}
  if (nombre !== undefined) data.nombre = nombre
  if (color !== undefined) data.color = color
  if (activo !== undefined) data.activo = activo

  try {
    const tipo = await prisma.tipoEquipo.update({ where: { id }, data })
    return NextResponse.json(tipo)
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Ya existe un tipo con ese nombre" }, { status: 400 })
    }
    throw e
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(ROLES_ADMIN_AGENT)
  if (authResult.error) return authResult.error

  const { id } = await params

  const count = await prisma.equipo.count({ where: { tipoId: id } })
  if (count > 0) {
    return NextResponse.json(
      { error: `No se puede eliminar: ${count} equipo(s) usan este tipo` },
      { status: 400 }
    )
  }

  await prisma.tipoEquipo.delete({ where: { id } })
  return NextResponse.json({ success: true })
}