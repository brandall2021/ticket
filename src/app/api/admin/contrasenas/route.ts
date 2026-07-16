import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q") || ""

  const where: Record<string, unknown> = {}

  if (q) {
    where.OR = [
      { ip: { contains: q, mode: "insensitive" } },
      { funcion: { contains: q, mode: "insensitive" } },
      { descripcion: { contains: q, mode: "insensitive" } },
      { contrasena: { contains: q, mode: "insensitive" } },
    ]
  }

  const passwords = await prisma.password.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { autor: { select: { name: true, email: true } } },
  })

  return NextResponse.json(passwords)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const body = await req.json()
  const { ip, contrasena, funcion, descripcion } = body

  if (!ip || !contrasena || !funcion || !descripcion) {
    return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
  }

  const password = await prisma.password.create({
    data: {
      ip,
      contrasena,
      funcion,
      descripcion,
      autorId: session.user.id!,
    },
  })

  return NextResponse.json(password)
}
