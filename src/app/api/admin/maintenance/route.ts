import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-auth"
import { ROLES_ADMIN } from "@/lib/constants"

export async function GET(req: NextRequest) {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")))
  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    prisma.maintenance.findMany({
      orderBy: { scheduledAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.maintenance.count(),
  ])

  return NextResponse.json({
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}

export async function POST(req: NextRequest) {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  const body = await req.json()
  const { titulo, descripcion, scheduledAt, duration, status, hostIds } = body

  if (!titulo || !scheduledAt || !hostIds) {
    return NextResponse.json(
      { error: "titulo, scheduledAt y hostIds son requeridos" },
      { status: 400 }
    )
  }

  const validStatuses = ["PROGRAMADO", "EN_CURSO", "FINALIZADO"]
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `Status inválido. Valores permitidos: ${validStatuses.join(", ")}` },
      { status: 400 }
    )
  }

  const item = await prisma.maintenance.create({
    data: {
      titulo,
      descripcion: descripcion || null,
      scheduledAt: new Date(scheduledAt),
      duration: duration ?? 60,
      status: status || "PROGRAMADO",
      hostIds,
    },
  })

  return NextResponse.json(item, { status: 201 })
}
