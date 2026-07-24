import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-auth"
import { ROLES } from "@/lib/constants"

export async function GET(req: NextRequest) {
  const authResult = await requireRole([ROLES.ADMIN])
  if (authResult.error) return authResult.error

  const { searchParams } = new URL(req.url)

  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)))
  const skip = (page - 1) * limit

  const accion = searchParams.get("accion") || undefined
  const from = searchParams.get("from") || undefined
  const to = searchParams.get("to") || undefined

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}

  if (accion) {
    where.accion = accion
  }

  if (from || to) {
    where.fecha = {}
    if (from) where.fecha.gte = new Date(from)
    if (to) where.fecha.lte = new Date(to + "T23:59:59.999Z")
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { usuario: { select: { id: true, name: true, email: true } } },
      orderBy: { fecha: "desc" },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ])

  return NextResponse.json({
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}
