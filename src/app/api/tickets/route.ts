import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"
import { sendEmail, ticketNotificationEmail } from "@/lib/email"
import { requireAuth } from "@/lib/api-auth"
import { crearTicketSchema } from "@/lib/schemas"

export async function GET(req: NextRequest) {
  const authResult = await requireAuth()
  if (authResult.error) return authResult.error

  const { searchParams } = new URL(req.url)
  const { role, id: userId } = authResult.session!.user

  const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")))
  const skip = (page - 1) * limit

  if (role === "CLIENT") {
    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where: { clienteId: userId },
        include: {
          cliente: { select: { name: true, email: true } },
          agente: { select: { name: true } },
          categoria: { select: { nombre: true, color: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.ticket.count({ where: { clienteId: userId } }),
    ])
    return NextResponse.json({ tickets, total, page, limit, pages: Math.ceil(total / limit) })
  }

  const where: Record<string, unknown> = {}
  const status = searchParams.get("status")
  const prioridad = searchParams.get("prioridad")
  const q = searchParams.get("q")

  if (status) where.status = status
  if (prioridad) where.prioridad = prioridad
  if (q) where.titulo = { contains: q, mode: "insensitive" }

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: {
        cliente: { select: { name: true, email: true } },
        agente: { select: { name: true } },
        categoria: { select: { nombre: true, color: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.ticket.count({ where }),
  ])
  return NextResponse.json({ tickets, total, page, limit, pages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth()
  if (authResult.error) return authResult.error

  const body = await req.json()
  const parsed = crearTicketSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const ticket = await prisma.ticket.create({
    data: {
      titulo: parsed.data.titulo,
      descripcion: parsed.data.descripcion,
      prioridad: parsed.data.prioridad || "MEDIA",
      ubicacion: parsed.data.ubicacion || null,
      categoriaId: parsed.data.categoriaId || null,
      clienteId: authResult.session!.user.id,
      status: "NUEVO",
      attachments: parsed.data.archivos?.length
        ? {
            create: parsed.data.archivos.map((a) => ({
              nombre: a.nombre,
              url: a.url,
              subidoPorId: authResult.session!.user.id,
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

  await logAudit(authResult.session!.user.id, "CREAR_TICKET", `Ticket ${ticket.id} creado`)

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