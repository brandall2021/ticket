import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { crearInternoSchema } from "@/lib/schemas"

export async function GET() {
  const session = await auth()
  if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const internos = await prisma.interno.findMany({
    orderBy: [{ turno: "asc" }, { asesor: "asc" }],
  })
  return NextResponse.json(internos)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const parsed = crearInternoSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", detalles: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const interno = await prisma.interno.create({
    data: {
      asesor: parsed.data.asesor,
      turno: parsed.data.turno,
      campania: parsed.data.campania,
      supervision: parsed.data.supervision,
      interno: parsed.data.interno,
      rol: parsed.data.rol,
      activo: parsed.data.activo ?? true,
    },
  })
  return NextResponse.json(interno)
}
