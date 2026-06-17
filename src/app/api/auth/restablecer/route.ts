import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json()

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      )
    }

    let email: string
    try {
      const decoded = jwt.verify(token, process.env.AUTH_SECRET!) as { email: string }
      email = decoded.email
    } catch {
      return NextResponse.json(
        { error: "Token inválido o expirado" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
