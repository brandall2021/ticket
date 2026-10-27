import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { createHash } from "node:crypto"
import { prisma } from "@/lib/prisma"
import { sendEmail, resetPasswordEmail } from "@/lib/email"
import { clientIp, consume, rateLimitResponse } from "@/lib/rate-limit"

const RECUPERAR_LIMIT = 5
const RECUPERAR_WINDOW_MS = 60 * 60 * 1000

export async function POST(req: Request) {
  const limit = consume(`recuperar:${clientIp(req)}`, RECUPERAR_LIMIT, RECUPERAR_WINDOW_MS)
  if (!limit.ok) return rateLimitResponse(limit)

  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    // Respuesta uniforme: no se revela si el email existe ni si usa OAuth.
    if (!user || !user.password) {
      return NextResponse.json({ success: true })
    }

    const version = createHash("sha256").update(user.password).digest("hex")
    const token = jwt.sign({ email, version, purpose: "password-reset" }, process.env.AUTH_SECRET!, { expiresIn: "1h", audience: "password-reset" })
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
