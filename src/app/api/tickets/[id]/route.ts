import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"
import { sendEmail, ticketNotificationEmail } from "@/lib/email"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      cliente: { select: { name: true, email: true } },
      agente: { select: { name: true, email: true } },
      categoria: { select: { nombre: true, color: true } },
      comments: {
        include: { autor: { select: { name: true, image: true } } },
        orderBy: { createdAt: "asc" },
      },
      attachments: true,
    },
  })

  if (!ticket) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  }

  if (session.user.role === "CLIENT" && ticket.clienteId !== session.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  return NextResponse.json(ticket)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()

  const existing = await prisma.ticket.findUnique({
    where: { id },
    include: { cliente: { select: { email: true, name: true } } },
  })

  if (!existing) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  }

  const data: Record<string, unknown> = {}
  const changes: string[] = []

  if (body.titulo !== undefined) {
    data.titulo = body.titulo
    changes.push(`título: "${body.titulo}"`)
  }
  if (body.descripcion !== undefined) {
    data.descripcion = body.descripcion
    changes.push("descripción actualizada")
  }
  if (body.status !== undefined) {
    data.status = body.status
    changes.push(`estado: ${existing.status} → ${body.status}`)
  }
  if (body.prioridad !== undefined) {
    data.prioridad = body.prioridad
    changes.push(`prioridad: ${existing.prioridad} → ${body.prioridad}`)
  }
  if (body.agenteId !== undefined) {
    data.agenteId = body.agenteId
    changes.push("agente asignado")
  }
  if (body.categoriaId !== undefined) {
    data.categoriaId = body.categoriaId
    changes.push("categoría cambiada")
  }
  if (body.ubicacion !== undefined) {
    data.ubicacion = body.ubicacion
    changes.push(`ubicación: "${body.ubicacion}"`)
  }

  if (changes.length === 0) {
    return NextResponse.json({ error: "Sin cambios" }, { status: 400 })
  }

  const ticket = await prisma.ticket.update({
    where: { id },
    data,
    include: {
      cliente: { select: { name: true, email: true } },
      agente: { select: { name: true, email: true } },
      categoria: { select: { nombre: true, color: true } },
    },
  })

  await logAudit(
    session.user.id,
    "MODIFICAR_TICKET",
    `Ticket ${id}: ${changes.join(", ")}`
  )

  if (body.status && body.status !== existing.status) {
    const ticketUrl = `${
      process.env.NEXT_PUBLIC_URL || "http://localhost:3000"
    }/tickets/${id}`

    await sendEmail({
      to: existing.cliente.email,
      ...ticketNotificationEmail({
        titulo: existing.titulo,
        status: body.status,
        url: ticketUrl,
        nombre: existing.cliente.name,
      }),
    })

    if (ticket.agente?.email) {
      await sendEmail({
        to: ticket.agente.email,
        ...ticketNotificationEmail({
          titulo: existing.titulo,
          status: body.status,
          url: ticketUrl,
          nombre: ticket.agente.name,
        }),
      })
    }
  }

  return NextResponse.json(ticket)
}
