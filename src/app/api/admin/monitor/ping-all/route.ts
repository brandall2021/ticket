import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-auth"
import { ROLES_ADMIN } from "@/lib/constants"
import { pingMultiple } from "@/lib/ping"

export async function POST(req: NextRequest) {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  const { hostIds } = await req.json()

  const hosts = hostIds?.length
    ? await prisma.monitorHost.findMany({ where: { id: { in: hostIds }, activo: true } })
    : await prisma.monitorHost.findMany({ where: { activo: true } })

  if (hosts.length === 0) {
    return NextResponse.json({ error: "No hay hosts activos" }, { status: 400 })
  }

  const ipToHost = new Map(hosts.map(h => [h.ip, h]))
  const results = await pingMultiple(hosts.map(h => h.ip))

  const pings = []
  for (const [ip, result] of results) {
    const host = ipToHost.get(ip)
    if (!host) continue

    await prisma.monitorPing.create({
      data: {
        exitoso: result.exitoso,
        latencia: result.latencia,
        timeout: result.timeout,
        detalle: result.detalle,
        hostId: host.id,
      },
    })

    await prisma.monitorHost.update({
      where: { id: host.id },
      data: {
        lastStatus: result.exitoso ? "UP" : "DOWN",
        lastPingAt: new Date(),
      },
    })

    pings.push({ hostId: host.id, host: host.nombre, ip, resultado: result })
  }

  return NextResponse.json({ total: pings.length, pings })
}
