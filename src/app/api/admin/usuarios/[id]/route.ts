import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { requireRole } from "@/lib/api-auth"
import { ROLES } from "@/lib/constants"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole([ROLES.ADMIN])
  if (authResult.error) return authResult.error

  const { id } = await params
  const body = await req.json()

  const data: Record<string, unknown> = {}
  if (body.name !== undefined) data.name = body.name
  if (body.email !== undefined) data.email = body.email
  if (body.role !== undefined) data.role = body.role
  if (body.activo !== undefined) data.activo = body.activo
  if (body.password) {
    data.password = await bcrypt.hash(body.password, 12)
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, activo: true, createdAt: true },
  })

  return NextResponse.json(user)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole([ROLES.ADMIN])
  if (authResult.error) return authResult.error

  const { id } = await params
  await prisma.user.delete({ where: { id } })

  return NextResponse.json({ success: true })
}