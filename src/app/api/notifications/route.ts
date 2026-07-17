import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-auth"

export async function GET(req: NextRequest) {
  const authResult = await requireAuth()
  if (authResult.error) return authResult.error

  const { searchParams } = new URL(req.url)
  const soloNoLeidas = searchParams.get("noLeidas") === "true"
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")))

  const where: Record<string, unknown> = { usuarioId: authResult.session!.user.id }
  if (soloNoLeidas) where.leida = false

  const [notifications, total, noLeidas] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: { usuarioId: authResult.session!.user.id, leida: false },
    }),
  ])

  return NextResponse.json({ notifications, total, noLeidas })
}

export async function PATCH(req: NextRequest) {
  const authResult = await requireAuth()
  if (authResult.error) return authResult.error

  const { ids, marcarTodas } = await req.json()

  if (marcarTodas) {
    await prisma.notification.updateMany({
      where: { usuarioId: authResult.session!.user.id, leida: false },
      data: { leida: true },
    })
    return NextResponse.json({ success: true })
  }

  if (!ids || !Array.isArray(ids)) {
    return NextResponse.json({ error: "ids requerido" }, { status: 400 })
  }

  await prisma.notification.updateMany({
    where: { id: { in: ids }, usuarioId: authResult.session!.user.id },
    data: { leida: true },
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const authResult = await requireAuth()
  if (authResult.error) return authResult.error

  await prisma.notification.deleteMany({
    where: { usuarioId: authResult.session!.user.id },
  })

  return NextResponse.json({ success: true })
}
