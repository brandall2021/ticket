import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-auth"
import { ROLES_ADMIN } from "@/lib/constants"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  const { id } = await params
  const hours = Math.min(Math.max(parseInt(req.nextUrl.searchParams.get("hours") || "24", 10), 1), 168)

  const router = await prisma.mikrotikRouter.findUnique({ where: { id } })
  if (!router) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  const since = new Date(Date.now() - hours * 3600 * 1000)

  const [snapshots, traffic] = await Promise.all([
    prisma.mikrotikSnapshot.findMany({
      where: { routerId: id, createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.mikrotikTraffic.findMany({
      where: { routerId: id, createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
    }),
  ])

  // Contadores acumulados por interfaz: series ordenadas en el tiempo
  const byIface = new Map<string, Array<{ time: number; rx: number; tx: number }>>()
  for (const t of traffic) {
    const list = byIface.get(t.iface) || []
    list.push({ time: t.createdAt.getTime(), rx: t.rxBytes, tx: t.txBytes })
    byIface.set(t.iface, list)
  }

  // Convertir contadores acumulados a velocidades (bits/segundo)
  const trafficRate: Record<string, Array<{ time: string; rxBps: number; txBps: number }>> = {}
  const ifaceTotal = new Map<string, { rx: number; tx: number }>()

  for (const [name, points] of byIface) {
    const rates: Array<{ time: string; rxBps: number; txBps: number }> = []
    let rx = 0
    let tx = 0
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      const dt = (curr.time - prev.time) / 1000
      if (dt <= 0) continue
      rates.push({
        time: new Date(curr.time).toISOString(),
        rxBps: Math.max(0, ((curr.rx - prev.rx) * 8) / dt),
        txBps: Math.max(0, ((curr.tx - prev.tx) * 8) / dt),
      })
      rx = curr.rx
      tx = curr.tx
    }
    trafficRate[name] = rates
    ifaceTotal.set(name, { rx, tx })
  }

  const resourceHistory = snapshots.map(s => ({
    time: s.createdAt.toISOString(),
    cpu: s.cpuLoad,
    memoryUsed: s.totalMemory !== null && s.totalMemory !== undefined && s.freeMemory !== null && s.freeMemory !== undefined
      ? s.totalMemory - s.freeMemory
      : null,
    totalMemory: s.totalMemory,
  }))

  return NextResponse.json({
    snapshots: resourceHistory,
    trafficRate,
    ifaceTotal: Object.fromEntries(ifaceTotal),
    hours,
  })
}