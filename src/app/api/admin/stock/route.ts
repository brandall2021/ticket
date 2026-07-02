import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-auth"
import { ROLES_ADMIN_AGENT } from "@/lib/constants"
import { crearStockItemSchema } from "@/lib/schemas"

export async function GET() {
  const authResult = await requireRole(ROLES_ADMIN_AGENT)
  if (authResult.error) return authResult.error

  const items = await prisma.stockItem.findMany({
    include: { categoria: true },
    orderBy: [{ categoria: { nombre: "asc" } }, { nombre: "asc" }],
  })

  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const authResult = await requireRole(ROLES_ADMIN_AGENT)
  if (authResult.error) return authResult.error

  const body = await req.json()
  const parsed = crearStockItemSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const cat = await prisma.stockCategoria.findUnique({ where: { id: parsed.data.categoriaId } })
  if (!cat) {
    return NextResponse.json({ error: "Categoría no encontrada" }, { status: 400 })
  }

  const item = await prisma.stockItem.create({
    data: { categoriaId: parsed.data.categoriaId, nombre: parsed.data.nombre, cantidad: parsed.data.cantidad ?? 0 },
    include: { categoria: true },
  })

  return NextResponse.json(item, { status: 201 })
}