import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-auth"
import { ROLES_ADMIN } from "@/lib/constants"

export async function GET(req: NextRequest) {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  const { searchParams } = new URL(req.url)
  const hostId = searchParams.get("hostId")
  const desde = searchParams.get("desde")
  const hasta = searchParams.get("hasta")
  const soloFallas = searchParams.get("soloFallas") === "true"

  const where: Record<string, unknown> = {}
  if (hostId) where.hostId = hostId
  if (soloFallas) where.exitoso = false
  if (desde || hasta) {
    where.createdAt = {}
    if (desde) (where.createdAt as Record<string, Date>).gte = new Date(desde)
    if (hasta) (where.createdAt as Record<string, Date>).lte = new Date(hasta + "T23:59:59.999Z")
  }

  const pings = await prisma.monitorPing.findMany({
    where,
    include: { host: { include: { grupo: true } } },
    orderBy: { createdAt: "desc" },
    take: 500,
  })

  return NextResponse.json(pings)
}
