import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-auth"

export async function GET() {
  const { session, error } = await requireAuth()
  if (error) return error

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { id: true, name: true, apellido: true, interno: true, cargo: true, email: true, role: true, createdAt: true },
  })

  return NextResponse.json(user)
}

export async function PATCH(req: NextRequest) {
  const { session, error } = await requireAuth()
  if (error) return error

  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.name !== undefined) data.name = body.name
  if (body.apellido !== undefined) data.apellido = body.apellido
  if (body.interno !== undefined) data.interno = body.interno

  const user = await prisma.user.update({
    where: { id: session!.user.id },
    data,
    select: { id: true, name: true, apellido: true, interno: true, cargo: true, email: true, role: true },
  })

  return NextResponse.json(user)
}
