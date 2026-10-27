import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-auth"
import { ROLES_ADMIN } from "@/lib/constants"

type Params = { params: Promise<{ id: string }> }

export const dynamic = "force-dynamic"

/** Historial de accesos a un servidor. */
export async function GET(req: NextRequest, { params }: Params) {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  const { id } = await params
  const limit = Math.min(Math.max(Number.parseInt(new URL(req.url).searchParams.get("limit") || "50", 10) || 50, 1), 200)

  const sesiones = await prisma.serverSession.findMany({
    where: { serverId: id },
    orderBy: { inicio: "desc" },
    take: limit,
    include: { usuario: { select: { id: true, name: true, apellido: true, email: true } } },
  })

  return NextResponse.json(sesiones)
}
