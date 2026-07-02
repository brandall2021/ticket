import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { prisma } from "@/lib/prisma"
import { sendEmail, resetPasswordEmail } from "@/lib/email"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json({ success: true })
    }

    if (!user.password) {
      return NextResponse.json(
        { error: "Esta cuenta usa un proveedor externo. No se puede recuperar la contraseña." },
        { status: 400 }
      )
    }

    const token = jwt.sign({ email }, process.env.AUTH_SECRET!, { expiresIn: "1h" })
    const resetUrl = `${process.env.NEXTAUTH_URL}/restablecer/${token}`

    await sendEmail({
      to: email,
      ...resetPasswordEmail({ name: user.name || user.email, url: resetUrl }),
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[recuperar] Error:", err)
    return NextResponse.json({ success: true })
  }
}