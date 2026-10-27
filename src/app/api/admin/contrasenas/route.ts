import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"
import { encryptServerSecret, isEncryptedServerSecret } from "@/lib/servers"

/**
 * Migra credenciales en texto plano al formato cifrado. Las filas nuevas ya se
 * guardan cifradas; esto cubre los registros previos.
 */
async function ensureEncrypted() {
  const rows = await prisma.password.findMany({
    select: { id: true, contrasena: true },
  })
  await Promise.all(
    rows
      .filter(row => row.contrasena && !isEncryptedServerSecret(row.contrasena))
      .map(row =>
        prisma.password
          .update({
            where: { id: row.id },
            data: { contrasena: encryptServerSecret(row.contrasena) },
          })
          .catch(() => null)
      )
  )
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  try {
    await ensureEncrypted()
  } catch (err) {
    console.error("[contrasenas] No se pudieron cifrar credenciales pendientes:", err)
  }

  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q") || ""

  const where: Record<string, unknown> = {}

  if (q) {
    // La contraseña no se puede buscar: está cifrada.
    where.OR = [
      { ip: { contains: q, mode: "insensitive" } },
      { usuario: { contains: q, mode: "insensitive" } },
      { funcion: { contains: q, mode: "insensitive" } },
      { descripcion: { contains: q, mode: "insensitive" } },
    ]
  }

  const passwords = await prisma.password.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { autor: { select: { name: true, email: true } } },
  })

  // Nunca se devuelve el secreto en el listado: sólo se indica si existe.
  return NextResponse.json(
    passwords.map(({ contrasena, ...rest }) => ({
      ...rest,
      tieneContrasena: Boolean(contrasena),
    }))
  )
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const body = await req.json()
  const { ip, usuario, contrasena, funcion, descripcion } = body

  if (!ip || !usuario || !contrasena || !funcion || !descripcion) {
    return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
  }

  let encrypted: string
  try {
    encrypted = encryptServerSecret(String(contrasena))
  } catch {
    return NextResponse.json({ error: "Cifrado de credenciales no configurado (SERVER_ENCRYPTION_KEY)" }, { status: 500 })
  }

  const password = await prisma.password.create({
    data: {
      ip: String(ip),
      usuario: String(usuario),
      contrasena: encrypted,
      funcion: String(funcion),
      descripcion: String(descripcion),
      autorId: session.user.id!,
    },
  })

  await logAudit(session.user.id!, "CREAR_CONTRASENA", `Credencial para ${usuario}@${ip}`)

  const { contrasena: _omit, ...safe } = password
  void _omit
  return NextResponse.json({ ...safe, tieneContrasena: true }, { status: 201 })
}
