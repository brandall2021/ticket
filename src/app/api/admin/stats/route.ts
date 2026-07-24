import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-auth"
import { ROLES_ADMIN } from "@/lib/constants"

export async function GET() {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  thirtyDaysAgo.setHours(0, 0, 0, 0)

  const [
    ticketsByStatus,
    ticketsByPriority,
    ticketsByCategoryRaw,
    ticketsTrendRaw,
    agentWorkloadRaw,
    resolvedTickets,
  ] = await Promise.all([
    prisma.ticket.groupBy({ by: ["status"], _count: true }),
    prisma.ticket.groupBy({ by: ["prioridad"], _count: true }),
    prisma.ticket.groupBy({
      by: ["categoriaId"],
      _count: true,
      where: { categoriaId: { not: null } },
    }),
    prisma.$queryRawUnsafe<{ fecha: string; count: bigint }[]>(
      `SELECT TO_CHAR("createdAt", 'YYYY-MM-DD') AS fecha, COUNT(*)::int AS count
       FROM "Ticket"
       WHERE "createdAt" >= $1
       GROUP BY fecha
       ORDER BY fecha ASC`,
      thirtyDaysAgo
    ),
    prisma.ticket.groupBy({
      by: ["agenteId"],
      _count: true,
      where: { agenteId: { not: null } },
    }),
    prisma.ticket.findMany({
      where: { status: "CERRADO", solucion: { not: null } },
      select: { createdAt: true, updatedAt: true },
    }),
  ])

  const categoryIds = ticketsByCategoryRaw.map((r) => r.categoriaId as string)
  const categorias = categoryIds.length
    ? await prisma.categoria.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, nombre: true },
      })
    : []
  const catMap = new Map(categorias.map((c) => [c.id, c.nombre]))

  const ticketsByCategory = ticketsByCategoryRaw.map((r) => ({
    categoria: catMap.get(r.categoriaId as string) || "Sin categoría",
    count: Number(r._count),
  }))

  const ticketsTrend = ticketsTrendRaw.map((r) => ({
    fecha: r.fecha,
    count: Number(r.count),
  }))

  const agentIds = agentWorkloadRaw.map((r) => r.agenteId as string)
  const agents = agentIds.length
    ? await prisma.user.findMany({
        where: { id: { in: agentIds } },
        select: { id: true, name: true },
      })
    : []
  const agentMap = new Map(agents.map((a) => [a.id, a.name]))

  const agentWorkload = agentWorkloadRaw
    .map((r) => ({
      agente: agentMap.get(r.agenteId as string) || "Desconocido",
      count: Number(r._count),
    }))
    .sort((a, b) => b.count - a.count)

  const avgResolutionMinutes =
    resolvedTickets.length > 0
      ? resolvedTickets.reduce((sum, t) => {
          const diff = t.updatedAt.getTime() - t.createdAt.getTime()
          return sum + diff / 60000
        }, 0) / resolvedTickets.length
      : 0

  return NextResponse.json({
    ticketsByStatus: ticketsByStatus.map((r) => ({ status: r.status, count: Number(r._count) })),
    ticketsByPriority: ticketsByPriority.map((r) => ({ prioridad: r.prioridad, count: Number(r._count) })),
    ticketsByCategory,
    ticketsTrend,
    agentWorkload,
    avgResolutionTime: Math.round(avgResolutionMinutes),
  })
}
