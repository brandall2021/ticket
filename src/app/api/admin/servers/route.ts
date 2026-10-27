import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-auth"
import { ROLES_ADMIN } from "@/lib/constants"
import { logAudit } from "@/lib/audit"
import {
  encryptServerSecret,
  hasServerEncryptionKey,
  isEncryptedServerSecret,
  resolvePort,
  sanitizeServer,
  ServerError,
} from "@/lib/servers"
import { listSshSessions } from "@/lib/ssh-sessions"
import { crearServerSchema, emptyToNull } from "@/lib/server-schemas"

/** Migra credenciales en texto plano al formato cifrado (mismo criterio que MikroTik). */
async function ensureEncryptedServers() {
  if (!hasServerEncryptionKey()) return
  const servers = await prisma.server.findMany({
    select: { id: true, password: true, privateKey: true, passphrase: true },
  })
  await Promise.all(
    servers.map(server => {
      const data: { password?: string; privateKey?: string; passphrase?: string } = {}
      if (server.password && !isEncryptedServerSecret(server.password)) {
        data.password = encryptServerSecret(server.password)
      }
      if (server.privateKey && !isEncryptedServerSecret(server.privateKey)) {
        data.privateKey = encryptServerSecret(server.privateKey)
      }
      if (server.passphrase && !isEncryptedServerSecret(server.passphrase)) {
        data.passphrase = encryptServerSecret(server.passphrase)
      }
      if (Object.keys(data).length === 0) return Promise.resolve(null)
      return prisma.server.update({ where: { id: server.id }, data })
    })
  )
}

export async function GET() {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  try {
    await ensureEncryptedServers()
  } catch (err) {
    console.error("[servers] No se pudieron cifrar credenciales pendientes:", err)
  }

  const servers = await prisma.server.findMany({ orderBy: [{ nombre: "asc" }] })
  const activas = listSshSessions()
  const porServidor = new Map<string, number>()
  for (const sesion of activas) {
    porServidor.set(sesion.serverId, (porServidor.get(sesion.serverId) ?? 0) + 1)
  }

  return NextResponse.json(
    servers.map(server => ({
      ...sanitizeServer(server),
      sesionesActivas: porServidor.get(server.id) ?? 0,
    }))
  )
}

export async function POST(req: NextRequest) {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  const body = await req.json()
  const parsed = crearServerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", detalles: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const data = parsed.data
  const protocolo = data.protocolo

  let password: string | null = null
  let privateKey: string | null = null
  let passphrase: string | null = null
  try {
    password = emptyToNull(data.password) ? encryptServerSecret(emptyToNull(data.password)!) : null
    privateKey = emptyToNull(data.privateKey) ? encryptServerSecret(emptyToNull(data.privateKey)!) : null
    passphrase = emptyToNull(data.passphrase) ? encryptServerSecret(emptyToNull(data.passphrase)!) : null
  } catch (err) {
    if (err instanceof ServerError) {
      return NextResponse.json({ error: "Cifrado de credenciales no configurado (SERVER_ENCRYPTION_KEY)" }, { status: 500 })
    }
    throw err
  }

  if (protocolo === "SSH" && !password && !privateKey) {
    return NextResponse.json(
      { error: "Un servidor SSH necesita contraseña o clave privada" },
      { status: 400 }
    )
  }

  const server = await prisma.server.create({
    data: {
      nombre: data.nombre,
      host: data.host,
      protocolo,
      puerto: resolvePort(protocolo, data.puerto),
      usuario: data.usuario,
      password,
      privateKey,
      passphrase,
      dominio: emptyToNull(data.dominio) ?? null,
      resolucion: emptyToNull(data.resolucion) ?? "1280x800",
      seguridad: emptyToNull(data.seguridad) ?? "any",
      descripcion: emptyToNull(data.descripcion) ?? null,
      grupo: emptyToNull(data.grupo) ?? null,
      color: data.color || "#3b82f6",
      activo: data.activo ?? true,
    },
  })

  await logAudit(
    authResult.session!.user.id,
    "CREAR_SERVIDOR",
    `${server.nombre} (${server.protocolo} ${server.host}:${server.puerto})`
  )

  return NextResponse.json(sanitizeServer(server), { status: 201 })
}
