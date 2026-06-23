import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const rolesPermitidos = ["ADMIN", "AGENT"]

export async function GET() {
  const session = await auth()
  if (!session?.user || !rolesPermitidos.includes(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const items = await prisma.stockItem.findMany({
    include: { categoria: true },
    orderBy: [{ categoria: { nombre: "asc" } }, { nombre: "asc" }],
  })

  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || !rolesPermitidos.includes(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { categoriaId, nombre, cantidad } = await req.json()

  if (!categoriaId || !nombre) {
    return NextResponse.json({ error: "Categoría y nombre requeridos" }, { status: 400 })
  }

  const cat = await prisma.stockCategoria.findUnique({ where: { id: categoriaId } })
  if (!cat) {
    return NextResponse.json({ error: "Categoría no encontrada" }, { status: 400 })
  }

  const item = await prisma.stockItem.create({
    data: { categoriaId, nombre, cantidad: cantidad ?? 0 },
    include: { categoria: true },
  })

  return NextResponse.json(item, { status: 201 })
}
