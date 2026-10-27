import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { actualizarInternoSchema } from "@/lib/schemas"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const parsed = actualizarInternoSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", detalles: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { id } = await params
  const { asesor, turno, campania, supervision, interno, rol, activo } = parsed.data
  const item = await prisma.interno.update({
    where: { id },
    data: {
      ...(asesor !== undefined ? { asesor } : {}),
      ...(turno !== undefined ? { turno } : {}),
      ...(campania !== undefined ? { campania } : {}),
      ...(supervision !== undefined ? { supervision } : {}),
      ...(interno !== undefined ? { interno } : {}),
      ...(rol !== undefined ? { rol } : {}),
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
  await prisma.interno.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
