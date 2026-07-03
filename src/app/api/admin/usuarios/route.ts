import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { requireRole } from "@/lib/api-auth"
import { ROLES } from "@/lib/constants"
import { crearUsuarioSchema } from "@/lib/schemas"
import { sendEmail, nuevaCuentaEmail } from "@/lib/email"

export async function GET() {
  const authResult = await requireRole([ROLES.ADMIN])
  if (authResult.error) return authResult.error

  const usuarios = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, activo: true, lastLogin: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(usuarios)
}

export async function POST(req: NextRequest) {
  const authResult = await requireRole([ROLES.ADMIN])
  if (authResult.error) return authResult.error

  const body = await req.json()
  const parsed = crearUsuarioSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const notificar = body.notificar === true

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (existing) {
    return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 })
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 12)

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: hashedPassword,
      role: parsed.data.role || "CLIENT",
    },
    select: { id: true, name: true, email: true, role: true, activo: true, createdAt: true },
  })

  if (notificar) {
    const { subject, html } = nuevaCuentaEmail({
      nombre: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
      url: process.env.NEXTAUTH_URL || "http://localhost:3000",
    })
    await sendEmail({ to: parsed.data.email, subject, html })
  }

  return NextResponse.json(user, { status: 201 })
}