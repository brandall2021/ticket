import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-auth"
import { ROLES_ADMIN_AGENT } from "@/lib/constants"
import { crearTipoEquipoSchema } from "@/lib/schemas"

export async function GET() {
  const authResult = await requireRole(ROLES_ADMIN_AGENT)
  if (authResult.error) return authResult.error

  const tipos = await prisma.tipoEquipo.findMany({
    orderBy: { nombre: "asc" },
  })

  return NextResponse.json(tipos)
}

export async function POST(req: NextRequest) {
  const authResult = await requireRole(ROLES_ADMIN_AGENT)
  if (authResult.error) return authResult.error

  const body = await req.json()
  const parsed = crearTipoEquipoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const existe = await prisma.tipoEquipo.findUnique({ where: { nombre: parsed.data.nombre } })
  if (existe) {
    return NextResponse.json({ error: "Ya existe un tipo con ese nombre" }, { status: 400 })
  }

  const tipo = await prisma.tipoEquipo.create({
    data: { nombre: parsed.data.nombre, color: parsed.data.color || "#3b82f6" },
  })

  return NextResponse.json(tipo, { status: 201 })
}