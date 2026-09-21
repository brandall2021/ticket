import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-auth"
import { ROLES_ADMIN_AGENT } from "@/lib/constants"
import { crearArticuloWikiSchema } from "@/lib/schemas"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const articulo = await prisma.articuloWiki.findUnique({
    where: { id },
    include: { categoria: true },
  })
  if (!articulo) {
    return NextResponse.json({ error: "Artículo no encontrado" }, { status: 404 })
  }
  return NextResponse.json(articulo)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(ROLES_ADMIN_AGENT)
  if (authResult.error) return authResult.error

  const { id } = await params
  const body = await req.json()
  const parsed = crearArticuloWikiSchema.partial().safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  if (parsed.data.categoriaId) {
    const categoria = await prisma.categoriaWiki.findUnique({ where: { id: parsed.data.categoriaId } })
    if (!categoria) {
      return NextResponse.json({ error: "Categoría no válida" }, { status: 400 })
    }
  }

  const articulo = await prisma.articuloWiki.update({
    where: { id },
    data: {
      categoriaId: parsed.data.categoriaId,
      titulo: parsed.data.titulo,
      resumen: parsed.data.resumen === undefined ? undefined : parsed.data.resumen || null,
      contenido: parsed.data.contenido === undefined ? undefined : parsed.data.contenido || null,
    },
    include: { categoria: true },
  })

  return NextResponse.json(articulo)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(ROLES_ADMIN_AGENT)
  if (authResult.error) return authResult.error

  const { id } = await params
  await prisma.articuloWiki.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}