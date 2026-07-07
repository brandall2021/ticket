import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

  const data = await req.json()
  const link = await prisma.link.create({ data })
  return NextResponse.json(link)
}
