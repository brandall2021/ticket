import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const categorias = await prisma.categoria.findMany({
    where: { activo: true },
    select: { id: true, nombre: true, color: true },
    orderBy: { nombre: "asc" },
  })
  return NextResponse.json(categorias)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { nombre, color } = await req.json()

  if (!nombre) {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 })
  }

  const categoria = await prisma.categoria.create({
    data: { nombre, color: color || "#3b82f6" },
  })

  return NextResponse.json(categoria, { status: 201 })
}
