import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { requireAuth } from "@/lib/api-auth"
import { sendEmail, passwordCambiadaEmail } from "@/lib/email"

export async function GET() {
  const { session, error } = await requireAuth()
  if (error) return error

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { id: true, name: true, apellido: true, interno: true, cargo: true, email: true, role: true, createdAt: true },
  })

  return NextResponse.json(user)
}

export async function PATCH(req: NextRequest) {
  const { session, error } = await requireAuth()
  if (error) return error

  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.name !== undefined) data.name = body.name
  if (body.apellido !== undefined) data.apellido = body.apellido
  if (body.interno !== undefined) data.interno = body.interno

  if (body.currentPassword && body.newPassword) {
    const user = await prisma.user.findUnique({ where: { id: session!.user.id } })
    if (!user?.password) {
      return NextResponse.json({ error: "No se puede cambiar la contraseña de cuentas OAuth" }, { status: 400 })
    }
    const match = await bcrypt.compare(body.currentPassword, user.password)
    if (!match) {
      return NextResponse.json({ error: "La contraseña actual no es correcta" }, { status: 400 })
    }
    if (body.newPassword.length < 6) {
      return NextResponse.json({ error: "La nueva contraseña debe tener al menos 6 caracteres" }, { status: 400 })
    }
    data.password = await bcrypt.hash(body.newPassword, 12)
  }

  const updated = await prisma.user.update({
    where: { id: session!.user.id },
    data,
    select: { id: true, name: true, apellido: true, interno: true, cargo: true, email: true, role: true },
  })

  if (body.newPassword) {
    const { subject, html } = passwordCambiadaEmail({
      nombre: updated.name,
      email: updated.email,
      password: body.newPassword,
      url: process.env.NEXTAUTH_URL || "http://localhost:3000",
    })
    await sendEmail({ to: updated.email, subject, html })
  }

  return NextResponse.json(updated)
}
