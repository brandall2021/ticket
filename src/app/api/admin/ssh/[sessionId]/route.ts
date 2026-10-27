import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-auth"
import { ROLES_ADMIN } from "@/lib/constants"
import {
  closeSshSession,
  getSshSession,
  resizeSshSession,
  subscribeSshSession,
  writeSshSession,
} from "@/lib/ssh-sessions"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type Params = { params: Promise<{ sessionId: string }> }

const HEARTBEAT_MS = 25_000

function encode(payload: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`)
}

export async function GET(req: NextRequest, { params }: Params) {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  const { sessionId } = await params
  const userId = authResult.session!.user.id
  const meta = getSshSession(sessionId, userId)
  if (!meta) {
    return NextResponse.json({ error: "Sesión SSH no encontrada o expirada" }, { status: 404 })
  }

  let unsubscribe: (() => void) | null = null
  let heartbeat: NodeJS.Timeout | null = null

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let open = true
      const send = (payload: Record<string, unknown>) => {
        if (!open) return
        try {
          controller.enqueue(encode(payload))
        } catch {
          open = false
        }
      }

      const cleanup = () => {
        open = false
        unsubscribe?.()
        unsubscribe = null
        if (heartbeat) {
          clearInterval(heartbeat)
          heartbeat = null
        }
      }

      send({
        tipo: "listo",
        sessionId: meta.id,
        host: meta.host,
        usuario: meta.username,
        fingerprint: meta.fingerprint,
        cols: meta.cols,
        rows: meta.rows,
      })

      const subscription = subscribeSshSession(meta.id, userId, {
        onData: chunk => send({ tipo: "salida", data: chunk }),
        onClose: info => {
          send({ tipo: "cierre", error: info.error })
          cleanup()
          try {
            controller.close()
          } catch {
            /* ya cerrado */
          }
        },
      })

      if (!subscription) {
        send({ tipo: "cierre", error: "La sesión ya no está disponible" })
        cleanup()
        try {
          controller.close()
        } catch {
          /* ya cerrado */
        }
        return
      }

      unsubscribe = subscription.unsubscribe
      if (subscription.replay) {
        send({ tipo: "salida", data: subscription.replay })
      }

      heartbeat = setInterval(() => {
        if (!open) return
        try {
          controller.enqueue(new TextEncoder().encode(": ping\n\n"))
        } catch {
          open = false
        }
      }, HEARTBEAT_MS)
      heartbeat.unref?.()

      req.signal.addEventListener("abort", () => {
        cleanup()
        try {
          controller.close()
        } catch {
          /* ya cerrado */
        }
      })
    },
    cancel() {
      unsubscribe?.()
      if (heartbeat) clearInterval(heartbeat)
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}

export async function POST(req: NextRequest, { params }: Params) {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  const { sessionId } = await params
  const userId = authResult.session!.user.id

  let body: { tipo?: string; data?: string; cols?: number; rows?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  switch (body.tipo) {
    case "input": {
      if (typeof body.data !== "string" || body.data.length === 0) {
        return NextResponse.json({ error: "Datos de entrada requeridos" }, { status: 400 })
      }
      const ok = writeSshSession(sessionId, body.data.slice(0, 8192), userId)
      if (!ok) return NextResponse.json({ error: "La sesión no está activa" }, { status: 409 })
      return NextResponse.json({ ok: true })
    }
    case "resize": {
      const ok = resizeSshSession(sessionId, Number(body.cols), Number(body.rows), userId)
      if (!ok) return NextResponse.json({ error: "La sesión no está activa" }, { status: 409 })
      return NextResponse.json({ ok: true })
    }
    case "close": {
      closeSshSession(sessionId, userId, "Sesión cerrada por el usuario")
      await prisma.serverSession
        .update({ where: { id: sessionId }, data: { estado: "CERRADA", fin: new Date() } })
        .catch(() => {})
      return NextResponse.json({ ok: true })
    }
    default:
      return NextResponse.json({ error: "Tipo de mensaje inválido" }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  const { sessionId } = await params
  const userId = authResult.session!.user.id

  closeSshSession(sessionId, userId, "Sesión cerrada")
  await prisma.serverSession
    .update({ where: { id: sessionId }, data: { estado: "CERRADA", fin: new Date() } })
    .catch(() => {})

  return NextResponse.json({ ok: true })
}
