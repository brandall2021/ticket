import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "node:crypto"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-auth"
import { ROLES_ADMIN } from "@/lib/constants"
import { logAudit } from "@/lib/audit"
import { decryptServerSecret, ServerError } from "@/lib/servers"
import { createSshSession, closeSshSession, getSshSession } from "@/lib/ssh-sessions"
import { createRdpTunnel, deleteRdpTunnel, getGuacamoleStatus } from "@/lib/guacamole"

type Params = { params: Promise<{ id: string }> }

function clientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0]?.trim() || null
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    null
  )
}

function clamp(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(Math.round(parsed), min), max)
}

export async function POST(req: NextRequest, { params }: Params) {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  const { id } = await params
  const server = await prisma.server.findUnique({ where: { id } })
  if (!server) return NextResponse.json({ error: "Servidor no encontrado" }, { status: 404 })
  if (!server.activo) return NextResponse.json({ error: "El servidor está deshabilitado" }, { status: 409 })

  let body: { cols?: number; rows?: number; width?: number; height?: number } = {}
  try {
    body = await req.json()
  } catch {
    /* sin body: se usan los valores por defecto */
  }

  const userId = authResult.session!.user.id
  const ip = clientIp(req)

  let password: string | null = null
  let privateKey: string | null = null
  let passphrase: string | null = null
  try {
    password = server.password ? decryptServerSecret(server.password) : null
    privateKey = server.privateKey ? decryptServerSecret(server.privateKey) : null
    passphrase = server.passphrase ? decryptServerSecret(server.passphrase) : null
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "No se pudieron descifrar las credenciales" },
      { status: 500 }
    )
  }

  if (server.protocolo === "RDP") {
    const status = getGuacamoleStatus()
    const sessionId = randomUUID()

    if (!status.configured) {
      // Sin gateway: se ofrece el archivo .rdp que abre el cliente nativo de Windows.
      return NextResponse.json({
        protocolo: "RDP" as const,
        modo: "archivo" as const,
        sessionId: null,
        downloadUrl: `/api/admin/servers/${server.id}/rdp`,
        mensaje:
          "Guacamole no está configurado. Se puede descargar el archivo .rdp para abrir la sesión con el cliente de Windows.",
      })
    }

    try {
      const width = clamp(body.width, 1280, 800, 3840)
      const height = clamp(body.height, 800, 600, 2160)
      const tunnel = await createRdpTunnel(server, {
        password,
        width,
        height,
      })

      await prisma.serverSession.create({
        data: {
          id: sessionId,
          serverId: server.id,
          usuarioId: userId,
          protocolo: "RDP",
          estado: "ACTIVA",
          detalle: `Guacamole ${width}x${height}`,
          ip,
        },
      })
      await prisma.server.update({
        where: { id: server.id },
        data: { ultimaConexion: new Date(), ultimoEstado: "OK", ultimoError: null },
      })
      await logAudit(userId, "CONECTAR_SERVIDOR", `RDP ${server.nombre} (${server.host}:${server.puerto})`)

      return NextResponse.json({
        protocolo: "RDP" as const,
        modo: "guacamole" as const,
        sessionId,
        connectionId: tunnel.connectionId,
        tunnelUrl: tunnel.tunnelUrl,
        width,
        height,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo abrir la sesión RDP"
      await prisma.server
        .update({ where: { id: server.id }, data: { ultimoEstado: "ERROR", ultimoError: message } })
        .catch(() => {})
      const statusCode = err instanceof ServerError && err.code === "GUACAMOLE_DISABLED" ? 409 : 502
      return NextResponse.json(
        {
          error: message,
          modo: "archivo" as const,
          downloadUrl: `/api/admin/servers/${server.id}/rdp`,
        },
        { status: statusCode }
      )
    }
  }

  // SSH
  const sessionId = randomUUID()
  const cols = clamp(body.cols, 120, 20, 500)
  const rows = clamp(body.rows, 30, 5, 200)

  try {
    await prisma.serverSession.create({
      data: {
        id: sessionId,
        serverId: server.id,
        usuarioId: userId,
        protocolo: "SSH",
        estado: "ACTIVA",
        detalle: `Terminal ${cols}x${rows}`,
        ip,
      },
    })
  } catch (err) {
    console.error("[servers] No se pudo registrar la sesión:", err)
  }

  const markServer = async (data: Prisma.ServerUpdateInput) => {
    await prisma.server.update({ where: { id: server.id }, data }).catch(() => {})
  }

  try {
    const session = await createSshSession({
      sessionId,
      userId,
      serverId: server.id,
      serverNombre: server.nombre,
      host: server.host,
      port: server.puerto,
      username: server.usuario,
      password,
      privateKey,
      passphrase,
      expectedFingerprint: server.fingerprint,
      cols,
      rows,
      onFinalize: async info => {
        await prisma.serverSession
          .update({
            where: { id: sessionId },
            data: {
              estado: info.estado,
              fin: new Date(),
              duracion: info.duracion,
              detalle: info.error ? `Terminal ${cols}x${rows} — ${info.error}` : `Terminal ${cols}x${rows}`,
            },
          })
          .catch(() => {})
      },
    })

    await markServer({
      ultimaConexion: new Date(),
      ultimoEstado: "OK",
      ultimoError: null,
      ...(session.fingerprint && !server.fingerprint ? { fingerprint: session.fingerprint } : {}),
    })
    await logAudit(userId, "CONECTAR_SERVIDOR", `SSH ${server.nombre} (${server.usuario}@${server.host}:${server.puerto})`)

    return NextResponse.json({
      protocolo: "SSH" as const,
      modo: "terminal" as const,
      sessionId: session.id,
      cols: session.cols,
      rows: session.rows,
      fingerprint: session.fingerprint,
      fingerprintNueva: !server.fingerprint,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo conectar por SSH"
    await prisma.serverSession
      .update({
        where: { id: sessionId },
        data: { estado: "ERROR", fin: new Date(), duracion: 0, detalle: message.slice(0, 500) },
      })
      .catch(() => {})
    await markServer({ ultimoEstado: "ERROR", ultimoError: message })
    await logAudit(userId, "ERROR_CONEXION_SERVIDOR", `SSH ${server.nombre}: ${message}`.slice(0, 500))
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

export async function DELETE(req: NextRequest) {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  const url = new URL(req.url)
  const sessionId = url.searchParams.get("sessionId")
  const connectionId = url.searchParams.get("connectionId")
  const userId = authResult.session!.user.id

  if (sessionId) {
    const meta = getSshSession(sessionId)
    if (meta && meta.userId === userId) {
      closeSshSession(sessionId, userId, "Sesión cerrada por el usuario")
    }
    await prisma.serverSession
      .update({
        where: { id: sessionId },
        data: { estado: "CERRADA", fin: new Date() },
      })
      .catch(() => {})
  }

  if (connectionId) {
    await deleteRdpTunnel(connectionId)
  }

  return NextResponse.json({ ok: true })
}
