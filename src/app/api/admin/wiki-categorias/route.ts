import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-auth"
import { ROLES_ADMIN } from "@/lib/constants"
import { crearCategoriaWikiSchema } from "@/lib/schemas"

export async function GET() {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  const categorias = await prisma.categoriaWiki.findMany({
    include: { _count: { select: { articulos: true } } },
    orderBy: [{ orden: "asc" }, { nombre: "asc" }],
  })

  return NextResponse.json(categorias)
}

export async function POST(req: NextRequest) {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  const body = await req.json()
  const parsed = crearCategoriaWikiSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  try {
    const categoria = await prisma.categoriaWiki.create({
      data: {
        nombre: parsed.data.nombre,
        color: parsed.data.color || "#3b82f6",
        icono: parsed.data.icono || "BookOpen",
        orden: parsed.data.orden ?? 0,
      },
    })
    return NextResponse.json(categoria, { status: 201 })
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Ya existe una categoría con ese nombre" }, { status: 400 })
    }
    throw e
  }
}