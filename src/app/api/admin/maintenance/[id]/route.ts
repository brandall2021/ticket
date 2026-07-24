import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-auth"
import { ROLES_ADMIN } from "@/lib/constants"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  const { id } = await params

  const item = await prisma.maintenance.findUnique({ where: { id } })
  if (!item) {
    return NextResponse.json({ error: "Mantenimiento no encontrado" }, { status: 404 })
  }

  return NextResponse.json(item)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  const { id } = await params
  const body = await req.json()

  const existing = await prisma.maintenance.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: "Mantenimiento no encontrado" }, { status: 404 })
  }

  const validStatuses = ["PROGRAMADO", "EN_CURSO", "FINALIZADO"]
  if (body.status && !validStatuses.includes(body.status)) {
    return NextResponse.json(
      { error: `Status inválido. Valores permitidos: ${validStatuses.join(", ")}` },
      { status: 400 }
    )
  }

  const data: Record<string, unknown> = {}
  if (body.titulo !== undefined) data.titulo = body.titulo
  if (body.descripcion !== undefined) data.descripcion = body.descripcion || null
  if (body.scheduledAt !== undefined) data.scheduledAt = new Date(body.scheduledAt)
  if (body.duration !== undefined) data.duration = body.duration
  if (body.status !== undefined) data.status = body.status
  if (body.hostIds !== undefined) data.hostIds = body.hostIds

  const item = await prisma.maintenance.update({
    where: { id },
    data,
  })

  return NextResponse.json(item)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  const { id } = await params

  const existing = await prisma.maintenance.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: "Mantenimiento no encontrado" }, { status: 404 })
  }

  await prisma.maintenance.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
