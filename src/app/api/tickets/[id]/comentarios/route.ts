import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"
import { requireAuth } from "@/lib/api-auth"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth()
  if (authResult.error) return authResult.error

  const { id } = await params
  const { contenido } = await req.json()

  if (!contenido || typeof contenido !== "string" || !contenido.trim()) {
    return NextResponse.json({ error: "Contenido requerido" }, { status: 400 })
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    select: { id: true, clienteId: true },
  })

  if (!ticket) {
    return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 })
  }

  if (
    authResult.session!.user.role === "CLIENT" &&
    ticket.clienteId !== authResult.session!.user.id
  ) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const comment = await prisma.comment.create({
    data: {
      contenido: contenido.trim(),
      ticketId: id,
      autorId: authResult.session!.user.id,
    },
    include: { autor: { select: { name: true, image: true } } },
  })

  await logAudit(
    authResult.session!.user.id,
    "COMENTARIO",
    `Comentario en ticket ${id}`
  )

  return NextResponse.json(comment, { status: 201 })
}