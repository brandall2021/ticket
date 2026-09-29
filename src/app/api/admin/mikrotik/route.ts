import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-auth"
import { ROLES_ADMIN } from "@/lib/constants"
import { z } from "zod"
import { logAudit } from "@/lib/audit"

const crearRouterSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  host: z.string().min(1, "Host/IP requerida"),
  apiPort: z.number().int().min(1).max(65535).optional().default(8728),
  useTls: z.boolean().optional().default(false),
  user: z.string().min(1, "Usuario requerido").default("admin"),
  password: z.string().min(1, "Contraseña requerida"),
  notificarAdmin: z.boolean().optional().default(true),
})

const actualizarRouterSchema = crearRouterSchema.partial()

export async function GET() {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  const routers = await prisma.mikrotikRouter.findMany({
    orderBy: [{ nombre: "asc" }],
  })

  return NextResponse.json(routers)
}

export async function POST(req: NextRequest) {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  const body = await req.json()
  const parsed = crearRouterSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", detalles: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const router = await prisma.mikrotikRouter.create({
    data: {
      nombre: parsed.data.nombre,
      host: parsed.data.host,
      apiPort: parsed.data.apiPort ?? 8728,
      useTls: parsed.data.useTls ?? false,
      user: parsed.data.user,
      password: parsed.data.password,
      notificarAdmin: parsed.data.notificarAdmin ?? true,
    },
  })

  await logAudit(authResult.session!.user.id, "CREAR_MIKROTIK", `Router ${router.nombre} (${router.host})`)

  return NextResponse.json(router, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  const url = new URL(req.url)
  const id = url.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 })

  const body = await req.json()
  const parsed = actualizarRouterSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", detalles: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { password, ...rest } = parsed.data

  const router = await prisma.mikrotikRouter.update({
    where: { id },
    data: {
      ...rest,
      ...(password !== undefined ? { password } : {}),
    },
  })

  await logAudit(authResult.session!.user.id, "EDITAR_MIKROTIK", `Router ${router.nombre}`)

  return NextResponse.json(router)
}

export async function DELETE(req: NextRequest) {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  const url = new URL(req.url)
  const id = url.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 })

  const existing = await prisma.mikrotikRouter.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  await prisma.mikrotikRouter.delete({ where: { id } })
  await logAudit(authResult.session!.user.id, "ELIMINAR_MIKROTIK", `Router ${existing.nombre}`)

  return NextResponse.json({ ok: true })
}