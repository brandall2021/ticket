import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const usuarios = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, activo: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(usuarios)
}
