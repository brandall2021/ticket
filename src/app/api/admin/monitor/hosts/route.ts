import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-auth"
import { ROLES_ADMIN } from "@/lib/constants"
import { crearMonitorHostSchema } from "@/lib/schemas"

export async function GET(req: NextRequest) {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  const { searchParams } = new URL(req.url)
  const grupoId = searchParams.get("grupoId")

  const where: Record<string, unknown> = {}
  if (grupoId) where.grupoId = grupoId

  const hosts = await prisma.monitorHost.findMany({
    where,
    include: {
      grupo: true,
      pings: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { nombre: "asc" },
  })

  return NextResponse.json(hosts)
}

export async function POST(req: NextRequest) {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  const body = await req.json()
  const parsed = crearMonitorHostSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const existing = await prisma.monitorHost.findFirst({ where: { ip: parsed.data.ip } })
  if (existing) {
    return NextResponse.json({ error: "Ya existe un host con esa IP" }, { status: 400 })
  }

  const host = await prisma.monitorHost.create({
    data: {
      nombre: parsed.data.nombre,
      ip: parsed.data.ip,
      detalle: parsed.data.detalle,
      grupoId: parsed.data.grupoId || null,
    },
    include: { grupo: true },
  })

  return NextResponse.json(host, { status: 201 })
}
