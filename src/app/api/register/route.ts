import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"
import { sendEmail, nuevaCuentaEmail } from "@/lib/email"

const DOMINIO_PERMITIDO = "recuperocrediticio.com.ar"

export async function POST(req: Request) {
  try {
    const { nombre, apellido, interno, cargo, email, password } = await req.json()

    if (!nombre || !apellido || !interno || !cargo || !email || !password) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      )
    }

    const emailLower = email.toLowerCase().trim()

    if (!emailLower.endsWith(`@${DOMINIO_PERMITIDO}`)) {
      return NextResponse.json(
        { error: `Solo se permiten correos del dominio @${DOMINIO_PERMITIDO}` },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({ where: { email: emailLower } })
    if (existing) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name: `${nombre.trim()} ${apellido.trim()}`,
        apellido: apellido.trim(),
        interno: interno.trim(),
        cargo: cargo.trim(),
        email: emailLower,
        password: hashedPassword,
        role: "CLIENT",
      },
      select: { id: true, name: true, email: true, role: true },
    })

    await logAudit(user.id, "REGISTRO", `Usuario ${emailLower} registrado`)

    const { subject, html } = nuevaCuentaEmail({
      nombre: `${nombre.trim()} ${apellido.trim()}`,
      email: emailLower,
      password,
      url: process.env.NEXTAUTH_URL || "http://localhost:3000",
    })
    await sendEmail({ to: emailLower, subject, html })

    return NextResponse.json(user, { status: 201 })
  } catch (err) {
    console.error("[register] Error:", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
