import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-auth"
import { ROLES_ADMIN } from "@/lib/constants"
import { testConnection, MikrotikError } from "@/lib/mikrotik"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  const { id } = await params
  const router = await prisma.mikrotikRouter.findUnique({ where: { id } })
  if (!router) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  const { nombre, host, apiPort, useTls, user, activo, identidad, version, boardName, cpuLoad, freeMemory, totalMemory, uptime, ultimoEstado, ultimoError, ultimaConexion, notificarAdmin, createdAt, updatedAt } = router
  return NextResponse.json({ nombre, host, apiPort, useTls, user, activo, identidad, version, boardName, cpuLoad, freeMemory, totalMemory, uptime, ultimoEstado, ultimoError, ultimaConexion, notificarAdmin, createdAt, updatedAt })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  const { id } = await params
  const router = await prisma.mikrotikRouter.findUnique({ where: { id } })
  if (!router) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  try {
    const info = await testConnection({
      host: router.host,
      apiPort: router.apiPort,
      useTls: router.useTls,
      user: router.user,
      password: router.password,
    })

    const fecha = new Date()
    const updated = await prisma.mikrotikRouter.update({
      where: { id },
      data: {
        identidad: info.identidad,
        version: info.version,
        boardName: info.boardName,
        cpuLoad: info.cpuLoad,
        freeMemory: info.freeMemory,
        totalMemory: info.totalMemory,
        uptime: info.uptime,
        ultimoEstado: "OK",
        ultimoError: null,
        ultimaConexion: fecha,
      },
    })

    return NextResponse.json({ ok: true, info, router: updated })
  } catch (err) {
    const msg = err instanceof MikrotikError ? err.message : err instanceof Error ? err.message : String(err)
    await prisma.mikrotikRouter.update({
      where: { id },
      data: { ultimoEstado: "ERROR", ultimoError: msg, ultimaConexion: new Date() },
    })
    return NextResponse.json({ ok: false, error: msg })
  }
}