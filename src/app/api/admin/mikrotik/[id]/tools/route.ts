import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-auth"
import { ROLES_ADMIN } from "@/lib/constants"
import { runPingTool, runTracerouteTool, MikrotikError, mikrotikConfigFromRouter } from "@/lib/mikrotik"
import { z } from "zod"

const pingSchema = z.object({
  address: z.string().min(1, "Dirección requerida"),
  count: z.number().int().min(1).max(20).optional().default(4),
  size: z.number().int().min(1).max(65507).optional().default(64),
})

const tracerouteSchema = z.object({
  address: z.string().min(1, "Dirección requerida"),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  const body = await req.json()
  const { id } = await params
  const action = req.nextUrl.searchParams.get("action") || "ping"

  const router = await prisma.mikrotikRouter.findUnique({ where: { id } })
  if (!router) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  const config = mikrotikConfigFromRouter(router)

  try {
    if (action === "ping") {
      const parsed = pingSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Datos inválidos", detalles: parsed.error.flatten().fieldErrors },
          { status: 400 }
        )
      }
      const result = await runPingTool(config, parsed.data.address, parsed.data.count ?? 4, parsed.data.size ?? 64)
      return NextResponse.json({ ok: true, action, data: result })
    }

    if (action === "traceroute") {
      const parsed = tracerouteSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Datos inválidos", detalles: parsed.error.flatten().fieldErrors },
          { status: 400 }
        )
      }
      const result = await runTracerouteTool(config, parsed.data.address)
      return NextResponse.json({ ok: true, action, data: result })
    }

    return NextResponse.json({ error: "Acción desconocida" }, { status: 400 })
  } catch (err) {
    const msg = err instanceof MikrotikError ? err.message : err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: msg })
  }
}
