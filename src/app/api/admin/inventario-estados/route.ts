import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-auth"
import { ROLES_ADMIN_AGENT } from "@/lib/constants"
import { crearEstadoEquipoSchema } from "@/lib/schemas"

export async function GET() {
  const authResult = await requireRole(ROLES_ADMIN_AGENT)
  if (authResult.error) return authResult.error

  const estados = await prisma.estadoEquipo.findMany({
    orderBy: { nombre: "asc" },
  })

  return NextResponse.json(estados)
}

export async function POST(req: NextRequest) {
  const authResult = await requireRole(ROLES_ADMIN_AGENT)
  if (authResult.error) return authResult.error

  const body = await req.json()
  const parsed = crearEstadoEquipoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const existe = await prisma.estadoEquipo.findUnique({ where: { nombre: parsed.data.nombre } })
  if (existe) {
    return NextResponse.json({ error: "Ya existe un estado con ese nombre" }, { status: 400 })
  }

  const estado = await prisma.estadoEquipo.create({
    data: { nombre: parsed.data.nombre, color: parsed.data.color || "#22c55e" },
  })

  return NextResponse.json(estado, { status: 201 })
}