import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-auth"
import { ROLES_ADMIN } from "@/lib/constants"
import { crearCategoriaWikiSchema } from "@/lib/schemas"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  const { id } = await params
  const body = await req.json()
  const parsed = crearCategoriaWikiSchema.partial().safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  try {
    const categoria = await prisma.categoriaWiki.update({
      where: { id },
      data: {
        nombre: parsed.data.nombre,
        color: parsed.data.color,
        icono: parsed.data.icono,
        orden: parsed.data.orden,
      },
    })
    return NextResponse.json(categoria)
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Ya existe una categoría con ese nombre" }, { status: 400 })
    }
    throw e
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  const { id } = await params
  const count = await prisma.articuloWiki.count({ where: { categoriaId: id } })
  if (count > 0) {
    return NextResponse.json({ error: `No se puede eliminar: la categoría tiene ${count} artículo(s)` }, { status: 400 })
  }

  await prisma.categoriaWiki.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}