import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-auth"
import { ROLES_ADMIN_AGENT } from "@/lib/constants"
import { crearArticuloWikiSchema } from "@/lib/schemas"

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() || ""

  const articulos = await prisma.articuloWiki.findMany({
    where: {
      activo: true,
      ...(q
        ? {
            OR: [
              { titulo: { contains: q, mode: "insensitive" } },
              { resumen: { contains: q, mode: "insensitive" } },
              { contenido: { contains: q, mode: "insensitive" } },
              { categoria: { nombre: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: { categoria: true },
    orderBy: [{ categoria: { orden: "asc" } }, { titulo: "asc" }],
  })

  return NextResponse.json(articulos)
}

export async function POST(req: NextRequest) {
  const authResult = await requireRole(ROLES_ADMIN_AGENT)
  if (authResult.error) return authResult.error

  const body = await req.json()
  const parsed = crearArticuloWikiSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const categoria = await prisma.categoriaWiki.findUnique({ where: { id: parsed.data.categoriaId } })
  if (!categoria) {
    return NextResponse.json({ error: "Categoría no válida" }, { status: 400 })
  }

  const articulo = await prisma.articuloWiki.create({
    data: {
      categoriaId: parsed.data.categoriaId,
      titulo: parsed.data.titulo,
      resumen: parsed.data.resumen || null,
      contenido: parsed.data.contenido || null,
    },
    include: { categoria: true },
  })

  return NextResponse.json(articulo, { status: 201 })
}