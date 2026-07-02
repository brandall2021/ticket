import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-auth"
import { ROLES } from "@/lib/constants"
import { crearCategoriaSchema } from "@/lib/schemas"

export async function GET() {
  const authResult = await requireRole([ROLES.ADMIN])
  if (authResult.error) return authResult.error

  const categorias = await prisma.categoria.findMany({
    orderBy: { nombre: "asc" },
  })

  return NextResponse.json(categorias)
}

export async function POST(req: NextRequest) {
  const authResult = await requireRole([ROLES.ADMIN])
  if (authResult.error) return authResult.error

  const body = await req.json()
  const parsed = crearCategoriaSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const categoria = await prisma.categoria.create({
    data: { nombre: parsed.data.nombre, color: parsed.data.color || "#3b82f6" },
  })

  return NextResponse.json(categoria, { status: 201 })
}