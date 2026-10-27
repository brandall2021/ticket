import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { crearInstructivoSchema } from "@/lib/schemas"

export async function GET() {
  const session = await auth()
  if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const items = await prisma.instructivo.findMany({
    orderBy: { title: "asc" },
  })
  return NextResponse.json(items)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const parsed = crearInstructivoSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", detalles: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const item = await prisma.instructivo.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description || "Instructivo de Gestión",
      url: parsed.data.url,
      imageUrl: parsed.data.imageUrl || "",
      contenido: parsed.data.contenido ?? null,
      activo: parsed.data.activo ?? true,
    },
  })
  return NextResponse.json(item)
}
