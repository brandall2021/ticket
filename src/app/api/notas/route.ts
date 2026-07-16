import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q") || ""

  const where: Record<string, unknown> = { autorId: session.user.id }

  if (q) {
    where.OR = [
      { titulo: { contains: q, mode: "insensitive" } },
      { contenido: { contains: q, mode: "insensitive" } },
    ]
  }

  const notes = await prisma.note.findMany({
    where,
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  })

  return NextResponse.json(notes)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await req.json()
  const { titulo, contenido } = body

  if (!titulo || !contenido) {
    return NextResponse.json({ error: "Título y contenido son requeridos" }, { status: 400 })
  }

  const note = await prisma.note.create({
    data: {
      titulo,
      contenido,
      autorId: session.user.id!,
    },
  })

  return NextResponse.json(note)
}
