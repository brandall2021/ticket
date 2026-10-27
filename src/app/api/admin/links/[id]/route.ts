import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { actualizarLinkSchema } from "@/lib/schemas"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const parsed = actualizarLinkSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", detalles: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { id } = await params
  const { title, description, url, imageUrl, activo } = parsed.data
  const link = await prisma.link.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(url !== undefined ? { url } : {}),
      ...(imageUrl !== undefined ? { imageUrl: imageUrl || "" } : {}),
      ...(activo !== undefined ? { activo } : {}),
    },
  })
  return NextResponse.json(link)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  await prisma.link.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
