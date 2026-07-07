import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

  const data = await req.json()
  const interno = await prisma.interno.create({ data })
  return NextResponse.json(interno)
}
