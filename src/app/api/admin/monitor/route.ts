import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-auth"
import { ROLES_ADMIN } from "@/lib/constants"
import { crearMonitorGroupSchema } from "@/lib/schemas"

export async function GET() {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  const grupos = await prisma.monitorGroup.findMany({
    include: {
      hosts: {
        orderBy: { nombre: "asc" },
        include: {
          pings: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
    orderBy: { nombre: "asc" },
  })

  return NextResponse.json(grupos)
}

export async function POST(req: NextRequest) {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  const body = await req.json()
  const parsed = crearMonitorGroupSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const existing = await prisma.monitorGroup.findUnique({ where: { nombre: parsed.data.nombre } })
  if (existing) {
    return NextResponse.json({ error: "Ya existe un grupo con ese nombre" }, { status: 400 })
  }

  const grupo = await prisma.monitorGroup.create({
    data: { nombre: parsed.data.nombre, color: parsed.data.color },
  })

  return NextResponse.json(grupo, { status: 201 })
}
