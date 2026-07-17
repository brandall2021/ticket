import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-auth"
import { ROLES_ADMIN } from "@/lib/constants"
import { pingHost } from "@/lib/ping"

export async function POST(req: NextRequest) {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  const { hostId, ip } = await req.json()

  if (!ip) {
    return NextResponse.json({ error: "IP requerida" }, { status: 400 })
  }

  const result = await pingHost(ip)

  const ping = await prisma.monitorPing.create({
    data: {
      exitoso: result.exitoso,
      latencia: result.latencia,
      timeout: result.timeout,
      detalle: result.detalle,
      hostId: hostId || "manual",
    },
  })

  if (hostId) {
    await prisma.monitorHost.update({
      where: { id: hostId },
      data: {
        lastStatus: result.exitoso ? "UP" : "DOWN",
        lastPingAt: new Date(),
      },
    })
  }

  return NextResponse.json({ ping, resultado: result })
}
