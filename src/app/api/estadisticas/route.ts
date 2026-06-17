import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "AGENT")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [totalTickets, ticketsPorEstado, ticketsPorPrioridad, ticketsHoy, ticketsAbiertos, agentes, clientes] =
    await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.groupBy({ by: ["status"], _count: true }),
      prisma.ticket.groupBy({ by: ["prioridad"], _count: true }),
      prisma.ticket.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
      prisma.ticket.count({
        where: { status: { in: ["NUEVO", "ASIGNADO", "EN_PROGRESO", "REABIERTO"] } },
      }),
      prisma.user.count({ where: { role: "AGENT" } }),
      prisma.user.count({ where: { role: "CLIENT" } }),
    ])

  return NextResponse.json({
    totalTickets,
    ticketsPorEstado,
    ticketsPorPrioridad,
    ticketsHoy,
    ticketsAbiertos,
    agentes,
    clientes,
  })
}
