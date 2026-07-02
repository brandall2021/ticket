import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-auth"
import { ROLES_ADMIN_AGENT } from "@/lib/constants"

export async function GET() {
  const authResult = await requireRole(ROLES_ADMIN_AGENT)
  if (authResult.error) return authResult.error

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