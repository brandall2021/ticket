import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { randomInt } from "node:crypto"
import { requireRole } from "@/lib/api-auth"
import { ROLES } from "@/lib/constants"
import { sendEmail, nuevaCuentaEmail } from "@/lib/email"

function generatePassword(length = 16) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  // `randomInt` usa el CSPRNG del sistema (Math.random no es seguro para secretos).
  for (let i = 0; i < length; i++) {
    result += chars.charAt(randomInt(0, chars.length))
  }
  return result
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole([ROLES.ADMIN])
  if (authResult.error) return authResult.error

  const { id } = await params

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
  }

  const newPassword = generatePassword()
  const hashedPassword = await bcrypt.hash(newPassword, 12)

  await prisma.user.update({
    where: { id },
    data: { password: hashedPassword, passwordChangedAt: new Date() },
  })

  const { subject, html } = nuevaCuentaEmail({
    nombre: user.name,
    email: user.email,
    password: newPassword,
    url: process.env.NEXTAUTH_URL || "http://localhost:3000",
  })
  await sendEmail({ to: user.email, subject, html })

  return NextResponse.json({ success: true })
}
