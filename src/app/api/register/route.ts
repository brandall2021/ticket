import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"
import { sendEmail, nuevaCuentaEmail } from "@/lib/email"
import { passwordSchema } from "@/lib/schemas"
import { clientIp, consume, rateLimitResponse } from "@/lib/rate-limit"

const DOMINIO_PERMITIDO = "recuperocrediticio.com.ar"
const REGISTER_LIMIT = 5
const REGISTER_WINDOW_MS = 60 * 60 * 1000

export async function POST(req: Request) {
  // Frena el alta masiva y el bombardeo de correos a direcciones del dominio.
  const limit = consume(`register:${clientIp(req)}`, REGISTER_LIMIT, REGISTER_WINDOW_MS)
  if (!limit.ok) return rateLimitResponse(limit)

  try {
    const { nombre, apellido, interno, cargo, email, password } = await req.json()

    if (!nombre || !apellido || !interno || !cargo || !email || !password) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      )
    }

    const emailLower = String(email).toLowerCase().trim()

    // Se exige ASCII puro para evitar homóglifos (Unicode) en el dominio.
    const emailPattern = new RegExp(`^[a-z0-9._%+-]+@${DOMINIO_PERMITIDO.replace(/\./g, "\\.")}$`)
    if (!emailPattern.test(emailLower)) {
      return NextResponse.json(
        { error: `Solo se permiten correos del dominio @${DOMINIO_PERMITIDO}` },
        { status: 400 }
      )
    }

    const parsedPassword = passwordSchema.safeParse(password)
    if (!parsedPassword.success) {
      return NextResponse.json(
        { error: parsedPassword.error.issues[0]?.message || "Contraseña inválida" },
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

    const hashedPassword = await bcrypt.hash(parsedPassword.data, 12)

    const user = await prisma.user.create({
      data: {
        name: `${nombre.trim()} ${apellido.trim()}`,
        apellido: apellido.trim(),
        interno: interno.trim(),
        cargo: cargo.trim(),
        email: emailLower,
        password: hashedPassword,
        passwordChangedAt: new Date(),
        role: "CLIENT",
      },
      select: { id: true, name: true, email: true, role: true },
    })

    await logAudit(user.id, "REGISTRO", `Usuario ${emailLower} registrado`)

    const { subject, html } = nuevaCuentaEmail({
      nombre: `${nombre.trim()} ${apellido.trim()}`,
      email: emailLower,
      password: parsedPassword.data,
      url: process.env.NEXTAUTH_URL || "http://localhost:3000",
    })
    await sendEmail({ to: emailLower, subject, html })

    return NextResponse.json(user, { status: 201 })
  } catch (err) {
    console.error("[register] Error:", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
