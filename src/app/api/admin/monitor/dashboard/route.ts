import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-auth"
import { ROLES_ADMIN } from "@/lib/constants"

export async function GET(req: NextRequest) {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  const { searchParams } = new URL(req.url)
  const desde = searchParams.get("desde")
  const hasta = searchParams.get("hasta")

  const dateFilter: Record<string, Date> = {}
  if (desde) dateFilter.gte = new Date(desde)
  if (hasta) dateFilter.lte = new Date(hasta + "T23:59:59.999Z")

  const pingWhere = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}

  const [totalHosts, hostsUp, hostsDown, hostsSinPing, totalPings, pingsExitosos, pingsFallidos, grupos, ultimosPings] = await Promise.all([
    prisma.monitorHost.count({ where: { activo: true } }),
    prisma.monitorHost.count({ where: { activo: true, lastStatus: "UP" } }),
    prisma.monitorHost.count({ where: { activo: true, lastStatus: "DOWN" } }),
    prisma.monitorHost.count({ where: { activo: true, lastStatus: null } }),
    prisma.monitorPing.count({ where: pingWhere }),
    prisma.monitorPing.count({ where: { exitoso: true, ...pingWhere } }),
    prisma.monitorPing.count({ where: { exitoso: false, ...pingWhere } }),
    prisma.monitorGroup.findMany({
      include: {
        hosts: {
          where: { activo: true },
          include: { pings: { orderBy: { createdAt: "desc" }, take: 1 } },
        },
      },
      orderBy: { nombre: "asc" },
    }),
    prisma.monitorPing.findMany({
      where: pingWhere,
      include: { host: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ])

  const uptime = totalPings > 0 ? ((pingsExitosos / totalPings) * 100).toFixed(1) : "0.0"

  return NextResponse.json({
    stats: {
      totalHosts,
      hostsUp,
      hostsDown,
      hostsSinPing,
      totalPings,
      pingsExitosos,
      pingsFallidos,
      uptime,
    },
    grupos,
    ultimosPings,
  })
}
