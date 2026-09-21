import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-auth"
import { ROLES_ADMIN_AGENT } from "@/lib/constants"
import { crearEquipoSchema } from "@/lib/schemas"

export async function GET(req: NextRequest) {
  const authResult = await requireRole(ROLES_ADMIN_AGENT)
  if (authResult.error) return authResult.error

  const q = req.nextUrl.searchParams.get("q")?.trim() || ""

  const equipos = await prisma.equipo.findMany({
    where: q
      ? {
          OR: [
            { marca: { contains: q, mode: "insensitive" } },
            { modelo: { contains: q, mode: "insensitive" } },
            { serie: { contains: q, mode: "insensitive" } },
            { nroInventario: { contains: q, mode: "insensitive" } },
            { ubicacion: { contains: q, mode: "insensitive" } },
            { ipPc: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: { tipo: true, estado: true },
    orderBy: [{ tipo: { nombre: "asc" } }, { nroInventario: "asc" }],
  })

  return NextResponse.json(equipos)
}

export async function POST(req: NextRequest) {
  const authResult = await requireRole(ROLES_ADMIN_AGENT)
  if (authResult.error) return authResult.error

  const body = await req.json()
  const parsed = crearEquipoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const [tipo, estado] = await Promise.all([
    prisma.tipoEquipo.findUnique({ where: { id: parsed.data.tipoId } }),
    prisma.estadoEquipo.findUnique({ where: { id: parsed.data.estadoId } }),
  ])
  if (!tipo || !estado) {
    return NextResponse.json({ error: "Tipo o estado no válido" }, { status: 400 })
  }

  try {
    const equipo = await prisma.equipo.create({
      data: {
        tipoId: parsed.data.tipoId,
        estadoId: parsed.data.estadoId,
        nroInventario: parsed.data.nroInventario,
        marca: parsed.data.marca,
        modelo: parsed.data.modelo,
        serie: parsed.data.serie || null,
        ubicacion: parsed.data.ubicacion || null,
        ipPc: parsed.data.ipPc || null,
      },
      include: { tipo: true, estado: true },
    })
    return NextResponse.json(equipo, { status: 201 })
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Ya existe un equipo con ese N° de inventario" }, { status: 400 })
    }
    throw e
  }
}