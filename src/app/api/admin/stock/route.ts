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
    orderBy: [{ tipo: "asc" }, { nombre: "asc" }],
  })

  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || !rolesPermitidos.includes(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { tipo, nombre, cantidad } = await req.json()

  if (!tipo || !nombre) {
    return NextResponse.json({ error: "Tipo y nombre requeridos" }, { status: 400 })
  }

  const tiposValidos = ["TONER", "MOUSE", "TECLADO", "FUENTE"]
  if (!tiposValidos.includes(tipo)) {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 })
  }

  const item = await prisma.stockItem.create({
    data: { tipo, nombre, cantidad: cantidad ?? 0 },
  })

  return NextResponse.json(item, { status: 201 })
}
