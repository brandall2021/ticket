import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/api-auth"
import { ROLES_ADMIN } from "@/lib/constants"
import { testConnection, MikrotikError } from "@/lib/mikrotik"
import { z } from "zod"

const checkSchema = z.object({
  host: z.string().min(1, "Host/IP requerida"),
  apiPort: z.number().int().min(1).max(65535).optional().default(8728),
  useTls: z.boolean().optional().default(false),
  user: z.string().min(1, "Usuario requerido"),
  password: z.string().min(1, "Contraseña requerida"),
})

export async function POST(req: NextRequest) {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  const body = await req.json()
  const parsed = checkSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Datos inválidos", detalles: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const info = await testConnection({
      host: parsed.data.host,
      apiPort: parsed.data.apiPort ?? 8728,
      useTls: parsed.data.useTls ?? false,
      user: parsed.data.user,
      password: parsed.data.password,
    })
    return NextResponse.json({ ok: true, info })
  } catch (err) {
    const msg = err instanceof MikrotikError ? err.message : err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: msg })
  }
}