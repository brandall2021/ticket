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
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "50", 10), 200)

  const router = await prisma.mikrotikRouter.findUnique({ where: { id } })
  if (!router) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  const total = await prisma.mikrotikAlert.count({ where: { routerId: id } })
  const sinLeer = await prisma.mikrotikAlert.count({ where: { routerId: id, leida: false } })
  const alerts = await prisma.mikrotikAlert.findMany({
    where: { routerId: id },
    orderBy: { createdAt: "desc" },
    take: limit,
  })

  return NextResponse.json({ alerts, total, sinLeer })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const leida = typeof body.leida === "boolean" ? body.leida : true

  await prisma.mikrotikAlert.updateMany({
    where: { routerId: id },
    data: { leida },
  })

  return NextResponse.json({ ok: true })
}