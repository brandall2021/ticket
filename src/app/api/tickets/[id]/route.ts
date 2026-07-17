import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"
import { sendEmail, ticketNotificationEmail, ticketCerradoEmail } from "@/lib/email"
import { requireRole } from "@/lib/api-auth"
import { requireAuth } from "@/lib/api-auth"
import { actualizarTicketSchema } from "@/lib/schemas"
import { STATUS_TRANSITIONS, STATUS_LABELS } from "@/lib/constants"
import { createNotification, createNotificationsForUsers } from "@/lib/notifications"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth()
  if (authResult.error) return authResult.error

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

  if (authResult.session!.user.role === "CLIENT" && ticket.clienteId !== authResult.session!.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  return NextResponse.json(ticket)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(["ADMIN"])
  if (authResult.error) return authResult.error

  const { id } = await params

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    select: { id: true, titulo: true },
  })

  if (!ticket) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  }

  await prisma.ticket.delete({ where: { id } })

  await logAudit(
    authResult.session!.user.id,
    "ELIMINAR_TICKET",
    `Ticket eliminado: ${ticket.titulo} (${id})`
  )

  return NextResponse.json({ success: true })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth()
  if (authResult.error) return authResult.error

  const { id } = await params

  const body = await req.json()
  const parsed = actualizarTicketSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const existing = await prisma.ticket.findUnique({
    where: { id },
    include: { cliente: { select: { email: true, name: true } } },
  })

  if (!existing) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  }

  const data: Record<string, unknown> = {}
  const changes: string[] = []

  if (parsed.data.titulo !== undefined) {
    data.titulo = parsed.data.titulo
    changes.push(`título: "${parsed.data.titulo}"`)
  }
  if (parsed.data.descripcion !== undefined) {
    data.descripcion = parsed.data.descripcion
    changes.push("descripción actualizada")
  }
  if (parsed.data.status !== undefined) {
    const allowed = STATUS_TRANSITIONS[existing.status]
    if (!allowed?.includes(parsed.data.status)) {
      return NextResponse.json(
        { error: `Transición inválida: de ${existing.status} a ${parsed.data.status}` },
        { status: 400 }
      )
    }
    data.status = parsed.data.status
    changes.push(`estado: ${existing.status} → ${parsed.data.status}`)
  }
  if (parsed.data.prioridad !== undefined) {
    data.prioridad = parsed.data.prioridad
    changes.push(`prioridad: ${existing.prioridad} → ${parsed.data.prioridad}`)
  }
  if (parsed.data.agenteId !== undefined) {
    data.agenteId = parsed.data.agenteId
    changes.push("agente asignado")
  }
  if (parsed.data.categoriaId !== undefined) {
    data.categoriaId = parsed.data.categoriaId
    changes.push("categoría cambiada")
  }
  if (parsed.data.ubicacion !== undefined) {
    data.ubicacion = parsed.data.ubicacion
    changes.push(`ubicación: "${parsed.data.ubicacion}"`)
  }
  if (parsed.data.solucion !== undefined) {
    data.solucion = parsed.data.solucion
    changes.push("solución registrada")
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
    authResult.session!.user.id,
    "MODIFICAR_TICKET",
    `Ticket ${id}: ${changes.join(", ")}`
  )

  const ticketUrl = `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/tickets/${id}`
  const actorName = authResult.session!.user.name || "Alguien"

  if (parsed.data.status && parsed.data.status !== existing.status) {
    const statusLabel = STATUS_LABELS[parsed.data.status] || parsed.data.status

    const notifyUserIds: string[] = []
    if (existing.clienteId !== authResult.session!.user.id) notifyUserIds.push(existing.clienteId)
    if (ticket.agenteId && ticket.agenteId !== authResult.session!.user.id) notifyUserIds.push(ticket.agenteId)

    await createNotificationsForUsers(
      notifyUserIds,
      "ticket",
      "Cambio de estado",
      `${existing.titulo} → ${statusLabel}`,
      ticketUrl
    )

    const esCerrado = parsed.data.status === "CERRADO"

    if (esCerrado) {
      const solucion =
        parsed.data.solucion || ticket.solucion || existing.descripcion
      await sendEmail({
        to: existing.cliente.email,
        ...ticketCerradoEmail({
          titulo: existing.titulo,
          nombre: existing.cliente.name,
          solucion,
          url: ticketUrl,
        }),
      })
    } else {
      await sendEmail({
        to: existing.cliente.email,
        ...ticketNotificationEmail({
          titulo: existing.titulo,
          status: parsed.data.status,
          url: ticketUrl,
          nombre: existing.cliente.name,
        }),
      })
    }

    if (ticket.agente?.email) {
      await sendEmail({
        to: ticket.agente.email,
        ...ticketNotificationEmail({
          titulo: existing.titulo,
          status: parsed.data.status,
          url: ticketUrl,
          nombre: ticket.agente.name,
        }),
      })
    }
  }

  if (parsed.data.agenteId && parsed.data.agenteId !== existing.agenteId) {
    const agente = await prisma.user.findUnique({
      where: { id: parsed.data.agenteId },
      select: { name: true },
    })
    if (agente && parsed.data.agenteId !== authResult.session!.user.id) {
      await createNotification({
        usuarioId: parsed.data.agenteId,
        tipo: "ticket",
        titulo: "Te asignaron un ticket",
        mensaje: `${actorName} te asignó: ${existing.titulo}`,
        url: ticketUrl,
      })
    }
  }

  return NextResponse.json(ticket)
}