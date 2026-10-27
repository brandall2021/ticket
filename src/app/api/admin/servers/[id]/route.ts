import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-auth"
import { ROLES_ADMIN } from "@/lib/constants"
import { logAudit } from "@/lib/audit"
import {
  defaultPort,
  encryptServerSecret,
  resolvePort,
  sanitizeServer,
  ServerError,
} from "@/lib/servers"
import { actualizarServerSchema, emptyToNull } from "@/lib/server-schemas"

type Params = { params: Promise<{ id: string }> }

async function findServer(id: string) {
  return prisma.server.findUnique({ where: { id } })
}

export async function GET(_req: NextRequest, { params }: Params) {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  const { id } = await params
  const server = await findServer(id)
  if (!server) return NextResponse.json({ error: "Servidor no encontrado" }, { status: 404 })

  const sesiones = await prisma.serverSession.findMany({
    where: { serverId: id },
    orderBy: { inicio: "desc" },
    take: 20,
    include: { usuario: { select: { id: true, name: true, apellido: true, email: true } } },
  })

  return NextResponse.json({ ...sanitizeServer(server), sesiones })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  const { id } = await params
  const existing = await findServer(id)
  if (!existing) return NextResponse.json({ error: "Servidor no encontrado" }, { status: 404 })

  const body = await req.json()
  const parsed = actualizarServerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", detalles: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const data = parsed.data
  const protocolo = data.protocolo ?? existing.protocolo

  const update: Record<string, unknown> = {}
  for (const key of ["nombre", "host", "usuario", "color", "activo"] as const) {
    if (data[key] !== undefined) update[key] = data[key]
  }
  if (data.protocolo !== undefined) update.protocolo = data.protocolo
  if (data.puerto !== undefined) {
    update.puerto = resolvePort(protocolo, data.puerto)
  } else if (data.protocolo !== undefined && data.protocolo !== existing.protocolo) {
    update.puerto = defaultPort(data.protocolo)
  }
  for (const key of ["dominio", "resolucion", "seguridad", "descripcion", "grupo"] as const) {
    const value = emptyToNull(data[key])
    if (value !== undefined) update[key] = value
  }

  try {
    for (const key of ["password", "privateKey", "passphrase"] as const) {
      if (!(key in data)) continue
      const raw = emptyToNull(data[key])
      update[key] = !raw ? null : encryptServerSecret(raw)
    }
  } catch (err) {
    if (err instanceof ServerError) {
      return NextResponse.json({ error: "Cifrado de credenciales no configurado (SERVER_ENCRYPTION_KEY)" }, { status: 500 })
    }
    throw err
  }

  // Un servidor SSH debe conservar algún método de autenticación.
  if (protocolo === "SSH") {
    const hasPassword = "password" in update ? Boolean(update.password) : Boolean(existing.password)
    const hasKey = "privateKey" in update ? Boolean(update.privateKey) : Boolean(existing.privateKey)
    if (!hasPassword && !hasKey) {
      return NextResponse.json(
        { error: "Un servidor SSH necesita contraseña o clave privada" },
        { status: 400 }
      )
    }
  }

  // Cambiar de host invalida la huella TOFU guardada.
  if (update.host !== undefined && update.host !== existing.host && !("fingerprint" in update)) {
    update.fingerprint = null
  }

  const server = await prisma.server.update({ where: { id }, data: update })

  await logAudit(
    authResult.session!.user.id,
    "EDITAR_SERVIDOR",
    `${server.nombre} (${server.protocolo} ${server.host}:${server.puerto})`
  )

  return NextResponse.json(sanitizeServer(server))
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  const { id } = await params
  const existing = await findServer(id)
  if (!existing) return NextResponse.json({ error: "Servidor no encontrado" }, { status: 404 })

  await prisma.server.delete({ where: { id } })
  await logAudit(
    authResult.session!.user.id,
    "ELIMINAR_SERVIDOR",
    `${existing.nombre} (${existing.host}:${existing.puerto})`
  )

  return NextResponse.json({ ok: true })
}
