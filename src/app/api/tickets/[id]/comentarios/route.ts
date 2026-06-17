import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const { contenido } = await req.json()

  if (!contenido) {
    return NextResponse.json(
      { error: "Contenido requerido" },
      { status: 400 }
    )
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    select: { id: true, clienteId: true },
  })

  if (!ticket) {
    return NextResponse.json(
      { error: "Ticket no encontrado" },
      { status: 404 }
    )
  }

  if (
    session.user.role === "CLIENT" &&
    ticket.clienteId !== session.user.id
  ) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const comment = await prisma.comment.create({
    data: {
      contenido,
      ticketId: id,
      autorId: session.user.id,
    },
    include: {
      autor: { select: { name: true, image: true } },
    },
  })

  await logAudit(
    session.user.id,
    "COMENTARIO",
    `Comentario en ticket ${id}`
  )

  return NextResponse.json(comment, { status: 201 })
}
