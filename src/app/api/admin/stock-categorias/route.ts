import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-auth"
import { ROLES_ADMIN_AGENT } from "@/lib/constants"
import { crearStockCategoriaSchema } from "@/lib/schemas"

export async function GET() {
  const authResult = await requireRole(ROLES_ADMIN_AGENT)
  if (authResult.error) return authResult.error

  const categorias = await prisma.stockCategoria.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
  })

  return NextResponse.json(categorias)
}

export async function POST(req: NextRequest) {
  const authResult = await requireRole(ROLES_ADMIN_AGENT)
  if (authResult.error) return authResult.error

  const body = await req.json()
  const parsed = crearStockCategoriaSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const existe = await prisma.stockCategoria.findUnique({ where: { nombre: parsed.data.nombre } })
  if (existe) {
    return NextResponse.json({ error: "Ya existe una categoría con ese nombre" }, { status: 400 })
  }

  const categoria = await prisma.stockCategoria.create({
    data: { nombre: parsed.data.nombre, color: parsed.data.color || "#3b82f6", icono: parsed.data.icono || "Package" },
  })

  return NextResponse.json(categoria, { status: 201 })
}