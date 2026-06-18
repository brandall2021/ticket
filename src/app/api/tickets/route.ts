import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"
import { sendEmail, ticketNotificationEmail } from "@/lib/email"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const { role, id: userId } = session.user

  if (role === "CLIENT") {
    const tickets = await prisma.ticket.findMany({
      where: { clienteId: userId },
      include: {
        cliente: { select: { name: true, email: true } },
        agente: { select: { name: true } },
        categoria: { select: { nombre: true, color: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(tickets)
  }

  const where: Record<string, unknown> = {}
  const status = searchParams.get("status")
  const prioridad = searchParams.get("prioridad")
  const q = searchParams.get("q")

  if (status) where.status = status
  if (prioridad) where.prioridad = prioridad
  if (q) where.titulo = { contains: q, mode: "insensitive" }

  const tickets = await prisma.ticket.findMany({
    where,
    include: {
      cliente: { select: { name: true, email: true } },
      agente: { select: { name: true } },
      categoria: { select: { nombre: true, color: true } },
    },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(tickets)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { titulo, descripcion, prioridad, categoriaId, ubicacion, archivos } = await req.json()

  if (!titulo || !descripcion) {
    return NextResponse.json(
      { error: "Título y descripción requeridos" },
      { status: 400 }
    )
  }

  const ticket = await prisma.ticket.create({
    data: {
      titulo,
      descripcion,
      prioridad: prioridad || "MEDIA",
      ubicacion: ubicacion || null,
      categoriaId: categoriaId || null,
      clienteId: session.user.id,
      status: "NUEVO",
      attachments: archivos?.length
        ? {
            create: archivos.map((a: { nombre: string; url: string }) => ({
              nombre: a.nombre,
              url: a.url,
              subidoPorId: session.user.id,
            })),
          }
        : undefined,
    },
    include: {
      cliente: { select: { name: true, email: true } },
      categoria: { select: { nombre: true, color: true } },
      attachments: true,
    },
  })

  await logAudit(session.user.id, "CREAR_TICKET", `Ticket ${ticket.id} creado`)

  const agents = await prisma.user.findMany({
    where: { role: "AGENT", activo: true },
    select: { email: true, name: true },
  })

  const url = `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/tickets/${ticket.id}`
  for (const agent of agents) {
    await sendEmail({
      to: agent.email,
      ...ticketNotificationEmail({
        titulo: ticket.titulo,
        status: ticket.status,
        url,
        nombre: agent.name,
      }),
    })
  }

  return NextResponse.json(ticket, { status: 201 })
}
