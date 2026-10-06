import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { createHash } from "node:crypto"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json()

    if (typeof password !== "string" || password.length < 6 || Buffer.byteLength(password, "utf8") > 72) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      )
    }

    let email: string
    let version: string
    try {
      const decoded = jwt.verify(token, process.env.AUTH_SECRET!, { algorithms: ["HS256"], audience: "password-reset" }) as jwt.JwtPayload
      if (typeof decoded.email !== "string" || typeof decoded.version !== "string" || decoded.purpose !== "password-reset") throw new Error("Invalid reset token")
      email = decoded.email
      version = decoded.version
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

    if (!user.password || !user.activo || createHash("sha256").update(user.password).digest("hex") !== version) {
      return NextResponse.json({ error: "Token invalido o utilizado" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const result = await prisma.user.updateMany({
      where: { id: user.id, password: user.password, activo: true },
      data: { password: hashedPassword },
    })

    if (result.count !== 1) return NextResponse.json({ error: "Token utilizado" }, { status: 400 })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[restablecer] Error:", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
