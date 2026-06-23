import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const rolesPermitidos = ["ADMIN", "AGENT"]

export async function GET() {
  const session = await auth()
  if (!session?.user || !rolesPermitidos.includes(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const categorias = await prisma.stockCategoria.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
  })

  return NextResponse.json(categorias)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || !rolesPermitidos.includes(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { nombre, color, icono } = await req.json()

  if (!nombre) {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 })
  }

  const existe = await prisma.stockCategoria.findUnique({ where: { nombre } })
  if (existe) {
    return NextResponse.json({ error: "Ya existe una categoría con ese nombre" }, { status: 400 })
  }

  const categoria = await prisma.stockCategoria.create({
    data: { nombre, color: color || "#3b82f6", icono: icono || "Package" },
  })

  return NextResponse.json(categoria, { status: 201 })
}
