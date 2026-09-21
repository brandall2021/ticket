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
  const { tipoId, estadoId, nroInventario, marca, modelo, serie, ubicacion, ipPc } = await req.json()

  const data: Record<string, unknown> = {}
  if (tipoId !== undefined) data.tipoId = tipoId
  if (estadoId !== undefined) data.estadoId = estadoId
  if (nroInventario !== undefined) data.nroInventario = nroInventario
  if (marca !== undefined) data.marca = marca
  if (modelo !== undefined) data.modelo = modelo
  if (serie !== undefined) data.serie = serie
  if (ubicacion !== undefined) data.ubicacion = ubicacion
  if (ipPc !== undefined) data.ipPc = ipPc

  try {
    const equipo = await prisma.equipo.update({
      where: { id },
      data,
      include: { tipo: true, estado: true },
    })
    return NextResponse.json(equipo)
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Ya existe un equipo con ese N° de inventario" }, { status: 400 })
    }
    if (typeof e === "object" && e !== null && (e as { code?: string }).code === "P2003") {
      return NextResponse.json({ error: "Tipo o estado no válido" }, { status: 400 })
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
  await prisma.equipo.delete({ where: { id } })

  return NextResponse.json({ success: true })
}