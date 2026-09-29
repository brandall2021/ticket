import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-auth"
import { ROLES_ADMIN } from "@/lib/constants"
import { resolveSection, MikrotikError } from "@/lib/mikrotik"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  const { id } = await params
  const section = req.nextUrl.searchParams.get("section") || "resource"

  const router = await prisma.mikrotikRouter.findUnique({ where: { id } })
  if (!router) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  try {
    const config = {
      host: router.host,
      apiPort: router.apiPort,
      useTls: router.useTls,
      user: router.user,
      password: router.password,
    }
    const data = await resolveSection(config, section)
    return NextResponse.json({ ok: true, section, data })
  } catch (err) {
    const msg = err instanceof MikrotikError ? err.message : err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, section, error: msg })
  }
}