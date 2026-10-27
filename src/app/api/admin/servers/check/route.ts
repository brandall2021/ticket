import { NextRequest, NextResponse } from "next/server"
import { Socket } from "node:net"
import { Client } from "ssh2"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-auth"
import { ROLES_ADMIN } from "@/lib/constants"
import { logAudit } from "@/lib/audit"
import {
  decryptServerSecret,
  defaultPort,
  formatSshFingerprint,
  normalizeProtocol,
  resolvePort,
  ServerError,
} from "@/lib/servers"

const PROBE_TIMEOUT_MS = 6000
const SSH_TIMEOUT_MS = 10_000

function probeTcp(host: string, port: number): Promise<{ ok: boolean; latencia: number; error?: string }> {
  return new Promise(resolve => {
    const started = Date.now()
    const socket = new Socket()
    let settled = false

    const done = (ok: boolean, error?: string) => {
      if (settled) return
      settled = true
      socket.destroy()
      resolve({ ok, latencia: Date.now() - started, error })
    }

    socket.setTimeout(PROBE_TIMEOUT_MS)
    socket.once("connect", () => done(true))
    socket.once("timeout", () => done(false, "Tiempo de espera agotado"))
    socket.once("error", err => done(false, err.message))
    try {
      socket.connect(port, host)
    } catch (err) {
      done(false, err instanceof Error ? err.message : String(err))
    }
  })
}

function testSsh(
  host: string,
  port: number,
  usuario: string,
  password?: string | null,
  privateKey?: string | null,
  passphrase?: string | null
): Promise<{ fingerprint: string | null }> {
  return new Promise((resolve, reject) => {
    const client = new Client()
    let fingerprint: string | null = null
    let settled = false

    const fail = (message: string) => {
      if (settled) return
      settled = true
      try {
        client.end()
      } catch {
        /* ignorar */
      }
      reject(new ServerError(message, "SSH_ERROR"))
    }

    const ok = () => {
      if (settled) return
      settled = true
      try {
        client.end()
      } catch {
        /* ignorar */
      }
      resolve({ fingerprint })
    }

    const timer = setTimeout(() => fail("La conexión SSH superó el tiempo de espera"), SSH_TIMEOUT_MS)
    timer.unref?.()

    client.on("ready", () => {
      clearTimeout(timer)
      ok()
    })
    client.on("error", (err: Error) => {
      clearTimeout(timer)
      fail(err.message || "No se pudo autenticar por SSH")
    })
    client.on("close", () => {
      clearTimeout(timer)
      if (!settled) fail("La conexión SSH se cerró antes de autenticar")
    })

    try {
      client.connect({
        host,
        port,
        username: usuario,
        password: password || undefined,
        privateKey: privateKey || undefined,
        passphrase: passphrase || undefined,
        readyTimeout: SSH_TIMEOUT_MS,
        hostVerifier: (key: Buffer) => {
          fingerprint = formatSshFingerprint(key)
          return true
        },
      })
    } catch (err) {
      clearTimeout(timer)
      fail(err instanceof Error ? err.message : "No se pudo iniciar la conexión SSH")
    }
  })
}

interface CheckBody {
  id?: string
  host?: string
  puerto?: number
  protocolo?: string
  usuario?: string
  password?: string | null
  privateKey?: string | null
  passphrase?: string | null
}

export async function POST(req: NextRequest) {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  let body: CheckBody
  try {
    body = (await req.json()) as CheckBody
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo de la petición inválido" }, { status: 400 })
  }

  let host = body.host?.trim() || ""
  let protocolo = normalizeProtocol(body.protocolo) ?? "SSH"
  let usuario = body.usuario?.trim() || ""
  let password = body.password ?? null
  let privateKey = body.privateKey ?? null
  let passphrase = body.passphrase ?? null
  let puerto = resolvePort(protocolo, body.puerto)

  if (body.id) {
    const server = await prisma.server.findUnique({ where: { id: body.id } })
    if (!server) return NextResponse.json({ ok: false, error: "Servidor no encontrado" }, { status: 404 })
    host = host || server.host
    protocolo = normalizeProtocol(server.protocolo) ?? protocolo
    usuario = usuario || server.usuario
    puerto = body.puerto ? resolvePort(protocolo, body.puerto) : server.puerto || defaultPort(protocolo)
    // Sólo se descifran las credenciales guardadas si no vienen en el formulario.
    try {
      if (!password && !privateKey) {
        password = server.password ? decryptServerSecret(server.password) : null
        privateKey = server.privateKey ? decryptServerSecret(server.privateKey) : null
        passphrase = server.passphrase ? decryptServerSecret(server.passphrase) : null
      }
    } catch (err) {
      return NextResponse.json(
        { ok: false, error: err instanceof Error ? err.message : "No se pudieron descifrar las credenciales" },
        { status: 500 }
      )
    }
  }

  if (!host) return NextResponse.json({ ok: false, error: "Host requerido" }, { status: 400 })

  const tcp = await probeTcp(host, puerto)
  if (!tcp.ok) {
    if (body.id) {
      await prisma.server
        .update({
          where: { id: body.id },
          data: { ultimoEstado: "ERROR", ultimoError: tcp.error ?? "No se pudo conectar" },
        })
        .catch(() => {})
    }
    return NextResponse.json({ ok: false, etapa: "tcp", error: tcp.error, latencia: tcp.latencia })
  }

  if (protocolo !== "SSH") {
    if (body.id) {
      await prisma.server
        .update({
          where: { id: body.id },
          data: { ultimoEstado: "OK", ultimoError: null, ultimaConexion: new Date() },
        })
        .catch(() => {})
    }
    await logAudit(authResult.session!.user.id, "PROBAR_SERVIDOR", `${host}:${puerto} (RDP)`)
    return NextResponse.json({
      ok: true,
      latencia: tcp.latencia,
      detalle: "Puerto RDP accesible. Las credenciales se validan al abrir la sesión.",
    })
  }

  if (!usuario || (!password && !privateKey)) {
    return NextResponse.json({
      ok: false,
      etapa: "credenciales",
      error: "Faltan usuario y contraseña (o clave privada) para validar el acceso SSH",
      latencia: tcp.latencia,
    })
  }

  try {
    const { fingerprint } = await testSsh(host, puerto, usuario, password, privateKey, passphrase)
    if (body.id) {
      await prisma.server
        .update({
          where: { id: body.id },
          data: {
            ultimoEstado: "OK",
            ultimoError: null,
            ultimaConexion: new Date(),
            ...(fingerprint ? { fingerprint } : {}),
          },
        })
        .catch(() => {})
    }
    await logAudit(authResult.session!.user.id, "PROBAR_SERVIDOR", `${host}:${puerto} (SSH ${usuario})`)
    return NextResponse.json({
      ok: true,
      latencia: tcp.latencia,
      detalle: `Autenticación SSH correcta como ${usuario}`,
      fingerprint,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo autenticar por SSH"
    if (body.id) {
      await prisma.server
        .update({ where: { id: body.id }, data: { ultimoEstado: "ERROR", ultimoError: message } })
        .catch(() => {})
    }
    return NextResponse.json({ ok: false, etapa: "ssh", error: message, latencia: tcp.latencia })
  }
}
