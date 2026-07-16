import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const note = await prisma.note.findUnique({ where: { id } })
  if (!note || note.autorId !== session.user.id) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  }

  const updated = await prisma.note.update({
    where: { id },
    data: {
      titulo: body.titulo ?? note.titulo,
      contenido: body.contenido ?? note.contenido,
      pinned: body.pinned ?? note.pinned,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params

  const note = await prisma.note.findUnique({ where: { id } })
  if (!note || note.autorId !== session.user.id) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  }

  await prisma.note.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
