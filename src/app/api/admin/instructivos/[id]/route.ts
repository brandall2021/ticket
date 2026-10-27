import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { actualizarInstructivoSchema } from "@/lib/schemas"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const parsed = actualizarInstructivoSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", detalles: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { id } = await params
  const { title, description, url, imageUrl, contenido, activo } = parsed.data
  const item = await prisma.instructivo.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(url !== undefined ? { url } : {}),
      ...(imageUrl !== undefined ? { imageUrl: imageUrl || "" } : {}),
      ...(contenido !== undefined ? { contenido } : {}),
      ...(activo !== undefined ? { activo } : {}),
    },
  })
  return NextResponse.json(item)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  await prisma.instructivo.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
