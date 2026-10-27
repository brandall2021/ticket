import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { crearLinkSchema } from "@/lib/schemas"

export async function GET() {
  const session = await auth()
  if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const links = await prisma.link.findMany({
    orderBy: { title: "asc" },
  })
  return NextResponse.json(links)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const parsed = crearLinkSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", detalles: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const link = await prisma.link.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      url: parsed.data.url,
      imageUrl: parsed.data.imageUrl || "",
      activo: parsed.data.activo ?? true,
    },
  })
  return NextResponse.json(link)
}
